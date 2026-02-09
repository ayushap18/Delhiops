const Joi = require('joi');
const { locationSchema } = require('./common');

const createAqiSchema = Joi.object({
    timestamp: Joi.date().iso().optional(),
    location: locationSchema.required(),
    aqi: Joi.number().integer().min(0).max(999).required(),
    pm2_5: Joi.number().min(0).allow(null),
    pm10: Joi.number().min(0).allow(null),
    o3: Joi.number().min(0).allow(null),
    no2: Joi.number().min(0).allow(null),
    so2: Joi.number().min(0).allow(null),
    co: Joi.number().min(0).allow(null),
});

const updateAqiSchema = Joi.object({
    timestamp: Joi.date().iso().optional(),
    location: locationSchema.optional(),
    aqi: Joi.number().integer().min(0).max(999).optional(),
    pm2_5: Joi.number().min(0).allow(null).optional(),
    pm10: Joi.number().min(0).allow(null).optional(),
    o3: Joi.number().min(0).allow(null).optional(),
    no2: Joi.number().min(0).allow(null).optional(),
    so2: Joi.number().min(0).allow(null).optional(),
    co: Joi.number().min(0).allow(null).optional(),
});

module.exports = {
    createAqiSchema,
    updateAqiSchema,
};
