const Joi = require('joi');

const createTrafficSchema = Joi.object({
    congestion_level: Joi.number().min(0).max(100).required(),
    speed: Joi.number().min(0).required(),
    timestamp: Joi.date().iso().optional(),
});

const updateTrafficSchema = Joi.object({
    congestion_level: Joi.number().min(0).max(100).optional(),
    speed: Joi.number().min(0).optional(),
    timestamp: Joi.date().iso().optional(),
});

module.exports = {
    createTrafficSchema,
    updateTrafficSchema,
};
