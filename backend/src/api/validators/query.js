const Joi = require('joi');

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(50),
});

const sortSchema = Joi.object({
    sort_by: Joi.string().max(50),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

const dateRangeSchema = Joi.object({
    from_date: Joi.date().iso(),
    to_date: Joi.date().iso(),
});

const idParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

const aqiQuerySchema = paginationSchema.concat(sortSchema).concat(dateRangeSchema).keys({
    aqi_min: Joi.number().integer().min(0),
    aqi_max: Joi.number().integer().min(0),
});

const crimeQuerySchema = paginationSchema.concat(sortSchema).concat(dateRangeSchema).keys({
    type: Joi.string().max(100),
    severity: Joi.string().max(50),
    status: Joi.string().valid('reported', 'investigating', 'resolved', 'closed'),
});

const trafficQuerySchema = paginationSchema.concat(sortSchema).concat(dateRangeSchema).keys({
    congestion_min: Joi.number().integer().min(0).max(100),
    congestion_max: Joi.number().integer().min(0).max(100),
});

const camerasQuerySchema = paginationSchema.concat(sortSchema).keys({
    status: Joi.string().valid('online', 'offline', 'maintenance'),
});

const incidentsQuerySchema = paginationSchema.concat(sortSchema).concat(dateRangeSchema).keys({
    type: Joi.string().max(100),
    severity: Joi.string().max(50),
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
});

module.exports = {
    paginationSchema,
    sortSchema,
    dateRangeSchema,
    idParamSchema,
    aqiQuerySchema,
    crimeQuerySchema,
    trafficQuerySchema,
    camerasQuerySchema,
    incidentsQuerySchema,
};
