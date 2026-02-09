const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const metrics = require('./socketMetrics');

let io;
let adapterClients = null;
const connectionsByIp = new Map();
const lastActivityById = new Map();
const batchQueues = new Map();
let batchInterval = null;
let idleInterval = null;
let latencyInterval = null;

const getClientIp = (socket) => {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return socket.handshake.address || 'unknown';
};

const sanitizeRooms = (rooms = []) => {
    const basePattern = /^(type|severity):[a-zA-Z0-9_-]+$/;
    const locationPattern = /^location:-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    return rooms.filter((room) => {
        if (room === 'all') return true;
        if (room.startsWith('location:')) {
            return locationPattern.test(room);
        }
        return basePattern.test(room);
    });
};

const scheduleBatchFlush = () => {
    if (batchInterval) return;
    batchInterval = setInterval(() => {
        if (!io || batchQueues.size === 0) return;
        for (const [key, queue] of batchQueues.entries()) {
            if (queue.items.length === 0) continue;
            const payload = { batch: true, items: queue.items };
            if (queue.rooms.length > 0) {
                queue.rooms.forEach((room) => io.to(room).emit(queue.event, payload));
            } else {
                io.emit(queue.event, payload);
            }
            metrics.recordMessageSent(1);
            batchQueues.set(key, { ...queue, items: [] });
        }
    }, config.socket.batchIntervalMs);
};

const enqueueBatch = (event, payload, rooms) => {
    const roomsKey = rooms.length > 0 ? rooms.join(',') : 'broadcast';
    const key = `${event}:${roomsKey}`;
    const existing = batchQueues.get(key) || { event, rooms, items: [] };
    existing.items.push(payload);
    batchQueues.set(key, existing);
};

const initAdapter = async () => {
    if (!config.socket.redisAdapterEnabled) return;
    const baseClient = createClient({
        socket: {
            host: config.redis.host,
            port: config.redis.port,
        },
        password: config.redis.password,
    });
    const subClient = baseClient.duplicate();
    await baseClient.connect();
    await subClient.connect();
    adapterClients = { baseClient, subClient };
    io.adapter(createAdapter(baseClient, subClient));
    logger.info('Socket.IO Redis adapter enabled');
};

const initSocket = async (server) => {
    io = new Server(server, {
        cors: {
            origin: config.cors.origin,
            methods: ['GET', 'POST'],
        },
        perMessageDeflate: config.socket.perMessageDeflate,
        pingInterval: config.socket.pingIntervalMs,
        pingTimeout: config.socket.pingTimeoutMs,
        connectionStateRecovery: {
            maxDisconnectionDuration: config.socket.recoveryMaxDurationMs,
            skipMiddlewares: true,
        },
    });

    await initAdapter();

    io.use((socket, next) => {
        const authHeader = socket.handshake.headers.authorization;
        const token =
            socket.handshake.auth?.token ||
            (authHeader ? authHeader.split(' ')[1] : null);
        if (!token) {
            metrics.recordError();
            return next(new Error('Unauthorized'));
        }
        try {
            const payload = jwt.verify(token, config.jwt.secret);
            socket.user = payload;
            return next();
        } catch (err) {
            metrics.recordError();
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const ip = getClientIp(socket);
        const current = connectionsByIp.get(ip) || 0;
        if (current >= config.socket.maxConnectionsPerIp) {
            socket.emit('error', { message: 'Connection limit exceeded' });
            socket.disconnect(true);
            metrics.recordError();
            return;
        }
        connectionsByIp.set(ip, current + 1);
        metrics.recordConnection();
        lastActivityById.set(socket.id, Date.now());

        logger.info('WebSocket client connected', { id: socket.id, role: socket.user?.role, ip });

        socket.onAny(() => {
            lastActivityById.set(socket.id, Date.now());
            metrics.recordMessageReceived();
        });

        socket.on('subscribe', (payload = {}) => {
            const rooms = sanitizeRooms(
                Array.isArray(payload.rooms) ? payload.rooms : payload.room ? [payload.room] : []
            );
            rooms.forEach((room) => socket.join(room));
            socket.emit('subscription:ack', { rooms });
        });

        socket.on('unsubscribe', (payload = {}) => {
            const rooms = sanitizeRooms(
                Array.isArray(payload.rooms) ? payload.rooms : payload.room ? [payload.room] : []
            );
            rooms.forEach((room) => socket.leave(room));
            socket.emit('unsubscription:ack', { rooms });
        });

        socket.on('latency:pong', (sentAt) => {
            if (!sentAt) return;
            metrics.recordLatency(Date.now() - sentAt);
        });

        socket.on('disconnect', () => {
            logger.info('WebSocket client disconnected', { id: socket.id });
            const count = connectionsByIp.get(ip) || 1;
            connectionsByIp.set(ip, Math.max(0, count - 1));
            metrics.recordDisconnection();
            lastActivityById.delete(socket.id);
        });
    });

    scheduleBatchFlush();
    if (!idleInterval) {
        idleInterval = setInterval(() => {
            const now = Date.now();
            for (const [socketId, lastActivity] of lastActivityById.entries()) {
                if (now - lastActivity > config.socket.idleTimeoutMs) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit('error', { message: 'Idle timeout' });
                        socket.disconnect(true);
                    }
                }
            }
        }, Math.max(10000, config.socket.idleTimeoutMs / 2));
    }

    if (!latencyInterval) {
        latencyInterval = setInterval(() => {
            if (!io) return;
            io.emit('latency:ping', Date.now());
        }, 30000);
    }

    io.engine.on('connection_error', (err) => {
        metrics.recordError();
        logger.warn('WebSocket connection error', { message: err.message });
    });

    return io;
};

const buildRooms = (options) => {
    if (Array.isArray(options)) {
        return sanitizeRooms(options);
    }
    const rooms = [];
    if (options?.rooms) {
        rooms.push(...options.rooms);
    }
    if (options?.type) {
        rooms.push(`type:${options.type}`);
    }
    if (options?.severity) {
        rooms.push(`severity:${options.severity}`);
    }
    if (options?.location) {
        const { lat, lng } = options.location;
        if (typeof lat === 'number' && typeof lng === 'number') {
            rooms.push(`location:${lat.toFixed(2)},${lng.toFixed(2)}`);
        }
    }
    return sanitizeRooms([...new Set(rooms)]);
};

const emitEvent = (event, payload, options = []) => {
    if (!io) return;
    const batchEvents = new Set(config.socket.batchEvents);
    const rooms = buildRooms(options);
    if (batchEvents.has(event)) {
        enqueueBatch(event, payload, rooms);
        return;
    }
    if (rooms.length > 0) {
        rooms.forEach((room) => io.to(room).emit(event, payload));
    } else {
        io.emit(event, payload);
    }
    metrics.recordMessageSent(1);
};

const getSocketMetrics = () => metrics.snapshot();

const shutdownSocket = async () => {
    if (batchInterval) clearInterval(batchInterval);
    if (idleInterval) clearInterval(idleInterval);
    if (latencyInterval) clearInterval(latencyInterval);
    batchInterval = null;
    idleInterval = null;
    latencyInterval = null;
    if (io) {
        await io.close();
        io = null;
    }
    if (adapterClients) {
        await adapterClients.subClient.quit();
        await adapterClients.baseClient.quit();
        adapterClients = null;
    }
};

module.exports = {
    initSocket,
    emitEvent,
    getSocketMetrics,
    shutdownSocket,
};
