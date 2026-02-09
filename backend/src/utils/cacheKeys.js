const buildFilterKey = (options = {}) => {
    const { limit = 50, offset = 0, sort_by, sort_order, ...filters } = options;
    const parts = [`${limit}:${offset}`];
    if (sort_by) parts.push(`${sort_by}:${sort_order || 'desc'}`);
    const filterEntries = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .sort(([a], [b]) => a.localeCompare(b));
    if (filterEntries.length > 0) {
        parts.push(filterEntries.map(([k, v]) => `${k}=${v}`).join('&'));
    }
    return parts.join(':');
};

const listKey = (prefix, options = {}) => {
    if (typeof options === 'number') {
        // backwards compat: listKey('aqi', 50)
        return `${prefix}:latest:${options}`;
    }
    return `${prefix}:list:${buildFilterKey(options)}`;
};

const idKey = (prefix, id) => `${prefix}:id:${id}`;

module.exports = {
    aqiList: (options) => listKey('aqi', options),
    aqiById: (id) => idKey('aqi', id),
    crimeList: (options) => listKey('crime', options),
    crimeById: (id) => idKey('crime', id),
    trafficList: (options) => listKey('traffic', options),
    trafficById: (id) => idKey('traffic', id),
    camerasList: (options) => listKey('cameras', options),
    camerasById: (id) => idKey('cameras', id),
    incidentsList: (options) => listKey('incidents', options),
    incidentsById: (id) => idKey('incidents', id),
};
