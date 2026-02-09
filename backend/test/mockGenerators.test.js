const test = require('node:test');
const assert = require('node:assert');

const {
    generateCrimeReport,
    generateIncident,
    generateCameraStatus,
    generateEmergencyVehicle,
} = require('../src/integrations/mockGenerators');

test('generateCrimeReport returns required fields', () => {
    const report = generateCrimeReport();
    assert.ok(report.type);
    assert.ok(report.location);
    assert.ok(report.timestamp);
});

test('generateIncident returns required fields', () => {
    const incident = generateIncident();
    assert.ok(incident.type);
    assert.ok(incident.location);
    assert.ok(incident.status);
});

test('generateCameraStatus returns required fields', () => {
    const camera = generateCameraStatus();
    assert.ok(camera.location);
    assert.ok(camera.feed_url);
});

test('generateEmergencyVehicle returns required fields', () => {
    const vehicle = generateEmergencyVehicle();
    assert.ok(vehicle.id);
    assert.ok(vehicle.location);
    assert.ok(vehicle.speed);
});
