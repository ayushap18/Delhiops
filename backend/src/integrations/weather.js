const config = require('../config');
const { fetchJsonWithRetry, toQueryString } = require('./httpClient');
const { createRateLimiter } = require('./rateLimiter');
const { createCircuitBreaker } = require('./circuitBreaker');
const { validateCollection, weatherSchema } = require('./validation');
const logger = require('../utils/logger');

const owmLimiter = createRateLimiter({ minIntervalMs: config.integrations.openWeather.minIntervalMs, maxConcurrent: 1 });
const owmWeatherBreaker = createCircuitBreaker({ name: 'openweather-weather', failureThreshold: 5, resetTimeoutMs: 60000 });

const normalizeWeatherResponse = (data, location) => {
    if (!data) return [];
    const timestamp = new Date(data.dt * 1000);
    return [
        {
            timestamp,
            location,
            temperature: data.main?.temp ?? null,
            humidity: data.main?.humidity ?? null,
            windSpeed: data.wind?.speed ?? null,
            conditions: data.weather?.[0]?.description || 'unknown',
        },
    ];
};

const fetchCurrentWeather = async ({ lat, lng, units = 'metric' }) => {
    if (!config.integrations.openWeather.apiKey) {
        throw new Error('OWM_API_KEY missing');
    }
    const query = toQueryString({
        lat,
        lon: lng,
        appid: config.integrations.openWeather.apiKey,
        units,
    });
    const url = `${config.integrations.openWeather.baseUrl}/weather${query}`;
    return owmWeatherBreaker.execute(() =>
        owmLimiter.schedule(() =>
            fetchJsonWithRetry(url, {}, { timeoutMs: config.integrations.openWeather.timeoutMs })
        )
    );
};

const fetchForecast = async ({ lat, lng, units = 'metric' }) => {
    if (!config.integrations.openWeather.apiKey) {
        throw new Error('OWM_API_KEY missing');
    }
    const query = toQueryString({
        lat,
        lon: lng,
        appid: config.integrations.openWeather.apiKey,
        units,
    });
    const url = `${config.integrations.openWeather.baseUrl}/forecast${query}`;
    return owmWeatherBreaker.execute(() =>
        owmLimiter.schedule(() =>
            fetchJsonWithRetry(url, {}, { timeoutMs: config.integrations.openWeather.timeoutMs })
        )
    );
};

const getValidatedCurrentWeather = async (location, units) => {
    try {
        const raw = await fetchCurrentWeather({ ...location, units });
        const normalized = normalizeWeatherResponse(raw, location);
        return validateCollection(weatherSchema, normalized, 'weather');
    } catch (err) {
        logger.warn('Weather fetch failed', { message: err.message });
        return [];
    }
};

const estimatePollutionRisk = (weather) => {
    if (!weather) return 'unknown';
    const wind = weather.windSpeed ?? 0;
    const humidity = weather.humidity ?? 0;
    if (wind < 1.5 && humidity > 70) return 'high';
    if (wind < 3 && humidity > 50) return 'moderate';
    return 'low';
};

module.exports = {
    fetchCurrentWeather,
    fetchForecast,
    normalizeWeatherResponse,
    getValidatedCurrentWeather,
    estimatePollutionRisk,
};
