const cache = require('./cache');
const dataService = require('./dataService');
const cacheKeys = require('../utils/cacheKeys');
const logger = require('../utils/logger');
const { getPolicy } = require('./cachePolicies');

const DEFAULT_LIMITS = {
    aqi: 50,
    crime: 50,
    traffic: 50,
    cameras: 200,
    incidents: 50,
};

const warmCache = async () => {
    try {
        const [aqi, crime, traffic, cameras, incidents] = await Promise.all([
            dataService.getAqiReadings(DEFAULT_LIMITS.aqi),
            dataService.getCrimeReports(DEFAULT_LIMITS.crime),
            dataService.getTrafficData(DEFAULT_LIMITS.traffic),
            dataService.getCameras(DEFAULT_LIMITS.cameras),
            dataService.getIncidents(DEFAULT_LIMITS.incidents),
        ]);

        await Promise.all([
            cache.setJson(
                cacheKeys.aqiList(DEFAULT_LIMITS.aqi),
                aqi,
                getPolicy('aqi').ttlSeconds,
                getPolicy('aqi')
            ),
            cache.setJson(
                cacheKeys.crimeList(DEFAULT_LIMITS.crime),
                crime,
                getPolicy('crime').ttlSeconds,
                getPolicy('crime')
            ),
            cache.setJson(
                cacheKeys.trafficList(DEFAULT_LIMITS.traffic),
                traffic,
                getPolicy('traffic').ttlSeconds,
                getPolicy('traffic')
            ),
            cache.setJson(
                cacheKeys.camerasList(DEFAULT_LIMITS.cameras),
                cameras,
                getPolicy('cameras').ttlSeconds,
                getPolicy('cameras')
            ),
            cache.setJson(
                cacheKeys.incidentsList(DEFAULT_LIMITS.incidents),
                incidents,
                getPolicy('incidents').ttlSeconds,
                getPolicy('incidents')
            ),
            cache.setJson(
                'config:static:v1',
                {
                    appName: 'Delhi Ops Dashboard',
                    cacheWarmedAt: new Date().toISOString(),
                },
                getPolicy('staticConfig').ttlSeconds,
                getPolicy('staticConfig')
            ),
        ]);

        logger.info('Cache warm completed');
    } catch (err) {
        logger.warn('Cache warm failed', { message: err.message });
    }
};

module.exports = {
    warmCache,
    DEFAULT_LIMITS,
};
