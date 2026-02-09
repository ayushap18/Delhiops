const { createClient } = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

const redisClient = createClient({
    socket: {
        host: config.redis.host,
        port: config.redis.port,
    },
    password: config.redis.password,
});

redisClient.on('error', (err) => {
    logger.error('Redis client error', { message: err.message });
});

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        logger.info('Connected to Redis');
    }
};

const healthCheck = async () => {
    await connectRedis();
    await redisClient.ping();
    return true;
};

module.exports = {
    redisClient,
    connectRedis,
    healthCheck,
};
