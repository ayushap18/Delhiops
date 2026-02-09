const config = require('../config');
const { fetchJsonWithRetry, toQueryString } = require('./httpClient');
const { createRateLimiter } = require('./rateLimiter');
const { createCircuitBreaker } = require('./circuitBreaker');
const { validateCollection, aqiReadingSchema } = require('./validation');
const logger = require('../utils/logger');
const dataService = require('../services/dataService');

const cpcbLimiter = createRateLimiter({ minIntervalMs: config.integrations.cpcb.minIntervalMs, maxConcurrent: 1 });
const owmLimiter = createRateLimiter({ minIntervalMs: config.integrations.openWeather.minIntervalMs, maxConcurrent: 1 });
const cpcbBreaker = createCircuitBreaker({ name: 'cpcb', failureThreshold: 5, resetTimeoutMs: 30000 });
const owmAqiBreaker = createCircuitBreaker({ name: 'openweather-aqi', failureThreshold: 5, resetTimeoutMs: 60000 });

const pollutantMap = {
    PM2_5: 'pm2_5',
    'PM2.5': 'pm2_5',
    PM10: 'pm10',
    O3: 'o3',
    OZONE: 'o3',
    NO2: 'no2',
    SO2: 'so2',
    CO: 'co',
};

const parseNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const parseTimestamp = (record) => {
    const raw =
        record.timestamp ||
        record.last_update ||
        record.last_update_time ||
        record.lastUpdate ||
        record.date;
    if (!raw) return null;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const parseLocation = (record) => {
    const lat = parseNumber(record.lat || record.latitude || record.station_lat || record.latitudes);
    const lng = parseNumber(record.lng || record.longitude || record.station_lng || record.longitudes);
    if (lat === null || lng === null) return null;
    return { lat, lng };
};

const normalizeCpcbRecords = (records = []) => {
    const grouped = new Map();

    records.forEach((record) => {
        const timestamp = parseTimestamp(record);
        const location = parseLocation(record);
        const station = record.station || record.station_name || record.stationName;

        if (!timestamp || !location) {
            logger.warn('Skipping CPCB record due to missing timestamp/location');
            return;
        }

        const key = `${station || 'unknown'}:${timestamp.toISOString()}:${location.lat},${location.lng}`;
        const existing = grouped.get(key) || {
            timestamp,
            location,
            station,
            city: record.city || record.city_name,
            state: record.state || record.state_name,
            aqi: parseNumber(record.aqi) || parseNumber(record.aqi_value),
        };

        const pollutantId = record.pollutant_id || record.pollutant || record.pollutant_type;
        const pollutantKey = pollutantMap[pollutantId];
        const value =
            parseNumber(record.pollutant_avg) ||
            parseNumber(record.pollutant_value) ||
            parseNumber(record.value);

        if (pollutantKey && value !== null) {
            existing[pollutantKey] = value;
        }

        grouped.set(key, existing);
    });

    return Array.from(grouped.values());
};

const normalizeOpenWeatherResponse = (data, location) => {
    if (!data || !data.list || data.list.length === 0) return [];
    const latest = data.list[0];
    const timestamp = new Date(latest.dt * 1000);
    return [
        {
            timestamp,
            location,
            aqi: latest.main?.aqi ?? null,
            pm2_5: latest.components?.pm2_5 ?? null,
            pm10: latest.components?.pm10 ?? null,
            o3: latest.components?.o3 ?? null,
            no2: latest.components?.no2 ?? null,
            so2: latest.components?.so2 ?? null,
            co: latest.components?.co ?? null,
        },
    ];
};

const fetchCpcbAqi = async ({ limit, filters = {} } = {}) => {
    if (!config.integrations.cpcb.resourceId || !config.integrations.cpcb.apiKey) {
        throw new Error('CPCB_RESOURCE_ID or CPCB_API_KEY missing');
    }
    const query = toQueryString({
        'api-key': config.integrations.cpcb.apiKey,
        format: 'json',
        limit: limit || config.integrations.cpcb.defaultLimit,
        filters,
    });
    const url = `${config.integrations.cpcb.baseUrl}/${config.integrations.cpcb.resourceId}${query}`;
    return cpcbBreaker.execute(() =>
        cpcbLimiter.schedule(() =>
            fetchJsonWithRetry(url, {}, { timeoutMs: config.integrations.cpcb.timeoutMs })
        )
    );
};

const fetchOpenWeatherAqi = async ({ lat, lng }) => {
    if (!config.integrations.openWeather.apiKey) {
        throw new Error('OWM_API_KEY missing');
    }
    const query = toQueryString({
        lat,
        lon: lng,
        appid: config.integrations.openWeather.apiKey,
    });
    const url = `${config.integrations.openWeather.baseUrl}/air_pollution${query}`;
    return owmAqiBreaker.execute(() =>
        owmLimiter.schedule(() =>
            fetchJsonWithRetry(url, {}, { timeoutMs: config.integrations.openWeather.timeoutMs })
        )
    );
};

const fetchAirQuality = async (options = {}) => {
    try {
        const cpcbData = await fetchCpcbAqi(options);
        const normalized = normalizeCpcbRecords(cpcbData.records || cpcbData.data || []);
        const validated = validateCollection(aqiReadingSchema, normalized, 'cpcb');
        if (validated.length > 0) {
            return { source: 'cpcb', readings: validated };
        }
    } catch (err) {
        logger.warn('CPCB fetch failed, falling back', { message: err.message });
    }

    if (!options.fallbackLocation) {
        throw new Error('No fallback location provided for OpenWeather');
    }

    const openWeather = await fetchOpenWeatherAqi(options.fallbackLocation);
    const normalized = normalizeOpenWeatherResponse(openWeather, options.fallbackLocation);
    const validated = validateCollection(aqiReadingSchema, normalized, 'openweather');

    return { source: 'openweather', readings: validated };
};

const storeAqiReadings = async (readings = []) => {
    const stored = [];
    for (const reading of readings) {
        try {
            const record = await dataService.createAqi({
                timestamp: reading.timestamp,
                location: reading.location,
                aqi: reading.aqi,
                pm2_5: reading.pm2_5,
                pm10: reading.pm10,
                o3: reading.o3,
                no2: reading.no2,
                so2: reading.so2,
                co: reading.co,
            });
            stored.push(record);
        } catch (err) {
            logger.warn('Failed to persist AQI reading', { message: err.message });
        }
    }
    return stored;
};

module.exports = {
    fetchCpcbAqi,
    fetchOpenWeatherAqi,
    fetchAirQuality,
    storeAqiReadings,
    normalizeCpcbRecords,
    normalizeOpenWeatherResponse,
};
