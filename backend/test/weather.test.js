const test = require('node:test');
const assert = require('node:assert');

const { normalizeWeatherResponse, estimatePollutionRisk } = require('../src/integrations/weather');

test('normalizeWeatherResponse shapes current weather payload', () => {
    const data = {
        dt: 1735718400,
        main: { temp: 25.5, humidity: 60 },
        wind: { speed: 2.2 },
        weather: [{ description: 'clear sky' }],
    };
    const location = { lat: 28.6, lng: 77.2 };
    const normalized = normalizeWeatherResponse(data, location);
    assert.strictEqual(normalized.length, 1);
    assert.strictEqual(normalized[0].temperature, 25.5);
    assert.strictEqual(normalized[0].humidity, 60);
    assert.strictEqual(normalized[0].conditions, 'clear sky');
});

test('estimatePollutionRisk categorizes risk', () => {
    const riskHigh = estimatePollutionRisk({ windSpeed: 1, humidity: 80 });
    const riskLow = estimatePollutionRisk({ windSpeed: 5, humidity: 40 });
    assert.strictEqual(riskHigh, 'high');
    assert.strictEqual(riskLow, 'low');
});
