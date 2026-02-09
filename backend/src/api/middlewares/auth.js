const jwt = require('jsonwebtoken');
const config = require('../../config');
const { isBlacklisted } = require('../../services/tokenBlacklist');
const { unauthorized, forbidden } = require('../../utils/errors');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw unauthorized('Authorization header missing');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw unauthorized('Invalid authorization header format');
    }

    try {
        const payload = jwt.verify(token, config.jwt.secret);
        if (payload.jti && await isBlacklisted(payload.jti)) {
            throw unauthorized('Token has been revoked');
        }
        req.user = payload;
        return next();
    } catch (err) {
        if (err.statusCode) throw err;
        throw unauthorized('Invalid or expired token');
    }
};

const authorize = (roles = []) => {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            throw unauthorized('Unauthenticated request');
        }
        if (allowed.length > 0 && !allowed.includes(req.user.role)) {
            throw forbidden();
        }
        return next();
    };
};

module.exports = {
    authenticate,
    authorize,
};
