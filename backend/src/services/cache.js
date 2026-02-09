const { redisClient, connectRedis } = require('./redis');
const { l1Cache } = require('./l1Cache');
const metrics = require('./cacheMetrics');
const logger = require('../utils/logger');

const inFlightRevalidations = new Map();

const buildKey = (prefix, suffix = '') => {
    if (!suffix) return prefix;
    return `${prefix}:${suffix}`;
};

const now = () => Date.now();

const resolveOptions = (options) => {
    if (typeof options === 'number') {
        return {
            ttlSeconds: options,
            staleTtlSeconds: 0,
            strategy: 'standard',
            tags: [],
            version: null,
        };
    }
    const normalized = {
        ttlSeconds: options?.ttlSeconds ?? options?.ttl ?? 0,
        staleTtlSeconds: options?.staleTtlSeconds ?? 0,
        strategy: options?.strategy || 'standard',
        tags: options?.tags || [],
        version: options?.version ?? null,
    };
    return normalized;
};

const buildEnvelope = (value, resolvedOptions = {}) => {
    const createdAt = now();
    const expiresAt =
        resolvedOptions.ttlSeconds > 0
            ? createdAt + resolvedOptions.ttlSeconds * 1000
            : null;
    return {
        value,
        createdAt,
        expiresAt,
        meta: {
            tags: resolvedOptions.tags,
            version: resolvedOptions.version,
            strategy: resolvedOptions.strategy,
        },
    };
};

const logicalExpiry = (entry) => {
    if (entry?.meta?.logicalExpiresAt !== undefined) {
        return entry.meta.logicalExpiresAt;
    }
    return entry.expiresAt;
};

const isFresh = (entry) => logicalExpiry(entry) === null || logicalExpiry(entry) > now();

const isWithinStaleWindow = (entry, staleTtlSeconds) => {
    const expiry = logicalExpiry(entry);
    if (expiry === null) return false;
    return now() <= expiry + staleTtlSeconds * 1000;
};

const getJson = async (key) => {
    const l1Entry = l1Cache.get(key);
    if (l1Entry) {
        metrics.recordHit('l1', key);
        return l1Entry.value;
    }
    metrics.recordMiss('l1', key);

    if (!redisClient.isOpen) {
        await connectRedis();
    }
    const raw = await redisClient.get(key);
    if (!raw) {
        metrics.recordMiss('l2', key);
        return null;
    }
    metrics.recordHit('l2', key);
    const parsed = JSON.parse(raw);
    l1Cache.set(key, parsed.value ?? parsed, 60, parsed.meta || {});
    return parsed.value ?? parsed;
};

const setJson = async (key, value, ttlSeconds, options = {}) => {
    if (!redisClient.isOpen) {
        await connectRedis();
    }
    const resolved = resolveOptions({ ...options, ttlSeconds });
    const envelope = buildEnvelope(value, resolved);
    const payload = JSON.stringify(envelope);
    if (resolved.ttlSeconds > 0) {
        await redisClient.set(key, payload, { EX: resolved.ttlSeconds + resolved.staleTtlSeconds });
    } else {
        await redisClient.set(key, payload);
    }
    l1Cache.set(
        key,
        value,
        (resolved.ttlSeconds || 0) + resolved.staleTtlSeconds,
        {
            ...envelope.meta,
            logicalExpiresAt: envelope.expiresAt,
            staleTtlSeconds: resolved.staleTtlSeconds,
        }
    );
    metrics.recordWrite(key);
};

const del = async (key) => {
    l1Cache.del(key);
    if (!redisClient.isOpen) {
        await connectRedis();
    }
    await redisClient.del(key);
    metrics.recordDelete(key);
};

const deleteByPrefix = async (prefix) => {
    l1Cache.deleteByPrefix(prefix);
    if (!redisClient.isOpen) {
        await connectRedis();
    }

    let cursor = '0';
    do {
        const result = await redisClient.scan(cursor, {
            MATCH: `${prefix}*`,
            COUNT: 100,
        });
        cursor = String(result.cursor);
        const keys = result.keys || [];
        if (keys.length > 0) {
            await redisClient.del(keys);
            keys.forEach((key) => metrics.recordDelete(key));
        }
    } while (cursor !== '0');
};

const readEnvelopeFromRedis = async (key) => {
    if (!redisClient.isOpen) {
        await connectRedis();
    }
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (err) {
        logger.warn('Failed to parse redis cache envelope', { key, message: err.message });
        return null;
    }
};

const fetchAndStore = async (key, resolved, fetcher) => {
    const start = now();
    const value = await fetcher();
    metrics.recordFetch(now() - start);
    await setJson(key, value, resolved.ttlSeconds, resolved);
    return value;
};

const backgroundRevalidate = async (key, resolved, fetcher) => {
    if (inFlightRevalidations.has(key)) return inFlightRevalidations.get(key);
    metrics.recordBackgroundRevalidation();
    const promise = (async () => {
        try {
            await fetchAndStore(key, resolved, fetcher);
        } catch (err) {
            logger.warn('Background revalidation failed', { key, message: err.message });
        } finally {
            inFlightRevalidations.delete(key);
        }
    })();
    inFlightRevalidations.set(key, promise);
    return promise;
};

const withCache = async (key, options, fetcher) => {
    const resolved = resolveOptions(options);

    const l1Entry = l1Cache.get(key);
    if (l1Entry) {
        metrics.recordHit('l1', key);
        if (isFresh(l1Entry)) {
            return { data: l1Entry.value, cached: true, layer: 'l1', stale: false };
        }
        if (
            (resolved.strategy === 'stale_while_revalidate' || resolved.strategy === 'background_refresh') &&
            isWithinStaleWindow(l1Entry, resolved.staleTtlSeconds)
        ) {
            metrics.recordStaleServe();
            backgroundRevalidate(key, resolved, fetcher);
            return {
                data: l1Entry.value,
                cached: true,
                layer: 'l1',
                stale: true,
                revalidating: true,
            };
        }
    } else {
        metrics.recordMiss('l1', key);
    }

    const redisEntry = await readEnvelopeFromRedis(key);
    if (redisEntry) {
        metrics.recordHit('l2', key);
        const logicalExpiresAt = redisEntry.expiresAt || null;
        const staleWindowSeconds = resolved.staleTtlSeconds || 0;
        const ttlUntilEviction =
            logicalExpiresAt === null
                ? 0
                : Math.max(1, Math.ceil((logicalExpiresAt + staleWindowSeconds * 1000 - now()) / 1000));
        l1Cache.set(key, redisEntry.value, ttlUntilEviction, {
            ...(redisEntry.meta || {}),
            logicalExpiresAt,
            staleTtlSeconds: staleWindowSeconds,
        });
        if (isFresh(redisEntry)) {
            return { data: redisEntry.value, cached: true, layer: 'l2', stale: false };
        }
        if (
            (resolved.strategy === 'stale_while_revalidate' || resolved.strategy === 'background_refresh') &&
            isWithinStaleWindow(redisEntry, resolved.staleTtlSeconds)
        ) {
            metrics.recordStaleServe();
            backgroundRevalidate(key, resolved, fetcher);
            return {
                data: redisEntry.value,
                cached: true,
                layer: 'l2',
                stale: true,
                revalidating: true,
            };
        }
    } else {
        metrics.recordMiss('l2', key);
    }

    const data = await fetchAndStore(key, resolved, fetcher);
    return { data, cached: false, layer: 'db', stale: false };
};

const patchJson = async (key, patcher, options = {}) => {
    const resolved = resolveOptions(options);
    let value = null;

    const l1Entry = l1Cache.get(key);
    if (l1Entry) {
        value = typeof patcher === 'function' ? patcher(l1Entry.value) : { ...l1Entry.value, ...patcher };
    } else {
        const redisEntry = await readEnvelopeFromRedis(key);
        if (redisEntry) {
            value =
                typeof patcher === 'function'
                    ? patcher(redisEntry.value)
                    : { ...redisEntry.value, ...patcher };
        }
    }
    if (value === null) return null;

    await setJson(key, value, resolved.ttlSeconds, resolved);
    metrics.recordPatch();
    return value;
};

const listKeys = async (prefix = '', limit = 200) => {
    const l1Keys = l1Cache.keys().filter((key) => key.startsWith(prefix)).slice(0, limit);
    if (!redisClient.isOpen) {
        await connectRedis();
    }
    const redisKeys = [];
    let cursor = '0';
    do {
        const result = await redisClient.scan(cursor, {
            MATCH: `${prefix}*`,
            COUNT: 100,
        });
        cursor = String(result.cursor);
        redisKeys.push(...(result.keys || []));
        if (redisKeys.length >= limit) break;
    } while (cursor !== '0');

    return {
        l1: l1Keys.slice(0, limit),
        l2: redisKeys.slice(0, limit),
    };
};

const getAnalytics = async () => {
    const metricSnapshot = metrics.snapshot();
    const l1Snapshot = l1Cache.snapshot();
    let redisInfo = {};
    if (!redisClient.isOpen) {
        await connectRedis();
    }
    try {
        const info = await redisClient.info('memory');
        const memoryLine = info
            .split('\n')
            .find((line) => line.startsWith('used_memory_human:'));
        redisInfo.usedMemory = memoryLine ? memoryLine.split(':')[1].trim() : 'unknown';
    } catch (err) {
        redisInfo.usedMemory = 'unavailable';
    }

    return {
        metrics: metricSnapshot,
        l1: l1Snapshot,
        l2: redisInfo,
        inFlightRevalidations: inFlightRevalidations.size,
    };
};

const bust = async ({ prefix, key }) => {
    if (key) {
        await del(key);
        return { mode: 'key', key };
    }
    if (prefix) {
        await deleteByPrefix(prefix);
        return { mode: 'prefix', prefix };
    }
    throw new Error('Either key or prefix is required for cache bust');
};

module.exports = {
    buildKey,
    getJson,
    setJson,
    del,
    deleteByPrefix,
    withCache,
    patchJson,
    listKeys,
    getAnalytics,
    bust,
};
