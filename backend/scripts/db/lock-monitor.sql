SELECT now() AS snapshot_at,
       a.pid,
       a.usename,
       a.application_name,
       a.state,
       a.wait_event_type,
       a.wait_event,
       age(now(), a.query_start) AS query_age,
       left(a.query, 240) AS query_sample
FROM pg_stat_activity a
WHERE a.datname = current_database()
  AND (a.wait_event_type IS NOT NULL OR a.state = 'active')
ORDER BY query_age DESC;
