const cache = require('./cache');
const cacheKeys = require('../utils/cacheKeys');
const dataService = require('./dataService');
const { getPolicy } = require('./cachePolicies');
const logger = require('../utils/logger');

const transitions = new Map();
const lastAccessByUser = new Map();
const scheduled = [];

const transitionKey = (from, to) => `${from}=>${to}`;

const recordAccess = (userId, cacheKey) => {
    if (!userId || !cacheKey) return;
    const previous = lastAccessByUser.get(userId);
    if (previous) {
        const key = transitionKey(previous, cacheKey);
        transitions.set(key, (transitions.get(key) || 0) + 1);
    }
    lastAccessByUser.set(userId, cacheKey);
};

const topNextKeys = (fromKey, limit = 3) => {
    const candidates = [];
    for (const [key, count] of transitions.entries()) {
        const [from, to] = key.split('=>');
        if (from === fromKey) {
            candidates.push({ to, count });
        }
    }
    return candidates.sort((a, b) => b.count - a.count).slice(0, limit).map((item) => item.to);
};

const prefetchKey = async (key, fetcher, policy) => {
    try {
        await cache.withCache(key, policy, fetcher);
    } catch (err) {
        logger.warn('Prefetch failed', { key, message: err.message });
    }
};

const preloadLikelyNext = async (currentKey) => {
    const nextKeys = topNextKeys(currentKey, 3);
    const tasks = [];
    nextKeys.forEach((key) => {
        if (key.startsWith('cameras:latest:')) {
            const limit = parseInt(key.split(':').pop(), 10) || 200;
            tasks.push(prefetchKey(key, () => dataService.getCameras(limit), getPolicy('cameras')));
        }
        if (key.startsWith('traffic:latest:')) {
            const limit = parseInt(key.split(':').pop(), 10) || 50;
            tasks.push(prefetchKey(key, () => dataService.getTrafficData(limit), getPolicy('traffic')));
        }
    });
    await Promise.all(tasks);
};

const msUntil = (hours, minutes = 0) => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }
    return target.getTime() - now.getTime();
};

const scheduleDaily = (hours, minutes, fn) => {
    const timeout = setTimeout(async () => {
        await fn();
        const interval = setInterval(fn, 24 * 60 * 60 * 1000);
        scheduled.push(interval);
    }, msUntil(hours, minutes));
    scheduled.push(timeout);
};

const scheduleRushHourPreloading = () => {
    scheduleDaily(7, 30, async () => {
        logger.info('Rush-hour preload started: morning');
        await prefetchKey(
            cacheKeys.trafficList(100),
            () => dataService.getTrafficData(100),
            getPolicy('traffic')
        );
    });
    scheduleDaily(17, 0, async () => {
        logger.info('Rush-hour preload started: evening');
        await prefetchKey(
            cacheKeys.trafficList(100),
            () => dataService.getTrafficData(100),
            getPolicy('traffic')
        );
    });
};

const stopPreloader = () => {
    scheduled.forEach((timer) => clearTimeout(timer));
    scheduled.length = 0;
};

const getPreloaderStats = () => ({
    transitions: transitions.size,
    trackedUsers: lastAccessByUser.size,
});

module.exports = {
    recordAccess,
    preloadLikelyNext,
    scheduleRushHourPreloading,
    stopPreloader,
    getPreloaderStats,
};
