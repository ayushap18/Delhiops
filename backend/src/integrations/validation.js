const Joi = require('joi');
const logger = require('../utils/logger');

const locationSchema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
});

const aqiReadingSchema = Joi.object({
    timestamp: Joi.date().required(),
    location: locationSchema.required(),
    aqi: Joi.number().integer().min(0).max(999).optional(),
    pm2_5: Joi.number().min(0).allow(null).optional(),
    pm10: Joi.number().min(0).allow(null).optional(),
    o3: Joi.number().min(0).allow(null).optional(),
    no2: Joi.number().min(0).allow(null).optional(),
    so2: Joi.number().min(0).allow(null).optional(),
    co: Joi.number().min(0).allow(null).optional(),
}).or('aqi', 'pm2_5', 'pm10', 'o3', 'no2', 'so2', 'co');

const trafficRecordSchema = Joi.object({
    segment_id: Joi.string().required(),
    congestion_level: Joi.number().min(0).max(100).required(),
    speed: Joi.number().min(0).required(),
    timestamp: Joi.date().required(),
});

const weatherSchema = Joi.object({
    timestamp: Joi.date().required(),
    location: locationSchema.required(),
    temperature: Joi.number().required(),
    humidity: Joi.number().min(0).max(100).required(),
    windSpeed: Joi.number().min(0).required(),
    conditions: Joi.string().required(),
});

const validateCollection = (schema, items, context) => {
    const valid = [];
    items.forEach((item) => {
        const { error, value } = schema.validate(item, { abortEarly: false });
        if (error) {
            logger.warn('External data validation failed', {
                context,
                details: error.details.map((detail) => detail.message),
            });
        } else {
            valid.push(value);
        }
    });
    return valid;
};

module.exports = {
    aqiReadingSchema,
    trafficRecordSchema,
    weatherSchema,
    validateCollection,
};
