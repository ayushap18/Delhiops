const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

const pool = new Pool({
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    host: config.db.host,
    port: config.db.port,
    max: config.db.max,
    idleTimeoutMillis: config.db.idleTimeoutMillis,
    query_timeout: config.db.queryTimeoutMs,
    statement_timeout: config.db.statementTimeoutMs,
});

pool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL client error', { message: err.message });
});

const query = (text, params) => pool.query(text, params);

const queryNamed = (name, text, values = []) =>
    pool.query({
        name,
        text,
        values,
    });

const healthCheck = async () => {
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        return true;
    } finally {
        client.release();
    }
};

const close = async () => {
    await pool.end();
};

module.exports = {
    pool,
    query,
    queryNamed,
    healthCheck,
    close,
};
