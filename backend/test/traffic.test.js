const test = require('node:test');
const assert = require('node:assert');

const {
    calculateCongestionFromDurations,
    calculateCongestionFromSpeeds,
    calculateSpeedFromDistance,
} = require('../src/integrations/traffic');

test('calculateCongestionFromDurations computes percentage', () => {
    const congestion = calculateCongestionFromDurations(120, 100);
    assert.strictEqual(congestion, 20);
});

test('calculateCongestionFromSpeeds computes percentage', () => {
    const congestion = calculateCongestionFromSpeeds(30, 60);
    assert.strictEqual(congestion, 50);
});

test('calculateSpeedFromDistance returns km/h', () => {
    const speed = calculateSpeedFromDistance(10000, 600); // 10km in 10 minutes
    assert.strictEqual(speed, 60);
});
