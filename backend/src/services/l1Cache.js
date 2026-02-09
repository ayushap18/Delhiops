const config = require('../config');

class L1Cache {
    constructor(maxEntries, cleanupIntervalMs) {
        this.maxEntries = maxEntries;
        this.store = new Map();
        this.evictions = {
            lru: 0,
            ttl: 0,
            manual: 0,
        };
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, cleanupIntervalMs);
        this.cleanupTimer.unref?.();
    }

    now() {
        return Date.now();
    }

    buildEntry(value, ttlSeconds, meta = {}) {
        const createdAt = this.now();
        const expiresAt = ttlSeconds > 0 ? createdAt + ttlSeconds * 1000 : null;
        return {
            value,
            createdAt,
            expiresAt,
            meta,
        };
    }

    isExpired(entry) {
        return entry.expiresAt !== null && entry.expiresAt <= this.now();
    }

    isStale(entry, staleTtlSeconds = 0) {
        if (entry.expiresAt === null) return false;
        const staleThreshold = entry.expiresAt + staleTtlSeconds * 1000;
        return this.now() > staleThreshold;
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (this.isExpired(entry)) {
            this.store.delete(key);
            this.evictions.ttl += 1;
            return null;
        }
        // LRU refresh
        this.store.delete(key);
        this.store.set(key, entry);
        return entry;
    }

    set(key, value, ttlSeconds, meta = {}) {
        if (this.store.has(key)) {
            this.store.delete(key);
        }
        this.store.set(key, this.buildEntry(value, ttlSeconds, meta));
        this.evictToFit();
    }

    patch(key, patcher, ttlSeconds, meta = {}) {
        const existing = this.get(key);
        if (!existing) return null;
        const patchedValue =
            typeof patcher === 'function'
                ? patcher(existing.value)
                : { ...existing.value, ...patcher };
        this.set(key, patchedValue, ttlSeconds, { ...existing.meta, ...meta });
        return patchedValue;
    }

    evictToFit() {
        while (this.store.size > this.maxEntries) {
            const oldestKey = this.store.keys().next().value;
            if (!oldestKey) break;
            this.store.delete(oldestKey);
            this.evictions.lru += 1;
        }
    }

    del(key) {
        if (this.store.delete(key)) {
            this.evictions.manual += 1;
        }
    }

    deleteByPrefix(prefix) {
        const pattern = `${prefix}`;
        for (const key of this.store.keys()) {
            if (key.startsWith(pattern)) {
                this.store.delete(key);
                this.evictions.manual += 1;
            }
        }
    }

    cleanupExpired() {
        for (const [key, entry] of this.store.entries()) {
            if (this.isExpired(entry)) {
                this.store.delete(key);
                this.evictions.ttl += 1;
            }
        }
    }

    size() {
        return this.store.size;
    }

    keys() {
        return Array.from(this.store.keys());
    }

    snapshot() {
        return {
            size: this.size(),
            maxEntries: this.maxEntries,
            evictions: { ...this.evictions },
        };
    }
}

const l1Cache = new L1Cache(config.cache.l1MaxEntries, config.cache.l1CleanupIntervalMs);

module.exports = {
    l1Cache,
};
