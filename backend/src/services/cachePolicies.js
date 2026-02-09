const config = require('../config');

const policies = {
    aqi: {
        ttlSeconds: config.cache.ttl.aqi,
        staleTtlSeconds: config.cache.stale.aqi,
        strategy: 'stale_while_revalidate',
    },
    traffic: {
        ttlSeconds: config.cache.ttl.traffic,
        staleTtlSeconds: config.cache.stale.traffic,
        strategy: 'background_refresh',
    },
    cameras: {
        ttlSeconds: config.cache.ttl.cameras,
        staleTtlSeconds: 0,
        strategy: 'standard',
    },
    crime: {
        ttlSeconds: config.cache.ttl.crime,
        staleTtlSeconds: 0,
        strategy: 'standard',
    },
    incidents: {
        ttlSeconds: config.cache.ttl.incidents,
        staleTtlSeconds: 0,
        strategy: 'standard',
    },
    staticConfig: {
        ttlSeconds: config.cache.ttl.staticConfig,
        staleTtlSeconds: 0,
        strategy: 'standard',
    },
    userPreferences: {
        ttlSeconds: config.cache.ttl.userPreferences,
        staleTtlSeconds: 0,
        strategy: 'standard',
    },
};

const getPolicy = (name) => policies[name] || policies.staticConfig;

module.exports = {
    policies,
    getPolicy,
};
