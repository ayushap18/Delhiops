SELECT queryid,
       calls,
       round(total_exec_time::numeric, 2) AS total_exec_ms,
       round(mean_exec_time::numeric, 2) AS mean_exec_ms,
       rows,
       left(query, 240) AS query_sample
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 25;
