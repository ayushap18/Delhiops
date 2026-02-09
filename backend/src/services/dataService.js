const { query, queryNamed } = require('./db');
const { conflict, badRequest } = require('../utils/errors');

const mapLocation = (row) => {
    if (row.lat === null || row.lat === undefined) {
        return row;
    }
    return {
        ...row,
        location: {
            lat: row.lat,
            lng: row.lng,
        },
        lat: undefined,
        lng: undefined,
    };
};

const normalizeRows = (rows) => rows.map(mapLocation);

const handleDbError = (err, context) => {
    if (err.code === '23505') {
        throw conflict(`Duplicate ${context}`, { constraint: err.constraint });
    }
    if (err.code === '23503') {
        throw badRequest(`Related resource not found for ${context}`, { constraint: err.constraint });
    }
    throw err;
};

// --- Query builder helpers ---

const buildWhereClause = (filters, startIndex = 1) => {
    const conditions = [];
    const params = [];
    let idx = startIndex;

    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        switch (key) {
            case 'from_date':
                conditions.push(`timestamp >= $${idx++}`);
                params.push(value);
                break;
            case 'to_date':
                conditions.push(`timestamp <= $${idx++}`);
                params.push(value);
                break;
            case 'aqi_min':
                conditions.push(`aqi >= $${idx++}`);
                params.push(value);
                break;
            case 'aqi_max':
                conditions.push(`aqi <= $${idx++}`);
                params.push(value);
                break;
            case 'congestion_min':
                conditions.push(`congestion_level >= $${idx++}`);
                params.push(value);
                break;
            case 'congestion_max':
                conditions.push(`congestion_level <= $${idx++}`);
                params.push(value);
                break;
            case 'type':
                conditions.push(`type = $${idx++}`);
                params.push(value);
                break;
            case 'severity':
                conditions.push(`severity = $${idx++}`);
                params.push(value);
                break;
            case 'status':
                conditions.push(`status = $${idx++}`);
                params.push(value);
                break;
            default:
                break;
        }
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, params, nextIndex: idx };
};

const validateSortColumn = (sort_by, allowedColumns) => {
    return allowedColumns.includes(sort_by) ? sort_by : allowedColumns[0];
};

// --- AQI ---

const AQI_SORT_COLUMNS = ['timestamp', 'aqi', 'pm2_5', 'pm10', 'id'];

const getAqiReadings = async ({ limit = 50, offset = 0, sort_by = 'timestamp', sort_order = 'DESC', filters = {} } = {}) => {
    const sortCol = validateSortColumn(sort_by, AQI_SORT_COLUMNS);
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const { clause, params } = buildWhereClause(filters);
    const idx = params.length + 1;

    const sql = `SELECT id, timestamp, aqi, pm2_5, pm10, o3, no2, so2, co,
                        ST_Y(location::geometry) AS lat,
                        ST_X(location::geometry) AS lng
                 FROM air_quality_readings
                 ${clause}
                 ORDER BY ${sortCol} ${order}
                 LIMIT $${idx} OFFSET $${idx + 1}`;
    const result = await query(sql, [...params, limit, offset]);
    return normalizeRows(result.rows);
};

const countAqiReadings = async (filters = {}) => {
    const { clause, params } = buildWhereClause(filters);
    const result = await query(`SELECT COUNT(*)::int AS total FROM air_quality_readings ${clause}`, params);
    return result.rows[0].total;
};

const getAqiById = async (id) => {
    const result = await queryNamed(
        'get-aqi-by-id-v1',
        `SELECT id, timestamp, aqi, pm2_5, pm10, o3, no2, so2, co,
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
         FROM air_quality_readings
         WHERE id = $1`,
        [id]
    );
    return result.rows[0] ? mapLocation(result.rows[0]) : null;
};

const createAqi = async (data) => {
    try {
        const result = await query(
            `INSERT INTO air_quality_readings
             (timestamp, location, aqi, pm2_5, pm10, o3, no2, so2, co)
             VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, timestamp, aqi, pm2_5, pm10, o3, no2, so2, co,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [
                data.timestamp,
                data.location.lng,
                data.location.lat,
                data.aqi,
                data.pm2_5,
                data.pm10,
                data.o3,
                data.no2,
                data.so2,
                data.co,
            ]
        );
        return mapLocation(result.rows[0]);
    } catch (err) {
        handleDbError(err, 'AQI record');
    }
};

const updateAqi = async (id, data) => {
    try {
        const result = await query(
            `UPDATE air_quality_readings
             SET timestamp = $1,
                 location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
                 aqi = $4,
                 pm2_5 = $5,
                 pm10 = $6,
                 o3 = $7,
                 no2 = $8,
                 so2 = $9,
                 co = $10
             WHERE id = $11
             RETURNING id, timestamp, aqi, pm2_5, pm10, o3, no2, so2, co,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [
                data.timestamp,
                data.location.lng,
                data.location.lat,
                data.aqi,
                data.pm2_5,
                data.pm10,
                data.o3,
                data.no2,
                data.so2,
                data.co,
                id,
            ]
        );
        return result.rows[0] ? mapLocation(result.rows[0]) : null;
    } catch (err) {
        handleDbError(err, 'AQI record');
    }
};

const deleteAqi = async (id) => {
    const result = await query('DELETE FROM air_quality_readings WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
};

// --- Crime ---

const CRIME_SORT_COLUMNS = ['timestamp', 'type', 'severity', 'status', 'id'];

const getCrimeReports = async ({ limit = 50, offset = 0, sort_by = 'timestamp', sort_order = 'DESC', filters = {} } = {}) => {
    const sortCol = validateSortColumn(sort_by, CRIME_SORT_COLUMNS);
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const { clause, params } = buildWhereClause(filters);
    const idx = params.length + 1;

    const sql = `SELECT id, type, severity, timestamp, status,
                        ST_Y(location::geometry) AS lat,
                        ST_X(location::geometry) AS lng
                 FROM crime_reports
                 ${clause}
                 ORDER BY ${sortCol} ${order}
                 LIMIT $${idx} OFFSET $${idx + 1}`;
    const result = await query(sql, [...params, limit, offset]);
    return normalizeRows(result.rows);
};

const countCrimeReports = async (filters = {}) => {
    const { clause, params } = buildWhereClause(filters);
    const result = await query(`SELECT COUNT(*)::int AS total FROM crime_reports ${clause}`, params);
    return result.rows[0].total;
};

const getCrimeById = async (id) => {
    const result = await queryNamed(
        'get-crime-by-id-v1',
        `SELECT id, type, severity, timestamp, status,
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
         FROM crime_reports
         WHERE id = $1`,
        [id]
    );
    return result.rows[0] ? mapLocation(result.rows[0]) : null;
};

const createCrimeReport = async (data) => {
    try {
        const result = await query(
            `INSERT INTO crime_reports
             (type, location, severity, timestamp, status)
             VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5, $6)
             RETURNING id, type, severity, timestamp, status,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [data.type, data.location.lng, data.location.lat, data.severity, data.timestamp, data.status]
        );
        return mapLocation(result.rows[0]);
    } catch (err) {
        handleDbError(err, 'crime report');
    }
};

const updateCrimeReport = async (id, data) => {
    try {
        const result = await query(
            `UPDATE crime_reports
             SET type = $1,
                 location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
                 severity = $4,
                 timestamp = $5,
                 status = $6
             WHERE id = $7
             RETURNING id, type, severity, timestamp, status,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [data.type, data.location.lng, data.location.lat, data.severity, data.timestamp, data.status, id]
        );
        return result.rows[0] ? mapLocation(result.rows[0]) : null;
    } catch (err) {
        handleDbError(err, 'crime report');
    }
};

const deleteCrimeReport = async (id) => {
    const result = await query('DELETE FROM crime_reports WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
};

// --- Traffic ---

const TRAFFIC_SORT_COLUMNS = ['timestamp', 'congestion_level', 'speed'];

const getTrafficData = async ({ limit = 50, offset = 0, sort_by = 'timestamp', sort_order = 'DESC', filters = {} } = {}) => {
    const sortCol = validateSortColumn(sort_by, TRAFFIC_SORT_COLUMNS);
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const { clause, params } = buildWhereClause(filters);
    const idx = params.length + 1;

    const sql = `SELECT segment_id AS id, congestion_level, speed, timestamp
                 FROM traffic_data
                 ${clause}
                 ORDER BY ${sortCol} ${order}
                 LIMIT $${idx} OFFSET $${idx + 1}`;
    const result = await query(sql, [...params, limit, offset]);
    return result.rows;
};

const countTrafficData = async (filters = {}) => {
    const { clause, params } = buildWhereClause(filters);
    const result = await query(`SELECT COUNT(*)::int AS total FROM traffic_data ${clause}`, params);
    return result.rows[0].total;
};

const getTrafficById = async (id) => {
    const result = await queryNamed(
        'get-traffic-by-id-v1',
        `SELECT segment_id AS id, congestion_level, speed, timestamp
         FROM traffic_data
         WHERE segment_id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

const createTrafficData = async (data) => {
    try {
        const result = await query(
            `INSERT INTO traffic_data (congestion_level, speed, timestamp)
             VALUES ($1, $2, $3)
             RETURNING segment_id AS id, congestion_level, speed, timestamp`,
            [data.congestion_level, data.speed, data.timestamp]
        );
        return result.rows[0];
    } catch (err) {
        handleDbError(err, 'traffic record');
    }
};

const updateTrafficData = async (id, data) => {
    try {
        const result = await query(
            `UPDATE traffic_data
             SET congestion_level = $1,
                 speed = $2,
                 timestamp = $3
             WHERE segment_id = $4
             RETURNING segment_id AS id, congestion_level, speed, timestamp`,
            [data.congestion_level, data.speed, data.timestamp, id]
        );
        return result.rows[0] || null;
    } catch (err) {
        handleDbError(err, 'traffic record');
    }
};

const deleteTrafficData = async (id) => {
    const result = await query('DELETE FROM traffic_data WHERE segment_id = $1 RETURNING segment_id AS id', [id]);
    return result.rows[0] || null;
};

// --- Cameras ---

const CAMERAS_SORT_COLUMNS = ['id', 'status'];

const getCameras = async ({ limit = 200, offset = 0, sort_by = 'id', sort_order = 'ASC', filters = {} } = {}) => {
    const sortCol = validateSortColumn(sort_by, CAMERAS_SORT_COLUMNS);
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const { clause, params } = buildWhereClause(filters);
    const idx = params.length + 1;

    const sql = `SELECT id, status, coordinates, feed_url,
                        ST_Y(location::geometry) AS lat,
                        ST_X(location::geometry) AS lng
                 FROM cameras
                 ${clause}
                 ORDER BY ${sortCol} ${order}
                 LIMIT $${idx} OFFSET $${idx + 1}`;
    const result = await query(sql, [...params, limit, offset]);
    return normalizeRows(result.rows);
};

const countCameras = async (filters = {}) => {
    const { clause, params } = buildWhereClause(filters);
    const result = await query(`SELECT COUNT(*)::int AS total FROM cameras ${clause}`, params);
    return result.rows[0].total;
};

const getCameraById = async (id) => {
    const result = await queryNamed(
        'get-camera-by-id-v1',
        `SELECT id, status, coordinates, feed_url,
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
         FROM cameras
         WHERE id = $1`,
        [id]
    );
    return result.rows[0] ? mapLocation(result.rows[0]) : null;
};

const createCamera = async (data) => {
    try {
        const coordinates = data.location ? `${data.location.lat},${data.location.lng}` : null;
        const result = await query(
            `INSERT INTO cameras (location, status, coordinates, feed_url)
             VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3, $4, $5)
             RETURNING id, status, coordinates, feed_url,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [data.location.lng, data.location.lat, data.status, coordinates, data.feed_url]
        );
        return mapLocation(result.rows[0]);
    } catch (err) {
        handleDbError(err, 'camera');
    }
};

const updateCamera = async (id, data) => {
    try {
        const coordinates = data.location ? `${data.location.lat},${data.location.lng}` : data.coordinates;
        const result = await query(
            `UPDATE cameras
             SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                 status = $3,
                 coordinates = $4,
                 feed_url = $5
             WHERE id = $6
             RETURNING id, status, coordinates, feed_url,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [data.location.lng, data.location.lat, data.status, coordinates, data.feed_url, id]
        );
        return result.rows[0] ? mapLocation(result.rows[0]) : null;
    } catch (err) {
        handleDbError(err, 'camera');
    }
};

const deleteCamera = async (id) => {
    const result = await query('DELETE FROM cameras WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
};

// --- Incidents ---

const INCIDENTS_SORT_COLUMNS = ['timestamp', 'type', 'severity', 'status', 'id'];

const getIncidents = async ({ limit = 50, offset = 0, sort_by = 'timestamp', sort_order = 'DESC', filters = {} } = {}) => {
    const sortCol = validateSortColumn(sort_by, INCIDENTS_SORT_COLUMNS);
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const { clause, params } = buildWhereClause(filters);
    const idx = params.length + 1;

    const sql = `SELECT id, type, severity, timestamp, description, status,
                        ST_Y(location::geometry) AS lat,
                        ST_X(location::geometry) AS lng
                 FROM incidents
                 ${clause}
                 ORDER BY ${sortCol} ${order}
                 LIMIT $${idx} OFFSET $${idx + 1}`;
    const result = await query(sql, [...params, limit, offset]);
    return normalizeRows(result.rows);
};

const countIncidents = async (filters = {}) => {
    const { clause, params } = buildWhereClause(filters);
    const result = await query(`SELECT COUNT(*)::int AS total FROM incidents ${clause}`, params);
    return result.rows[0].total;
};

const getIncidentById = async (id) => {
    const result = await queryNamed(
        'get-incident-by-id-v1',
        `SELECT id, type, severity, timestamp, description, status,
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
         FROM incidents
         WHERE id = $1`,
        [id]
    );
    return result.rows[0] ? mapLocation(result.rows[0]) : null;
};

const createIncident = async (data) => {
    try {
        const result = await query(
            `INSERT INTO incidents (type, severity, location, timestamp, description, status)
             VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7)
             RETURNING id, type, severity, timestamp, description, status,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [data.type, data.severity, data.location.lng, data.location.lat, data.timestamp, data.description, data.status]
        );
        return mapLocation(result.rows[0]);
    } catch (err) {
        handleDbError(err, 'incident');
    }
};

const updateIncident = async (id, data) => {
    try {
        const result = await query(
            `UPDATE incidents
             SET type = $1,
                 severity = $2,
                 location = ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                 timestamp = $5,
                 description = $6,
                 status = $7
             WHERE id = $8
             RETURNING id, type, severity, timestamp, description, status,
                       ST_Y(location::geometry) AS lat,
                       ST_X(location::geometry) AS lng`,
            [data.type, data.severity, data.location.lng, data.location.lat, data.timestamp, data.description, data.status, id]
        );
        return result.rows[0] ? mapLocation(result.rows[0]) : null;
    } catch (err) {
        handleDbError(err, 'incident');
    }
};

const deleteIncident = async (id) => {
    const result = await query('DELETE FROM incidents WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
};

module.exports = {
    getAqiReadings,
    countAqiReadings,
    getAqiById,
    createAqi,
    updateAqi,
    deleteAqi,
    getCrimeReports,
    countCrimeReports,
    getCrimeById,
    createCrimeReport,
    updateCrimeReport,
    deleteCrimeReport,
    getTrafficData,
    countTrafficData,
    getTrafficById,
    createTrafficData,
    updateTrafficData,
    deleteTrafficData,
    getCameras,
    countCameras,
    getCameraById,
    createCamera,
    updateCamera,
    deleteCamera,
    getIncidents,
    countIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
};
