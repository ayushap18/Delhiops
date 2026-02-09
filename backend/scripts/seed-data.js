#!/usr/bin/env node

const { generateBatch, generateCrimeReport, generateIncident, generateCameraStatus, generateTrafficData } = require('../src/integrations/mockGenerators');
const dataService = require('../src/services/dataService');
const { connectRedis } = require('../src/services/redis');
const logger = require('../src/utils/logger');

const parseArgs = () => {
    const args = {};
    process.argv.slice(2).forEach((arg) => {
        const match = arg.match(/^--(\w+)=(\d+)$/);
        if (match) {
            args[match[1]] = parseInt(match[2], 10);
        }
    });
    return {
        crime: args.crime || 50,
        incidents: args.incidents || 30,
        cameras: args.cameras || 20,
        traffic: args.traffic || 100,
    };
};

const seed = async () => {
    const counts = parseArgs();
    logger.info('Starting data seed', counts);

    await connectRedis();

    let created = { crime: 0, incidents: 0, cameras: 0, traffic: 0 };

    const crimeReports = generateBatch(generateCrimeReport, counts.crime);
    for (const report of crimeReports) {
        try {
            await dataService.createCrimeReport(report);
            created.crime++;
        } catch (err) {
            logger.warn('Failed to seed crime report', { message: err.message });
        }
    }

    const incidents = generateBatch(generateIncident, counts.incidents);
    for (const incident of incidents) {
        try {
            await dataService.createIncident(incident);
            created.incidents++;
        } catch (err) {
            logger.warn('Failed to seed incident', { message: err.message });
        }
    }

    const cameras = generateBatch(generateCameraStatus, counts.cameras);
    for (const camera of cameras) {
        try {
            await dataService.createCamera(camera);
            created.cameras++;
        } catch (err) {
            logger.warn('Failed to seed camera', { message: err.message });
        }
    }

    const trafficRecords = generateBatch(generateTrafficData, counts.traffic);
    for (const record of trafficRecords) {
        try {
            await dataService.createTrafficData(record);
            created.traffic++;
        } catch (err) {
            logger.warn('Failed to seed traffic data', { message: err.message });
        }
    }

    logger.info('Seed complete', created);
    process.exit(0);
};

seed().catch((err) => {
    logger.error('Seed failed', { message: err.message });
    process.exit(1);
});
