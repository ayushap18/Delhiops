EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM mv_dashboard_hourly
ORDER BY hour_bucket DESC
LIMIT 24;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, timestamp, aqi
FROM air_quality_readings
WHERE timestamp >= now() - interval '24 hours'
ORDER BY timestamp DESC
LIMIT 100;
