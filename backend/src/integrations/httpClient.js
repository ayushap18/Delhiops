const logger = require('../utils/logger');
const config = require('../config');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toQueryString = (params = {}) => {
    const parts = [];
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                if (nestedValue === undefined || nestedValue === null || nestedValue === '') return;
                parts.push(`${encodeURIComponent(`${key}[${nestedKey}]`)}=${encodeURIComponent(nestedValue)}`);
            });
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
            });
            return;
        }
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    return parts.length > 0 ? `?${parts.join('&')}` : '';
};

const parseDurationSeconds = (duration) => {
    if (typeof duration === 'number') return duration;
    if (typeof duration !== 'string') return null;
    if (duration.endsWith('s')) {
        const seconds = parseFloat(duration.slice(0, -1));
        return Number.isNaN(seconds) ? null : seconds;
    }
    const parsed = parseFloat(duration);
    return Number.isNaN(parsed) ? null : parsed;
};

const fetchJsonWithRetry = async (url, options = {}, retryConfig = {}) => {
    const {
        attempts = config.integrations.retry.attempts,
        baseDelayMs = config.integrations.retry.baseDelayMs,
        maxDelayMs = config.integrations.retry.maxDelayMs,
        timeoutMs = 8000,
        retryOn = [429, 500, 502, 503, 504],
    } = retryConfig;

    let lastError;
    for (let attempt = 0; attempt <= attempts; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) {
                const body = await response.text();
                const error = new Error(`Request failed (${response.status})`);
                error.status = response.status;
                error.body = body;
                if (retryOn.includes(response.status) && attempt < attempts) {
                    const backoff = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
                    const jitter = Math.floor(Math.random() * 100);
                    await sleep(backoff + jitter);
                    continue;
                }
                throw error;
            }

            return await response.json();
        } catch (err) {
            clearTimeout(timeout);
            lastError = err;
            const shouldRetry = attempt < attempts && (err.name === 'AbortError' || err.status);
            if (shouldRetry) {
                const backoff = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
                const jitter = Math.floor(Math.random() * 100);
                await sleep(backoff + jitter);
            } else {
                break;
            }
        }
    }

    logger.warn('External request failed after retries', { url, message: lastError?.message });
    throw lastError;
};

module.exports = {
    fetchJsonWithRetry,
    toQueryString,
    parseDurationSeconds,
};
