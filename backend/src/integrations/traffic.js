const config = require('../config');
const { fetchJsonWithRetry, toQueryString, parseDurationSeconds } = require('./httpClient');
const { createRateLimiter } = require('./rateLimiter');
const { createCircuitBreaker } = require('./circuitBreaker');
const { validateCollection, trafficRecordSchema } = require('./validation');
const logger = require('../utils/logger');
const dataService = require('../services/dataService');

const googleLimiter = createRateLimiter({ minIntervalMs: config.integrations.googleRoutes.minIntervalMs, maxConcurrent: 2 });
const tomtomLimiter = createRateLimiter({ minIntervalMs: config.integrations.tomtom.minIntervalMs, maxConcurrent: 2 });
const googleBreaker = createCircuitBreaker({ name: 'google-routes', failureThreshold: 5, resetTimeoutMs: 30000 });
const tomtomBreaker = createCircuitBreaker({ name: 'tomtom', failureThreshold: 5, resetTimeoutMs: 30000 });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateCongestionFromDurations = (durationSeconds, staticDurationSeconds) => {
    if (!durationSeconds || !staticDurationSeconds) return 0;
    const ratio = durationSeconds / staticDurationSeconds;
    const congestion = (ratio - 1) * 100;
    return clamp(Math.round(congestion), 0, 100);
};

const calculateCongestionFromSpeeds = (currentSpeed, freeFlowSpeed) => {
    if (!currentSpeed || !freeFlowSpeed) return 0;
    const ratio = currentSpeed / freeFlowSpeed;
    const congestion = (1 - ratio) * 100;
    return clamp(Math.round(congestion), 0, 100);
};

const calculateSpeedFromDistance = (distanceMeters, durationSeconds) => {
    if (!distanceMeters || !durationSeconds) return 0;
    const metersPerSecond = distanceMeters / durationSeconds;
    return Math.round(metersPerSecond * 3.6 * 10) / 10;
};

const fetchGoogleTraffic = async (segment) => {
    if (!config.integrations.googleRoutes.apiKey) {
        throw new Error('GOOGLE_MAPS_API_KEY missing');
    }
    const body = {
        origin: {
            location: { latLng: { latitude: segment.origin.lat, longitude: segment.origin.lng } },
        },
        destination: {
            location: { latLng: { latitude: segment.destination.lat, longitude: segment.destination.lng } },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        trafficModel: config.integrations.googleRoutes.trafficModel,
        departureTime: new Date().toISOString(),
    };
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.integrations.googleRoutes.apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters',
    };
    const response = await googleBreaker.execute(() =>
        googleLimiter.schedule(() =>
            fetchJsonWithRetry(config.integrations.googleRoutes.baseUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            }, { timeoutMs: config.integrations.googleRoutes.timeoutMs })
        )
    );
    const route = response.routes?.[0];
    if (!route) {
        throw new Error('No routes returned');
    }
    const durationSeconds = parseDurationSeconds(route.duration);
    const staticDurationSeconds = parseDurationSeconds(route.staticDuration) || durationSeconds;
    const distanceMeters = route.distanceMeters || 0;
    const speed = calculateSpeedFromDistance(distanceMeters, durationSeconds);
    const congestion = calculateCongestionFromDurations(durationSeconds, staticDurationSeconds);

    return {
        segment_id: String(segment.id),
        congestion_level: congestion,
        speed,
        timestamp: new Date(),
    };
};

const fetchTomTomTraffic = async (segment) => {
    if (!config.integrations.tomtom.apiKey) {
        throw new Error('TOMTOM_API_KEY missing');
    }
    if (!segment.point) {
        throw new Error('TomTom requires segment.point { lat, lng }');
    }
    const query = toQueryString({
        point: `${segment.point.lat},${segment.point.lng}`,
        unit: config.integrations.tomtom.unit,
        key: config.integrations.tomtom.apiKey,
    });
    const url = `${config.integrations.tomtom.baseUrl}/${config.integrations.tomtom.style}/${config.integrations.tomtom.zoom}/json${query}`;
    const response = await tomtomBreaker.execute(() =>
        tomtomLimiter.schedule(() =>
            fetchJsonWithRetry(url, {}, { timeoutMs: config.integrations.tomtom.timeoutMs })
        )
    );
    const data = response.flowSegmentData;
    if (!data) {
        throw new Error('No flowSegmentData returned');
    }
    const congestion = calculateCongestionFromSpeeds(data.currentSpeed, data.freeFlowSpeed);
    return {
        segment_id: String(segment.id),
        congestion_level: congestion,
        speed: data.currentSpeed,
        timestamp: new Date(data.timeStamp || Date.now()),
    };
};

const fetchTrafficForSegments = async (segments = []) => {
    const records = [];
    for (const segment of segments) {
        try {
            const record = await fetchGoogleTraffic(segment);
            records.push(record);
            continue;
        } catch (err) {
            logger.warn('Google traffic failed, trying TomTom', { segment: segment.id, message: err.message });
        }

        try {
            const record = await fetchTomTomTraffic(segment);
            records.push(record);
        } catch (err) {
            logger.warn('TomTom traffic failed', { segment: segment.id, message: err.message });
        }
    }

    return validateCollection(trafficRecordSchema, records, 'traffic');
};

const identifyHighTrafficZones = (records = [], threshold = 70) =>
    records.filter((record) => record.congestion_level >= threshold);

const storeTrafficRecords = async (records = []) => {
    const stored = [];
    for (const record of records) {
        try {
            const saved = await dataService.createTrafficData({
                congestion_level: record.congestion_level,
                speed: record.speed,
                timestamp: record.timestamp,
            });
            stored.push(saved);
        } catch (err) {
            logger.warn('Failed to persist traffic record', { message: err.message });
        }
    }
    return stored;
};

module.exports = {
    fetchTrafficForSegments,
    identifyHighTrafficZones,
    fetchGoogleTraffic,
    fetchTomTomTraffic,
    storeTrafficRecords,
    calculateCongestionFromDurations,
    calculateCongestionFromSpeeds,
    calculateSpeedFromDistance,
};
