class AppError extends Error {
    constructor(message, statusCode, code, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
    }
}

const notFound = (resource, id) =>
    new AppError(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND', { resource, id });

const badRequest = (message, details = null) =>
    new AppError(message, 400, 'BAD_REQUEST', details);

const conflict = (message, details = null) =>
    new AppError(message, 409, 'CONFLICT', details);

const unauthorized = (message = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED');

const forbidden = (message = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN');

const validationError = (details) =>
    new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

const serviceUnavailable = (message = 'Service temporarily unavailable') =>
    new AppError(message, 503, 'SERVICE_UNAVAILABLE');

module.exports = {
    AppError,
    notFound,
    badRequest,
    conflict,
    unauthorized,
    forbidden,
    validationError,
    serviceUnavailable,
};
