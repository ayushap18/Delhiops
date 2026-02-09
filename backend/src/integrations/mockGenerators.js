const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

const randomInRange = (min, max) => Math.random() * (max - min) + min;

const generateLocation = (center = { lat: 28.6139, lng: 77.209 }, radiusKm = 8) => {
    const radiusInDegrees = radiusKm / 111;
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const latOffset = w * Math.cos(t);
    const lngOffset = w * Math.sin(t) / Math.cos((center.lat * Math.PI) / 180);
    return {
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset,
    };
};

const generateCrimeReport = (options = {}) => {
    const types = ['Theft', 'Assault', 'Burglary', 'Vandalism', 'Fraud', 'Robbery'];
    const severityLevels = ['low', 'medium', 'high'];
    const statuses = ['reported', 'investigating', 'resolved'];
    return {
        type: randomItem(types),
        location: generateLocation(options.center, options.radiusKm),
        severity: randomItem(severityLevels),
        timestamp: new Date(),
        status: randomItem(statuses),
    };
};

const generateIncident = (options = {}) => {
    const types = ['Fire', 'Accident', 'Medical', 'Power Outage', 'Flooding', 'Protest'];
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const statuses = ['open', 'in_progress', 'resolved'];
    return {
        type: randomItem(types),
        severity: randomItem(severityLevels),
        location: generateLocation(options.center, options.radiusKm),
        timestamp: new Date(),
        description: `${randomItem(types)} reported by field unit`,
        status: randomItem(statuses),
    };
};

const generateCameraStatus = (options = {}) => {
    const statuses = ['online', 'offline', 'maintenance'];
    const location = generateLocation(options.center, options.radiusKm);
    return {
        location,
        status: randomItem(statuses),
        feed_url: `https://streams.delhiops.local/cam/${Math.floor(Math.random() * 5000)}`,
    };
};

const generateTrafficData = () => {
    const hour = new Date().getHours();
    // Simulate realistic Delhi congestion patterns
    const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20);
    const baseCongestion = isPeak ? randomInRange(50, 90) : randomInRange(15, 55);
    const congestion = Math.round(Math.min(100, Math.max(0, baseCongestion + randomInRange(-10, 10))));
    const speed = Math.round(Math.max(5, 80 - congestion * 0.7 + randomInRange(-5, 5)));
    // Spread timestamps across last 48 hours
    const hoursAgo = Math.floor(Math.random() * 48);
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return {
        congestion_level: congestion,
        speed,
        timestamp,
    };
};

const generateEmergencyVehicle = (options = {}) => {
    const types = ['ambulance', 'police', 'fire'];
    const statuses = ['available', 'dispatching', 'on_scene', 'returning'];
    return {
        id: `ev-${Math.floor(Math.random() * 100000)}`,
        type: randomItem(types),
        location: generateLocation(options.center, options.radiusKm),
        speed: Math.round(randomInRange(20, 80)),
        heading: Math.round(randomInRange(0, 359)),
        status: randomItem(statuses),
        timestamp: new Date(),
    };
};

const generateBatch = (generator, count = 10, options = {}) =>
    Array.from({ length: count }, () => generator(options));

module.exports = {
    generateCrimeReport,
    generateIncident,
    generateCameraStatus,
    generateTrafficData,
    generateEmergencyVehicle,
    generateBatch,
};
