const test = require('node:test');
const assert = require('node:assert');

const {
    normalizeCpcbRecords,
    normalizeOpenWeatherResponse,
} = require('../src/integrations/airQuality');

test('normalizeCpcbRecords groups pollutants by station and timestamp', () => {
    const records = [
        {
            station: 'Anand Vihar',
            city: 'Delhi',
            last_update: '2025-01-01 10:00',
            pollutant_id: 'PM2.5',
            pollutant_avg: '120',
            latitude: '28.6500',
            longitude: '77.3000',
        },
        {
            station: 'Anand Vihar',
            city: 'Delhi',
            last_update: '2025-01-01 10:00',
            pollutant_id: 'PM10',
            pollutant_avg: '200',
            latitude: '28.6500',
            longitude: '77.3000',
        },
    ];

    const normalized = normalizeCpcbRecords(records);
    assert.strictEqual(normalized.length, 1);
    assert.strictEqual(normalized[0].pm2_5, 120);
    assert.strictEqual(normalized[0].pm10, 200);
    assert.strictEqual(normalized[0].location.lat, 28.65);
    assert.strictEqual(normalized[0].location.lng, 77.3);
});

test('normalizeOpenWeatherResponse maps components to normalized payload', () => {
    const data = {
        list: [
            {
                dt: 1735718400,
                main: { aqi: 3 },
                components: {
                    pm2_5: 55.2,
                    pm10: 70.1,
                    o3: 10,
                    no2: 20,
                    so2: 2,
                    co: 0.7,
                },
            },
        ],
    };
    const location = { lat: 28.6, lng: 77.2 };
    const normalized = normalizeOpenWeatherResponse(data, location);
    assert.strictEqual(normalized.length, 1);
    assert.strictEqual(normalized[0].aqi, 3);
    assert.strictEqual(normalized[0].pm2_5, 55.2);
    assert.strictEqual(normalized[0].location.lat, 28.6);
});
