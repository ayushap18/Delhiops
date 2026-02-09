#!/usr/bin/env node
/* eslint-disable no-console */
const { performance } = require('perf_hooks');
const { queryNamed, close } = require('../../src/services/db');

const percentile = (values, p) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(idx, 0)];
};

const runQueryBenchmark = async (name, runner, iterations = 30) => {
    const timings = [];
    for (let i = 0; i < iterations; i += 1) {
        const start = performance.now();
        await runner();
        timings.push(performance.now() - start);
    }
    const avg = timings.reduce((sum, n) => sum + n, 0) / timings.length;
    return {
        name,
        iterations,
        avgMs: Number(avg.toFixed(2)),
        p50Ms: Number(percentile(timings, 50).toFixed(2)),
        p95Ms: Number(percentile(timings, 95).toFixed(2)),
        maxMs: Number(Math.max(...timings).toFixed(2)),
    };
};

const main = async () => {
    const iterations = Number.parseInt(process.env.DB_BENCH_ITERATIONS || '30', 10);
    const results = [];

    results.push(
        await runQueryBenchmark(
            'aqi_latest_100',
            () =>
                queryNamed(
                    'bench-aqi-latest-v1',
                    `SELECT id, timestamp, aqi
                     FROM air_quality_readings
                     ORDER BY timestamp DESC
                     LIMIT 100`,
                    []
                ),
            iterations
        )
    );

    results.push(
        await runQueryBenchmark(
            'incidents_open_100',
            () =>
                queryNamed(
                    'bench-inc-open-v1',
                    `SELECT id, type, severity, timestamp
                     FROM incidents
                     WHERE status IN ('open', 'in_progress')
                     ORDER BY timestamp DESC
                     LIMIT 100`,
                    []
                ),
            iterations
        )
    );

    results.push(
        await runQueryBenchmark(
            'traffic_latest_100',
            () =>
                queryNamed(
                    'bench-traffic-latest-v1',
                    `SELECT segment_id, congestion_level, speed, timestamp
                     FROM traffic_data
                     ORDER BY timestamp DESC
                     LIMIT 100`,
                    []
                ),
            iterations
        )
    );

    console.table(results);
    await close();
};

main().catch(async (err) => {
    console.error('DB benchmark failed:', err.message);
    await close();
    process.exit(1);
});
