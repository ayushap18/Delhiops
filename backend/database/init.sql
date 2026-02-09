CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create tables for the Delhi Ops Dashboard

-- Table for Air Quality Readings
CREATE TABLE IF NOT EXISTS air_quality_readings (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    aqi INT,
    pm2_5 FLOAT,
    pm10 FLOAT,
    o3 FLOAT,
    no2 FLOAT,
    so2 FLOAT,
    co FLOAT
);

-- Table for Crime Reports
CREATE TABLE IF NOT EXISTS crime_reports (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    severity VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'reported'
);

-- Table for Traffic Data
CREATE TABLE IF NOT EXISTS traffic_data (
    segment_id SERIAL PRIMARY KEY,
    congestion_level FLOAT,
    speed FLOAT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for Cameras
CREATE TABLE IF NOT EXISTS cameras (
    id SERIAL PRIMARY KEY,
    location GEOGRAPHY(Point, 4326),
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    coordinates VARCHAR(255),
    feed_url VARCHAR(255)
);

-- Table for Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open'
);

-- Table for System Metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_name VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL
);

-- Table for Users (authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_aqi_location_gist ON air_quality_readings USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_aqi_timestamp ON air_quality_readings (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crime_location_gist ON crime_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_crime_timestamp ON crime_reports (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_location_gist ON incidents USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_time ON traffic_data (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
