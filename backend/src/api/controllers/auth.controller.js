const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { query } = require('../../services/db');
const { blacklistToken } = require('../../services/tokenBlacklist');
const { unauthorized } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../middlewares/asyncHandler');
const logger = require('../../utils/logger');

const logAttempt = (email, success, req) => {
    query(
        'INSERT INTO login_attempts (email, success, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [email, success, req.ip, req.get('User-Agent')]
    ).catch((err) => {
        logger.warn('Failed to log login attempt', { message: err.message });
    });
};

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
        logAttempt(email, false, req);
        throw unauthorized('Invalid credentials');
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        logAttempt(email, false, req);
        throw unauthorized('Invalid credentials');
    }

    const jti = crypto.randomUUID();
    const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role, jti },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    logAttempt(email, true, req);

    sendSuccess(res, {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    });
});

const logout = asyncHandler(async (req, res) => {
    const { jti, exp } = req.user;
    if (jti && exp) {
        const ttl = Math.max(exp - Math.floor(Date.now() / 1000), 0);
        if (ttl > 0) {
            await blacklistToken(jti, ttl);
        }
    }
    sendSuccess(res, { message: 'Logged out successfully' });
});

const refreshToken = asyncHandler(async (req, res) => {
    const { sub, jti: oldJti, exp } = req.user;

    const result = await query('SELECT id, email, role FROM users WHERE id = $1', [sub]);
    const user = result.rows[0];
    if (!user) {
        throw unauthorized('User no longer exists');
    }

    const newJti = crypto.randomUUID();
    const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role, jti: newJti },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    if (oldJti && exp) {
        const ttl = Math.max(exp - Math.floor(Date.now() / 1000), 0);
        if (ttl > 0) {
            await blacklistToken(oldJti, ttl);
        }
    }

    sendSuccess(res, {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    });
});

const me = asyncHandler(async (req, res) => {
    const result = await query('SELECT id, email, role FROM users WHERE id = $1', [req.user.sub]);
    const user = result.rows[0];
    if (!user) {
        throw unauthorized('User not found');
    }
    sendSuccess(res, { user });
});

module.exports = {
    login,
    logout,
    refreshToken,
    me,
};
