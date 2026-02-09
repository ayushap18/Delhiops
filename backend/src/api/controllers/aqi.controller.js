const config = require('../../config');
const dataService = require('../../services/dataService');
const cache = require('../../services/cache');
const cacheKeys = require('../../utils/cacheKeys');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { emitEvent } = require('../../services/socket');
const { getPolicy } = require('../../services/cachePolicies');
const { recordAccess, preloadLikelyNext } = require('../../services/cachePreloader');
const asyncHandler = require('../middlewares/asyncHandler');
const { notFound, badRequest } = require('../../utils/errors');
const { sendSuccess, sendPaginated, sendCreated } = require('../../utils/response');

const policy = getPolicy('aqi');

const getAqiData = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sort_by, sort_order, ...filterFields } = req.query;
    delete filterFields.page;
    delete filterFields.limit;

    const options = { limit, offset, sort_by, sort_order, filters: filterFields };
    const cacheKey = cacheKeys.aqiList(options);

    const [{ data, cached }, total] = await Promise.all([
        cache.withCache(cacheKey, policy, () => dataService.getAqiReadings(options)),
        dataService.countAqiReadings(filterFields),
    ]);

    recordAccess(req.user?.sub, cacheKey);
    preloadLikelyNext(cacheKey);

    sendPaginated(res, data, buildPaginationMeta(total, page, limit), { cached });
});

const getAqiDataById = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const { data, cached } = await cache.withCache(
        cacheKeys.aqiById(id),
        policy,
        () => dataService.getAqiById(id)
    );
    recordAccess(req.user?.sub, cacheKeys.aqiById(id));
    if (!data) throw notFound('AQI record', id);
    sendSuccess(res, data, 200, { cached });
});

const createAqiData = asyncHandler(async (req, res) => {
    const payload = {
        ...req.body,
        timestamp: req.body.timestamp || new Date(),
    };
    const record = await dataService.createAqi(payload);
    await cache.deleteByPrefix('aqi');
    emitEvent('stats:update', { type: 'aqi', data: record }, { type: 'aqi', location: record.location });

    if (record.aqi >= config.aqi.alertThreshold) {
        emitEvent(
            'aqi:alert',
            { threshold: config.aqi.alertThreshold, data: record },
            { type: 'aqi', severity: 'high', location: record.location }
        );
    }

    sendCreated(res, record);
});

const updateAqiData = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const existing = await dataService.getAqiById(id);
    if (!existing) throw notFound('AQI record', id);

    const updatedPayload = {
        ...existing,
        ...req.body,
        location: req.body.location || existing.location,
        timestamp: req.body.timestamp || existing.timestamp,
    };
    const updated = await dataService.updateAqi(id, updatedPayload);
    await cache.deleteByPrefix('aqi');
    emitEvent('stats:update', { type: 'aqi', data: updated }, { type: 'aqi', location: updated.location });
    sendSuccess(res, updated);
});

const deleteAqiData = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const removed = await dataService.deleteAqi(id);
    if (!removed) throw notFound('AQI record', id);

    await cache.deleteByPrefix('aqi');
    emitEvent('stats:update', { type: 'aqi', deletedId: id }, { type: 'aqi' });
    sendSuccess(res, { id });
});

module.exports = {
    getAqiData,
    getAqiDataById,
    createAqiData,
    updateAqiData,
    deleteAqiData,
};
