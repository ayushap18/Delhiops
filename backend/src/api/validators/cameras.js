const Joi = require('joi');
const { locationSchema } = require('./common');

const createCameraSchema = Joi.object({
    location: locationSchema.required(),
    status: Joi.string().valid('online', 'offline', 'maintenance').optional(),
    feed_url: Joi.string().uri().required(),
});

const updateCameraSchema = Joi.object({
    location: locationSchema.optional(),
    status: Joi.string().valid('online', 'offline', 'maintenance').optional(),
    feed_url: Joi.string().uri().optional(),
});

module.exports = {
    createCameraSchema,
    updateCameraSchema,
};
