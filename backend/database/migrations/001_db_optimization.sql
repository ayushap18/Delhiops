-- Delhi Ops DB Optimization Migration
-- Focus: indexing, materialized views, retention, partitioning, archival lifecycle.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE SCHEMA IF NOT EXISTS archive;

-- ---------------------------------------------------------------------------
-- Indexing strategy
-- ---------------------------------------------------------------------------

-- AQI
CREATE INDEX IF NOT EXISTS idx_aqi_timestamp_desc
    ON air_quality_readings (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_aqi_location_gist
    ON air_quality_readings USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_aqi_dashboard_cover
    ON air_quality_readings (timestamp DESC)
    INCLUDE (aqi, pm2_5, pm10, o3, no2, so2, co);

-- Crime
CREATE INDEX IF NOT EXISTS idx_crime_timestamp_status
    ON crime_reports (timestamp DESC, status);
CREATE INDEX IF NOT EXISTS idx_crime_location_gist
    ON crime_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_crime_dashboard_cover
    ON crime_reports (timestamp DESC, status)
    INCLUDE (type, severity);

-- Traffic
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp_desc
    ON traffic_data (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_dashboard_cover
    ON traffic_data (timestamp DESC)
    INCLUDE (congestion_level, speed);

-- Cameras
CREATE INDEX IF NOT EXISTS idx_cameras_status_id
    ON cameras (status, id);
CREATE INDEX IF NOT EXISTS idx_cameras_location_gist
    ON cameras USING GIST (location);

-- Incidents
CREATE INDEX IF NOT EXISTS idx_incidents_timestamp_status
    ON incidents (timestamp DESC, status);
CREATE INDEX IF NOT EXISTS idx_incidents_location_gist
    ON incidents USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_incidents_dashboard_cover
    ON incidents (timestamp DESC, status)
    INCLUDE (type, severity, description);
CREATE INDEX IF NOT EXISTS idx_incidents_active_partial
    ON incidents (timestamp DESC)
    WHERE status IN ('open', 'in_progress');

-- ---------------------------------------------------------------------------
-- Materialized views for dashboard aggregations
-- ---------------------------------------------------------------------------

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_hourly AS
WITH hours AS (
    SELECT generate_series(
        date_trunc('hour', now() - interval '7 days'),
        date_trunc('hour', now()),
        interval '1 hour'
    ) AS hour_bucket
),
aqi AS (
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           avg(aqi) AS avg_aqi,
           max(aqi) AS max_aqi,
           count(*) AS aqi_count
    FROM air_quality_readings
    WHERE timestamp >= now() - interval '7 days'
    GROUP BY 1
),
inc AS (
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           count(*) AS incident_count,
           count(*) FILTER (WHERE severity IN ('high', 'critical')) AS high_incident_count
    FROM incidents
    WHERE timestamp >= now() - interval '7 days'
    GROUP BY 1
),
crm AS (
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           count(*) AS crime_count
    FROM crime_reports
    WHERE timestamp >= now() - interval '7 days'
    GROUP BY 1
),
trf AS (
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           avg(congestion_level) AS avg_congestion,
           avg(speed) AS avg_speed
    FROM traffic_data
    WHERE timestamp >= now() - interval '7 days'
    GROUP BY 1
)
SELECT h.hour_bucket,
       coalesce(a.avg_aqi, 0) AS avg_aqi,
       coalesce(a.max_aqi, 0) AS max_aqi,
       coalesce(a.aqi_count, 0) AS aqi_count,
       coalesce(i.incident_count, 0) AS incident_count,
       coalesce(i.high_incident_count, 0) AS high_incident_count,
       coalesce(c.crime_count, 0) AS crime_count,
       coalesce(t.avg_congestion, 0) AS avg_congestion,
       coalesce(t.avg_speed, 0) AS avg_speed
FROM hours h
LEFT JOIN aqi a USING (hour_bucket)
LEFT JOIN inc i USING (hour_bucket)
LEFT JOIN crm c USING (hour_bucket)
LEFT JOIN trf t USING (hour_bucket)
ORDER BY h.hour_bucket DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_hourly_bucket
    ON mv_dashboard_hourly (hour_bucket DESC);

CREATE OR REPLACE FUNCTION refresh_dashboard_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_dashboard_hourly;
END;
$$;

-- ---------------------------------------------------------------------------
-- Partitioned history tables (monthly)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS air_quality_readings_history (
    history_id BIGSERIAL,
    source_id INT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    aqi INT,
    pm2_5 FLOAT,
    pm10 FLOAT,
    o3 FLOAT,
    no2 FLOAT,
    so2 FLOAT,
    co FLOAT,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (history_id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE IF NOT EXISTS crime_reports_history (
    history_id BIGSERIAL,
    source_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    severity VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL,
    status VARCHAR(50),
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (history_id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE IF NOT EXISTS traffic_data_history (
    history_id BIGSERIAL,
    source_id INT NOT NULL,
    congestion_level FLOAT,
    speed FLOAT,
    timestamp TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (history_id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE IF NOT EXISTS incidents_history (
    history_id BIGSERIAL,
    source_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    description TEXT,
    status VARCHAR(50),
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (history_id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE UNIQUE INDEX IF NOT EXISTS uq_aqi_history_source_timestamp
    ON air_quality_readings_history (source_id, timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS uq_crime_history_source_timestamp
    ON crime_reports_history (source_id, timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS uq_traffic_history_source_timestamp
    ON traffic_data_history (source_id, timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS uq_incidents_history_source_timestamp
    ON incidents_history (source_id, timestamp);

CREATE OR REPLACE FUNCTION create_monthly_history_partition(target_table REGCLASS, month_start DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    next_month DATE := (month_start + interval '1 month')::date;
    table_name TEXT;
    partition_name TEXT;
BEGIN
    SELECT relname INTO table_name
    FROM pg_class
    WHERE oid = target_table;
    partition_name := format('%s_%s', table_name, to_char(month_start, 'YYYYMM'));

    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %s FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        target_table,
        month_start::timestamptz,
        next_month::timestamptz
    );
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON %I (timestamp DESC)',
        partition_name || '_ts_idx',
        partition_name
    );
END;
$$;

CREATE OR REPLACE FUNCTION ensure_history_partitions(months_back INT DEFAULT 2, months_ahead INT DEFAULT 3)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    i INT;
    month_start DATE;
BEGIN
    FOR i IN -months_back..months_ahead LOOP
        month_start := date_trunc('month', now() + (i || ' month')::interval)::date;
        PERFORM create_monthly_history_partition('air_quality_readings_history'::regclass, month_start);
        PERFORM create_monthly_history_partition('crime_reports_history'::regclass, month_start);
        PERFORM create_monthly_history_partition('traffic_data_history'::regclass, month_start);
        PERFORM create_monthly_history_partition('incidents_history'::regclass, month_start);
    END LOOP;
END;
$$;

SELECT ensure_history_partitions(2, 3);

-- ---------------------------------------------------------------------------
-- Warm/cold aggregation tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS aqi_hourly_agg (
    hour_bucket TIMESTAMPTZ PRIMARY KEY,
    avg_aqi NUMERIC(10,2),
    max_aqi INT,
    reading_count BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS traffic_hourly_agg (
    hour_bucket TIMESTAMPTZ PRIMARY KEY,
    avg_congestion NUMERIC(10,2),
    avg_speed NUMERIC(10,2),
    sample_count BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents_hourly_agg (
    hour_bucket TIMESTAMPTZ PRIMARY KEY,
    incident_count BIGINT NOT NULL,
    high_severity_count BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS crime_hourly_agg (
    hour_bucket TIMESTAMPTZ PRIMARY KEY,
    crime_count BIGINT NOT NULL,
    high_severity_count BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS aqi_daily_agg (
    day_bucket DATE PRIMARY KEY,
    avg_aqi NUMERIC(10,2),
    max_aqi INT,
    reading_count BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS traffic_daily_agg (
    day_bucket DATE PRIMARY KEY,
    avg_congestion NUMERIC(10,2),
    avg_speed NUMERIC(10,2),
    sample_count BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents_daily_agg (
    day_bucket DATE PRIMARY KEY,
    incident_count BIGINT NOT NULL,
    high_severity_count BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS crime_daily_agg (
    day_bucket DATE PRIMARY KEY,
    crime_count BIGINT NOT NULL,
    high_severity_count BIGINT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Retention workflow
-- Hot data: 0-7 days in source tables
-- Warm data: 8-90 days rolled up hourly
-- Cold data: 90+ days rolled up daily and archived in partitioned history
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION run_data_retention()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM ensure_history_partitions(2, 3);

    -- Move source rows older than 7 days into monthly history tables.
    INSERT INTO air_quality_readings_history
        (source_id, timestamp, location, aqi, pm2_5, pm10, o3, no2, so2, co)
    SELECT id, timestamp, location, aqi, pm2_5, pm10, o3, no2, so2, co
    FROM air_quality_readings
    WHERE timestamp < now() - interval '7 days'
    ON CONFLICT (source_id, timestamp) DO NOTHING;
    DELETE FROM air_quality_readings WHERE timestamp < now() - interval '7 days';

    INSERT INTO crime_reports_history
        (source_id, type, location, severity, timestamp, status)
    SELECT id, type, location, severity, timestamp, status
    FROM crime_reports
    WHERE timestamp < now() - interval '7 days'
    ON CONFLICT (source_id, timestamp) DO NOTHING;
    DELETE FROM crime_reports WHERE timestamp < now() - interval '7 days';

    INSERT INTO traffic_data_history
        (source_id, congestion_level, speed, timestamp)
    SELECT segment_id, congestion_level, speed, timestamp
    FROM traffic_data
    WHERE timestamp < now() - interval '7 days'
    ON CONFLICT (source_id, timestamp) DO NOTHING;
    DELETE FROM traffic_data WHERE timestamp < now() - interval '7 days';

    INSERT INTO incidents_history
        (source_id, type, severity, location, timestamp, description, status)
    SELECT id, type, severity, location, timestamp, description, status
    FROM incidents
    WHERE timestamp < now() - interval '7 days'
    ON CONFLICT (source_id, timestamp) DO NOTHING;
    DELETE FROM incidents WHERE timestamp < now() - interval '7 days';

    -- Warm layer: hourly rollups for 8-90 days.
    INSERT INTO aqi_hourly_agg (hour_bucket, avg_aqi, max_aqi, reading_count)
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           avg(aqi), max(aqi), count(*)
    FROM air_quality_readings_history
    WHERE timestamp >= now() - interval '90 days'
      AND timestamp < now() - interval '7 days'
    GROUP BY 1
    ON CONFLICT (hour_bucket) DO UPDATE
    SET avg_aqi = excluded.avg_aqi,
        max_aqi = excluded.max_aqi,
        reading_count = excluded.reading_count;

    INSERT INTO traffic_hourly_agg (hour_bucket, avg_congestion, avg_speed, sample_count)
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           avg(congestion_level), avg(speed), count(*)
    FROM traffic_data_history
    WHERE timestamp >= now() - interval '90 days'
      AND timestamp < now() - interval '7 days'
    GROUP BY 1
    ON CONFLICT (hour_bucket) DO UPDATE
    SET avg_congestion = excluded.avg_congestion,
        avg_speed = excluded.avg_speed,
        sample_count = excluded.sample_count;

    INSERT INTO incidents_hourly_agg (hour_bucket, incident_count, high_severity_count)
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           count(*),
           count(*) FILTER (WHERE severity IN ('high', 'critical'))
    FROM incidents_history
    WHERE timestamp >= now() - interval '90 days'
      AND timestamp < now() - interval '7 days'
    GROUP BY 1
    ON CONFLICT (hour_bucket) DO UPDATE
    SET incident_count = excluded.incident_count,
        high_severity_count = excluded.high_severity_count;

    INSERT INTO crime_hourly_agg (hour_bucket, crime_count, high_severity_count)
    SELECT date_trunc('hour', timestamp) AS hour_bucket,
           count(*),
           count(*) FILTER (WHERE severity IN ('high', 'critical'))
    FROM crime_reports_history
    WHERE timestamp >= now() - interval '90 days'
      AND timestamp < now() - interval '7 days'
    GROUP BY 1
    ON CONFLICT (hour_bucket) DO UPDATE
    SET crime_count = excluded.crime_count,
        high_severity_count = excluded.high_severity_count;

    -- Cold layer: daily rollups for 90+ days.
    INSERT INTO aqi_daily_agg (day_bucket, avg_aqi, max_aqi, reading_count)
    SELECT date_trunc('day', timestamp)::date,
           avg(aqi), max(aqi), count(*)
    FROM air_quality_readings_history
    WHERE timestamp < now() - interval '90 days'
    GROUP BY 1
    ON CONFLICT (day_bucket) DO UPDATE
    SET avg_aqi = excluded.avg_aqi,
        max_aqi = excluded.max_aqi,
        reading_count = excluded.reading_count;

    INSERT INTO traffic_daily_agg (day_bucket, avg_congestion, avg_speed, sample_count)
    SELECT date_trunc('day', timestamp)::date,
           avg(congestion_level), avg(speed), count(*)
    FROM traffic_data_history
    WHERE timestamp < now() - interval '90 days'
    GROUP BY 1
    ON CONFLICT (day_bucket) DO UPDATE
    SET avg_congestion = excluded.avg_congestion,
        avg_speed = excluded.avg_speed,
        sample_count = excluded.sample_count;

    INSERT INTO incidents_daily_agg (day_bucket, incident_count, high_severity_count)
    SELECT date_trunc('day', timestamp)::date,
           count(*),
           count(*) FILTER (WHERE severity IN ('high', 'critical'))
    FROM incidents_history
    WHERE timestamp < now() - interval '90 days'
    GROUP BY 1
    ON CONFLICT (day_bucket) DO UPDATE
    SET incident_count = excluded.incident_count,
        high_severity_count = excluded.high_severity_count;

    INSERT INTO crime_daily_agg (day_bucket, crime_count, high_severity_count)
    SELECT date_trunc('day', timestamp)::date,
           count(*),
           count(*) FILTER (WHERE severity IN ('high', 'critical'))
    FROM crime_reports_history
    WHERE timestamp < now() - interval '90 days'
    GROUP BY 1
    ON CONFLICT (day_bucket) DO UPDATE
    SET crime_count = excluded.crime_count,
        high_severity_count = excluded.high_severity_count;
END;
$$;

CREATE OR REPLACE FUNCTION archive_old_partitions(retention_months INT DEFAULT 12)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    cutoff DATE := date_trunc('month', now() - (retention_months || ' months')::interval)::date;
    part_month DATE;
BEGIN
    FOR rec IN
        SELECT parent.relname AS parent_table, child.relname AS partition_table
        FROM pg_inherits i
        JOIN pg_class parent ON i.inhparent = parent.oid
        JOIN pg_class child ON i.inhrelid = child.oid
        WHERE parent.relname IN (
            'air_quality_readings_history',
            'crime_reports_history',
            'traffic_data_history',
            'incidents_history'
        )
          AND child.relname ~ '_(\d{6})$'
    LOOP
        part_month := to_date(right(rec.partition_table, 6), 'YYYYMM');
        IF part_month < cutoff THEN
            EXECUTE format(
                'ALTER TABLE %I DETACH PARTITION %I',
                rec.parent_table,
                rec.partition_table
            );
            EXECUTE format(
                'ALTER TABLE %I SET SCHEMA archive',
                rec.partition_table
            );
        END IF;
    END LOOP;
END;
$$;
