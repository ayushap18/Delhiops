const config = require('../../config');
const { getSocketMetrics } = require('../../services/socket');
const cache = require('../../services/cache');
const { warmCache } = require('../../services/cacheWarmer');
const { getPolicy } = require('../../services/cachePolicies');
const { preloadLikelyNext, getPreloaderStats } = require('../../services/cachePreloader');
const dbOptimization = require('../../services/dbOptimization');
const { getCircuitStates } = require('../../integrations/circuitBreaker');
const asyncHandler = require('../middlewares/asyncHandler');
const { badRequest, unauthorized, notFound } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/response');

const getSystemMetrics = asyncHandler(async (req, res) => {
    const socketMetrics = getSocketMetrics();
    const cacheMetrics = await cache.getAnalytics();
    const preloader = getPreloaderStats();
    const circuitBreakers = getCircuitStates();
    sendSuccess(res, {
        socket: socketMetrics,
        cache: cacheMetrics,
        preloader,
        circuitBreakers,
        timestamp: new Date().toISOString(),
    });
});

const getCacheMetrics = asyncHandler(async (req, res) => {
    const snapshot = await cache.getAnalytics();
    sendSuccess(res, snapshot);
});

const listCacheKeys = asyncHandler(async (req, res) => {
    const prefix = req.query.prefix || '';
    const limit = Number.parseInt(req.query.limit, 10) || 100;
    const keys = await cache.listKeys(prefix, limit);
    sendSuccess(res, keys);
});

const bustCache = asyncHandler(async (req, res) => {
    const { prefix, key } = req.body;
    if (!prefix && !key) throw badRequest('Either key or prefix is required');
    const result = await cache.bust({ prefix, key });
    sendSuccess(res, { ok: true, ...result });
});

const patchCache = asyncHandler(async (req, res) => {
    const { key, patch, ttlSeconds, staleTtlSeconds, strategy } = req.body;
    if (!key || typeof patch !== 'object' || patch === null) {
        throw badRequest('key and patch object are required');
    }
    const updated = await cache.patchJson(
        key,
        patch,
        {
            ttlSeconds: ttlSeconds ?? getPolicy('staticConfig').ttlSeconds,
            staleTtlSeconds: staleTtlSeconds ?? 0,
            strategy: strategy || 'standard',
        }
    );
    if (!updated) throw notFound('Cache key', key);
    sendSuccess(res, { ok: true, data: updated });
});

const warmCacheNow = asyncHandler(async (req, res) => {
    await warmCache();
    sendSuccess(res, { ok: true });
});

const triggerPreload = asyncHandler(async (req, res) => {
    const { key } = req.body;
    if (!key) throw badRequest('key is required');
    await preloadLikelyNext(key);
    sendSuccess(res, { ok: true });
});

const getStaticConfig = asyncHandler(async (req, res) => {
    const staticPolicy = getPolicy('staticConfig');
    const { data, cached, layer, stale } = await cache.withCache(
        'config:static:v1',
        staticPolicy,
        async () => ({
            appName: 'Delhi Ops Dashboard',
            cachePolicies: config.cache.ttl,
            websocket: {
                batchEvents: config.socket.batchEvents,
                pingIntervalMs: config.socket.pingIntervalMs,
            },
            timestamp: new Date().toISOString(),
        })
    );
    sendSuccess(res, data, 200, { cache: { cached, layer, stale } });
});

const getUserPreferences = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) throw unauthorized();
    const version = req.query.version || '1';
    const key = `userprefs:${userId}:v${version}`;
    const prefsPolicy = getPolicy('userPreferences');
    const { data, cached, layer } = await cache.withCache(key, { ...prefsPolicy, version }, async () => ({
        map: {
            center: { lat: 28.6139, lng: 77.209 },
            zoom: 11,
        },
        layout: '4-grid',
        alerts: {
            aqi: true,
            incidents: true,
            traffic: true,
        },
        updatedAt: new Date().toISOString(),
    }));

    sendSuccess(res, data, 200, { cache: { cached, layer }, version });
});

const upsertUserPreferences = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) throw unauthorized();
    const version = req.body.version || '1';
    const preferences = req.body.preferences;
    if (!preferences || typeof preferences !== 'object') {
        throw badRequest('preferences object is required');
    }
    const key = `userprefs:${userId}:v${version}`;
    const prefsPolicy = getPolicy('userPreferences');
    await cache.setJson(key, { ...preferences, updatedAt: new Date().toISOString() }, prefsPolicy.ttlSeconds, {
        ...prefsPolicy,
        version,
        tags: [`user:${userId}`, 'preferences'],
    });
    sendSuccess(res, { ok: true, key, version });
});

const refreshDbViews = asyncHandler(async (req, res) => {
    await dbOptimization.refreshMaterializedViews();
    sendSuccess(res, { ok: true });
});

const runDbRetention = asyncHandler(async (req, res) => {
    await dbOptimization.runRetention();
    sendSuccess(res, { ok: true });
});

const archiveDbPartitions = asyncHandler(async (req, res) => {
    const retentionMonths = Number.parseInt(req.body.retentionMonths, 10) || 12;
    await dbOptimization.archiveOldPartitions(retentionMonths);
    sendSuccess(res, { ok: true, retentionMonths });
});

const getDbSlowQueries = asyncHandler(async (req, res) => {
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const rows = await dbOptimization.getSlowQueries(limit);
    sendSuccess(res, rows);
});

const getDbLockStatus = asyncHandler(async (req, res) => {
    const rows = await dbOptimization.getLockStatus();
    sendSuccess(res, rows);
});

const getDbBloatStatus = asyncHandler(async (req, res) => {
    const rows = await dbOptimization.getTableBloat();
    sendSuccess(res, rows);
});

module.exports = {
    getSystemMetrics,
    getCacheMetrics,
    listCacheKeys,
    bustCache,
    patchCache,
    warmCacheNow,
    triggerPreload,
    getStaticConfig,
    getUserPreferences,
    upsertUserPreferences,
    refreshDbViews,
    runDbRetention,
    archiveDbPartitions,
    getDbSlowQueries,
    getDbLockStatus,
    getDbBloatStatus,
};
