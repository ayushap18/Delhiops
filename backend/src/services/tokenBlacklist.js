const { redisClient } = require('./redis');
const logger = require('../utils/logger');

const KEY_PREFIX = 'blacklist:';

const blacklistToken = async (jti, ttlSeconds) => {
    await redisClient.set(`${KEY_PREFIX}${jti}`, '1', { EX: ttlSeconds });
    logger.info('Token blacklisted', { jti, ttlSeconds });
};

const isBlacklisted = async (jti) => {
    if (!jti) return false;
    const result = await redisClient.get(`${KEY_PREFIX}${jti}`);
    return result !== null;
};

module.exports = {
    blacklistToken,
    isBlacklisted,
};
