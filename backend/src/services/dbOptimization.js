const { query } = require('./db');

const refreshMaterializedViews = async () => {
    await query('SELECT refresh_dashboard_materialized_views()');
};

const runRetention = async () => {
    await query('SELECT run_data_retention()');
};

const archiveOldPartitions = async (retentionMonths = 12) => {
    await query('SELECT archive_old_partitions($1)', [retentionMonths]);
};

const getSlowQueries = async (limit = 10) => {
    const result = await query(
        `SELECT queryid,
                calls,
                round(total_exec_time::numeric, 2) AS total_exec_ms,
                round(mean_exec_time::numeric, 2) AS mean_exec_ms,
                rows,
                left(query, 240) AS query_sample
         FROM pg_stat_statements
         ORDER BY total_exec_time DESC
         LIMIT $1`,
        [limit]
    );
    return result.rows;
};

const getLockStatus = async () => {
    const result = await query(
        `SELECT pid,
                usename,
                application_name,
                state,
                wait_event_type,
                wait_event,
                age(now(), query_start) AS query_age,
                left(query, 240) AS query_sample
         FROM pg_stat_activity
         WHERE datname = current_database()
           AND (wait_event_type IS NOT NULL OR state = 'active')
         ORDER BY query_age DESC`
    );
    return result.rows;
};

const getTableBloat = async () => {
    const result = await query(
        `SELECT schemaname,
                relname AS table_name,
                pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
                n_live_tup,
                n_dead_tup,
                round((n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_tuple_pct,
                last_vacuum,
                last_autovacuum,
                last_analyze,
                last_autoanalyze
         FROM pg_stat_user_tables
         ORDER BY n_dead_tup DESC
         LIMIT 30`
    );
    return result.rows;
};

module.exports = {
    refreshMaterializedViews,
    runRetention,
    archiveOldPartitions,
    getSlowQueries,
    getLockStatus,
    getTableBloat,
};
