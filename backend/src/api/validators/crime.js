const Joi = require('joi');
const { locationSchema } = require('./common');

const createCrimeSchema = Joi.object({
    type: Joi.string().max(100).required(),
    location: locationSchema.required(),
    severity: Joi.string().max(50).optional(),
    timestamp: Joi.date().iso().optional(),
    status: Joi.string().valid('reported', 'investigating', 'resolved', 'closed').optional(),
});

const updateCrimeSchema = Joi.object({
    type: Joi.string().max(100).optional(),
    location: locationSchema.optional(),
    severity: Joi.string().max(50).optional(),
    timestamp: Joi.date().iso().optional(),
    status: Joi.string().valid('reported', 'investigating', 'resolved', 'closed').optional(),
});

module.exports = {
    createCrimeSchema,
    updateCrimeSchema,
};
