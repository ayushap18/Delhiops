const bcrypt = require('bcrypt');
const config = require('../config');
const logger = require('../utils/logger');
const { query } = require('./db');

const seedAdminUser = async () => {
    const { email, password, role } = config.adminSeed;
    if (!email || !password) {
        logger.info('Admin seed skipped: ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD missing');
        return;
    }

    try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            logger.info('Admin seed skipped: user already exists');
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
            [email, passwordHash, role]
        );
        logger.info('Admin user seeded', { email });
    } catch (err) {
        logger.warn('Admin seed skipped: users table missing or not ready', { message: err.message });
    }
};

module.exports = {
    seedAdminUser,
};
