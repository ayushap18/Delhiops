const cache = require('./cache');
const dataService = require('./dataService');
const cacheKeys = require('../utils/cacheKeys');
const logger = require('../utils/logger');
const { DEFAULT_LIMITS } = require('./cacheWarmer');
const { getPolicy } = require('./cachePolicies');

const createJob = (label, intervalMs, handler) => {
    const job = setInterval(async () => {
        try {
            await handler();
            logger.info(`Cache refresh completed: ${label}`);
        } catch (err) {
            logger.warn(`Cache refresh failed: ${label}`, { message: err.message });
        }
    }, intervalMs);
    return job;
};

const startCacheJobs = () => {
    const jobs = [];
    const aqiPolicy = getPolicy('aqi');
    const trafficPolicy = getPolicy('traffic');
    const cameraPolicy = getPolicy('cameras');
    const incidentPolicy = getPolicy('incidents');
    const crimePolicy = getPolicy('crime');

    jobs.push(
        createJob('aqi', aqiPolicy.ttlSeconds * 1000, async () => {
            const aqi = await dataService.getAqiReadings(DEFAULT_LIMITS.aqi);
            await cache.setJson(cacheKeys.aqiList(DEFAULT_LIMITS.aqi), aqi, aqiPolicy.ttlSeconds, aqiPolicy);
        })
    );

    jobs.push(
        createJob('traffic', trafficPolicy.ttlSeconds * 1000, async () => {
            const traffic = await dataService.getTrafficData(DEFAULT_LIMITS.traffic);
            await cache.setJson(
                cacheKeys.trafficList(DEFAULT_LIMITS.traffic),
                traffic,
                trafficPolicy.ttlSeconds,
                trafficPolicy
            );
        })
    );

    jobs.push(
        createJob('cameras', cameraPolicy.ttlSeconds * 1000, async () => {
            const cameras = await dataService.getCameras(DEFAULT_LIMITS.cameras);
            await cache.setJson(
                cacheKeys.camerasList(DEFAULT_LIMITS.cameras),
                cameras,
                cameraPolicy.ttlSeconds,
                cameraPolicy
            );
        })
    );

    jobs.push(
        createJob('incidents', incidentPolicy.ttlSeconds * 1000, async () => {
            const incidents = await dataService.getIncidents(DEFAULT_LIMITS.incidents);
            await cache.setJson(
                cacheKeys.incidentsList(DEFAULT_LIMITS.incidents),
                incidents,
                incidentPolicy.ttlSeconds,
                incidentPolicy
            );
        })
    );

    jobs.push(
        createJob('crime', crimePolicy.ttlSeconds * 1000, async () => {
            const crime = await dataService.getCrimeReports(DEFAULT_LIMITS.crime);
            await cache.setJson(cacheKeys.crimeList(DEFAULT_LIMITS.crime), crime, crimePolicy.ttlSeconds, crimePolicy);
        })
    );

    logger.info('Cache refresh jobs scheduled');
    return () => jobs.forEach((job) => clearInterval(job));
};

module.exports = {
    startCacheJobs,
};
