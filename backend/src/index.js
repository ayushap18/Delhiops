const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const config = require('./config');
const logger = require('./utils/logger');
const { initSocket, shutdownSocket } = require('./services/socket');
const { connectRedis, healthCheck: redisHealth } = require('./services/redis');
const { healthCheck: dbHealth, close: closeDb } = require('./services/db');
const { warmCache } = require('./services/cacheWarmer');
const { startCacheJobs } = require('./services/cacheJobs');
const { seedAdminUser } = require('./services/seed');
const { scheduleRushHourPreloading, stopPreloader } = require('./services/cachePreloader');
const requestId = require('./api/middlewares/requestId');
const requestLogger = require('./api/middlewares/requestLogger');
const errorHandler = require('./api/middlewares/errorHandler');
const { notFound: notFoundError } = require('./utils/errors');

const app = express();
const server = http.createServer(app);

const PORT = config.port;

// Basic security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));

// Rate limiting
const limiter = rateLimit({
	windowMs: config.rateLimit.windowMs,
	max: config.rateLimit.max,
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

// Request throttling
const speedLimiter = slowDown({
    windowMs: config.throttle.windowMs,
    delayAfter: config.throttle.delayAfter,
    delayMs: () => config.throttle.delayMs,
});
app.use(speedLimiter);

// Response compression
app.use(compression());

app.use(express.json({ limit: '1mb' }));

// Request correlation ID and logging
app.use(requestId);
app.use(requestLogger);

app.use('/assets', express.static(path.join(__dirname, 'public')));

app.get('/cache-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cache-dashboard.html'));
});

app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'service-worker.js'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/health/ready', async (req, res) => {
    try {
        await Promise.all([dbHealth(), redisHealth()]);
        res.status(200).json({ status: 'READY' });
    } catch (err) {
        res.status(503).json({ status: 'UNAVAILABLE' });
    }
});

// API documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API v1 router
const apiV1Router = require('./api/routes');
app.use('/api/v1', apiV1Router);

// 404 catch-all
app.use((req, res, next) => {
    next(notFoundError(`Route ${req.method} ${req.path} not found`));
});

// Global error handler (must be last)
app.use(errorHandler);

let stopCacheJobs;

const startServer = async () => {
    try {
        await connectRedis();
        await seedAdminUser();
        if (config.cache.warmOnStart) {
            await warmCache();
        }
        scheduleRushHourPreloading();
        stopCacheJobs = startCacheJobs();
        await initSocket(server);
        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        logger.error('Failed to start server', { message: err.message });
        process.exit(1);
    }
};

startServer();

const shutdown = async () => {
    logger.info('Shutting down server');
    if (stopCacheJobs) stopCacheJobs();
    stopPreloader();
    await shutdownSocket();
    await closeDb();
    try {
        const { redisClient } = require('./services/redis');
        if (redisClient.isOpen) {
            await redisClient.quit();
        }
    } catch (err) {
        logger.warn('Redis shutdown failed', { message: err.message });
    }
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server };
