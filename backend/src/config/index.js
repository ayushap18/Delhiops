require('dotenv').config();

const toNumber = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value, fallback = false) => {
    if (value === undefined) return fallback;
    return value.toLowerCase() === 'true';
};

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    db: {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        host: process.env.POSTGRES_HOST,
        port: toNumber(process.env.POSTGRES_PORT, 5432),
        max: toNumber(process.env.POSTGRES_POOL_MAX, 20),
        idleTimeoutMillis: toNumber(process.env.POSTGRES_POOL_IDLE_MS, 30000),
        queryTimeoutMs: toNumber(process.env.POSTGRES_QUERY_TIMEOUT_MS, 8000),
        statementTimeoutMs: toNumber(process.env.POSTGRES_STATEMENT_TIMEOUT_MS, 10000),
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: toNumber(process.env.REDIS_PORT, 6379),
        password: process.env.REDIS_PASSWORD,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    rateLimit: {
        windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        max: toNumber(process.env.RATE_LIMIT_MAX, 100),
    },
    throttle: {
        windowMs: toNumber(process.env.SLOW_DOWN_WINDOW_MS, 15 * 60 * 1000),
        delayAfter: toNumber(process.env.SLOW_DOWN_DELAY_AFTER, 50),
        delayMs: toNumber(process.env.SLOW_DOWN_DELAY_MS, 200),
    },
    cache: {
        warmOnStart: toBoolean(process.env.CACHE_WARM_ON_STARTUP, true),
        l1MaxEntries: toNumber(process.env.CACHE_L1_MAX_ENTRIES, 2000),
        l1CleanupIntervalMs: toNumber(process.env.CACHE_L1_CLEANUP_MS, 30000),
        ttl: {
            aqi: toNumber(process.env.CACHE_TTL_AQI_SECONDS, 300),
            traffic: toNumber(process.env.CACHE_TTL_TRAFFIC_SECONDS, 120),
            cameras: toNumber(process.env.CACHE_TTL_CAMERAS_SECONDS, 1800),
            incidents: toNumber(process.env.CACHE_TTL_INCIDENTS_SECONDS, 60),
            crime: toNumber(process.env.CACHE_TTL_CRIME_SECONDS, 900),
            staticConfig: toNumber(process.env.CACHE_TTL_STATIC_CONFIG_SECONDS, 86400),
            userPreferences: toNumber(process.env.CACHE_TTL_USER_PREFERENCES_SECONDS, 0),
        },
        stale: {
            aqi: toNumber(process.env.CACHE_STALE_AQI_SECONDS, 120),
            traffic: toNumber(process.env.CACHE_STALE_TRAFFIC_SECONDS, 60),
        },
    },
    integrations: {
        cpcb: {
            baseUrl: process.env.CPCB_BASE_URL || 'https://api.data.gov.in/resource',
            resourceId: process.env.CPCB_RESOURCE_ID,
            apiKey: process.env.CPCB_API_KEY,
            defaultLimit: toNumber(process.env.CPCB_DEFAULT_LIMIT, 100),
            timeoutMs: toNumber(process.env.CPCB_TIMEOUT_MS, 8000),
            minIntervalMs: toNumber(process.env.CPCB_MIN_INTERVAL_MS, 500),
        },
        openWeather: {
            baseUrl: process.env.OWM_BASE_URL || 'https://api.openweathermap.org/data/2.5',
            apiKey: process.env.OWM_API_KEY,
            timeoutMs: toNumber(process.env.OWM_TIMEOUT_MS, 8000),
            minIntervalMs: toNumber(process.env.OWM_MIN_INTERVAL_MS, 500),
        },
        googleRoutes: {
            baseUrl: process.env.GOOGLE_ROUTES_BASE_URL || 'https://routes.googleapis.com/directions/v2:computeRoutes',
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
            trafficModel: process.env.GOOGLE_TRAFFIC_MODEL || 'BEST_GUESS',
            timeoutMs: toNumber(process.env.GOOGLE_ROUTES_TIMEOUT_MS, 8000),
            minIntervalMs: toNumber(process.env.GOOGLE_ROUTES_MIN_INTERVAL_MS, 300),
        },
        tomtom: {
            baseUrl: process.env.TOMTOM_BASE_URL || 'https://api.tomtom.com/traffic/services/4/flowSegmentData',
            apiKey: process.env.TOMTOM_API_KEY,
            style: process.env.TOMTOM_FLOW_STYLE || 'relative0',
            zoom: toNumber(process.env.TOMTOM_FLOW_ZOOM, 10),
            unit: process.env.TOMTOM_FLOW_UNIT || 'kmph',
            timeoutMs: toNumber(process.env.TOMTOM_TIMEOUT_MS, 8000),
            minIntervalMs: toNumber(process.env.TOMTOM_MIN_INTERVAL_MS, 300),
        },
        retry: {
            attempts: toNumber(process.env.EXTERNAL_RETRY_ATTEMPTS, 3),
            baseDelayMs: toNumber(process.env.EXTERNAL_RETRY_BASE_DELAY_MS, 500),
            maxDelayMs: toNumber(process.env.EXTERNAL_RETRY_MAX_DELAY_MS, 5000),
        },
    },
    adminSeed: {
        email: process.env.ADMIN_SEED_EMAIL,
        password: process.env.ADMIN_SEED_PASSWORD,
        role: process.env.ADMIN_SEED_ROLE || 'Admin',
    },
    aqi: {
        alertThreshold: toNumber(process.env.AQI_ALERT_THRESHOLD, 300),
    },
    auth: {
        maxLoginAttempts: toNumber(process.env.AUTH_MAX_LOGIN_ATTEMPTS, 5),
        loginAttemptWindowMs: toNumber(process.env.AUTH_LOGIN_ATTEMPT_WINDOW_MS, 15 * 60 * 1000),
    },
    socket: {
        perMessageDeflate: toBoolean(process.env.SOCKET_PER_MESSAGE_DEFLATE, true),
        pingIntervalMs: toNumber(process.env.SOCKET_PING_INTERVAL_MS, 25000),
        pingTimeoutMs: toNumber(process.env.SOCKET_PING_TIMEOUT_MS, 20000),
        maxConnectionsPerIp: toNumber(process.env.SOCKET_MAX_CONNECTIONS_PER_IP, 10),
        idleTimeoutMs: toNumber(process.env.SOCKET_IDLE_TIMEOUT_MS, 120000),
        batchIntervalMs: toNumber(process.env.SOCKET_BATCH_INTERVAL_MS, 500),
        batchEvents: (process.env.SOCKET_BATCH_EVENTS || 'stats:update,traffic:congestion')
            .split(',')
            .map((event) => event.trim())
            .filter(Boolean),
        recoveryMaxDurationMs: toNumber(process.env.SOCKET_RECOVERY_MAX_MS, 120000),
        redisAdapterEnabled: toBoolean(process.env.SOCKET_REDIS_ADAPTER, false),
    },
};

module.exports = config;
