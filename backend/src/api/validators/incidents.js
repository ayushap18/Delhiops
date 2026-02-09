const Joi = require('joi');
const { locationSchema } = require('./common');

const createIncidentSchema = Joi.object({
    type: Joi.string().max(100).required(),
    severity: Joi.string().max(50).optional(),
    location: locationSchema.required(),
    timestamp: Joi.date().iso().optional(),
    description: Joi.string().max(5000).optional(),
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
});

const updateIncidentSchema = Joi.object({
    type: Joi.string().max(100).optional(),
    severity: Joi.string().max(50).optional(),
    location: locationSchema.optional(),
    timestamp: Joi.date().iso().optional(),
    description: Joi.string().max(5000).optional(),
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
});

module.exports = {
    createIncidentSchema,
    updateIncidentSchema,
};
