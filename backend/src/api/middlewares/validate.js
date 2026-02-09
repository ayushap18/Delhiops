const { validationError } = require('../../utils/errors');

const validateBody = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        throw validationError(error.details.map((detail) => detail.message));
    }
    req.body = value;
    return next();
};

const validateQuery = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        throw validationError(error.details.map((detail) => detail.message));
    }
    req.query = value;
    return next();
};

const validateParams = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        throw validationError(error.details.map((detail) => detail.message));
    }
    req.params = value;
    return next();
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams,
};
