const metrics = {
    hits: {
        l1: 0,
        l2: 0,
    },
    misses: {
        l1: 0,
        l2: 0,
    },
    staleServes: 0,
    backgroundRevalidations: 0,
    writeCount: 0,
    deleteCount: 0,
    patchCount: 0,
    fetchCount: 0,
    fetchLatencyMs: {
        avg: 0,
        min: null,
        max: null,
        samples: 0,
    },
    byKeyPrefix: {},
};

const prefixOf = (key) => key.split(':')[0] || 'unknown';

const updateLatency = (ms) => {
    metrics.fetchLatencyMs.samples += 1;
    const { samples } = metrics.fetchLatencyMs;
    metrics.fetchLatencyMs.avg = metrics.fetchLatencyMs.avg + (ms - metrics.fetchLatencyMs.avg) / samples;
    metrics.fetchLatencyMs.min = metrics.fetchLatencyMs.min === null ? ms : Math.min(metrics.fetchLatencyMs.min, ms);
    metrics.fetchLatencyMs.max = metrics.fetchLatencyMs.max === null ? ms : Math.max(metrics.fetchLatencyMs.max, ms);
};

const touchPrefix = (key, updater) => {
    const prefix = prefixOf(key);
    if (!metrics.byKeyPrefix[prefix]) {
        metrics.byKeyPrefix[prefix] = {
            hits: 0,
            misses: 0,
            writes: 0,
            deletes: 0,
        };
    }
    updater(metrics.byKeyPrefix[prefix]);
};

const recordHit = (layer, key) => {
    metrics.hits[layer] += 1;
    touchPrefix(key, (entry) => {
        entry.hits += 1;
    });
};

const recordMiss = (layer, key) => {
    metrics.misses[layer] += 1;
    touchPrefix(key, (entry) => {
        entry.misses += 1;
    });
};

const recordStaleServe = () => {
    metrics.staleServes += 1;
};

const recordBackgroundRevalidation = () => {
    metrics.backgroundRevalidations += 1;
};

const recordWrite = (key) => {
    metrics.writeCount += 1;
    touchPrefix(key, (entry) => {
        entry.writes += 1;
    });
};

const recordDelete = (key) => {
    metrics.deleteCount += 1;
    touchPrefix(key, (entry) => {
        entry.deletes += 1;
    });
};

const recordPatch = () => {
    metrics.patchCount += 1;
};

const recordFetch = (latencyMs) => {
    metrics.fetchCount += 1;
    if (latencyMs !== undefined && latencyMs !== null) {
        updateLatency(latencyMs);
    }
};

const ratio = (hits, misses) => {
    const total = hits + misses;
    if (total === 0) return 0;
    return Number((hits / total).toFixed(4));
};

const snapshot = () => ({
    ...metrics,
    hitRatio: {
        l1: ratio(metrics.hits.l1, metrics.misses.l1),
        l2: ratio(metrics.hits.l2, metrics.misses.l2),
        overall: ratio(metrics.hits.l1 + metrics.hits.l2, metrics.misses.l1 + metrics.misses.l2),
    },
});

module.exports = {
    recordHit,
    recordMiss,
    recordStaleServe,
    recordBackgroundRevalidation,
    recordWrite,
    recordDelete,
    recordPatch,
    recordFetch,
    snapshot,
};
