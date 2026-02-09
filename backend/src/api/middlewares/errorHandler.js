const config = require('../../config');
const logger = require('../../utils/logger');
const { AppError } = require('../../utils/errors');

const errorHandler = (err, req, res, _next) => {
    const requestId = req.id || null;

    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logger.error(err.message, { requestId, code: err.code, stack: err.stack });
        } else {
            logger.warn(err.message, { requestId, code: err.code });
        }
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details || undefined,
            },
            requestId,
        });
    }

    // Joi validation error (thrown by validate middleware)
    if (err.isJoi || err.code === 'VALIDATION_ERROR') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
                details: err.details || undefined,
            },
            requestId,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
            },
            requestId,
        });
    }

    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_RESOURCE',
                message: 'Resource already exists',
                details: { constraint: err.constraint },
            },
            requestId,
        });
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REFERENCE',
                message: 'Referenced resource not found',
                details: { constraint: err.constraint },
            },
            requestId,
        });
    }

    // Unknown/unexpected errors
    logger.error('Unhandled error', {
        requestId,
        message: err.message,
        stack: err.stack,
        name: err.name,
    });

    const response = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
        requestId,
    };

    if (config.env === 'development') {
        response.error.stack = err.stack;
    }

    return res.status(500).json(response);
};

module.exports = errorHandler;
