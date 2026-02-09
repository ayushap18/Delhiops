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

const policy = getPolicy('cameras');

const getCameras = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query, { page: 1, limit: 200 });
    const { sort_by, sort_order, refresh, ...filterFields } = req.query;
    delete filterFields.page;
    delete filterFields.limit;

    const options = { limit, offset, sort_by, sort_order, filters: filterFields };
    const cacheKey = cacheKeys.camerasList(options);

    if (refresh === 'true') {
        const data = await dataService.getCameras(options);
        await cache.setJson(cacheKey, data, policy.ttlSeconds, policy);
        const total = await dataService.countCameras(filterFields);
        sendPaginated(res, data, buildPaginationMeta(total, page, limit), { cached: false, refreshed: true });
        return;
    }

    const [{ data, cached }, total] = await Promise.all([
        cache.withCache(cacheKey, policy, () => dataService.getCameras(options)),
        dataService.countCameras(filterFields),
    ]);

    recordAccess(req.user?.sub, cacheKey);
    preloadLikelyNext(cacheKey);

    sendPaginated(res, data, buildPaginationMeta(total, page, limit), { cached });
});

const getCameraById = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const refresh = req.query.refresh === 'true';

    if (refresh) {
        const data = await dataService.getCameraById(id);
        if (!data) throw notFound('Camera', id);
        await cache.setJson(cacheKeys.camerasById(id), data, policy.ttlSeconds, policy);
        sendSuccess(res, data, 200, { cached: false, refreshed: true });
        return;
    }

    const { data, cached } = await cache.withCache(
        cacheKeys.camerasById(id),
        policy,
        () => dataService.getCameraById(id)
    );
    recordAccess(req.user?.sub, cacheKeys.camerasById(id));
    if (!data) throw notFound('Camera', id);
    sendSuccess(res, data, 200, { cached });
});

const createCamera = asyncHandler(async (req, res) => {
    const payload = {
        ...req.body,
        status: req.body.status || 'offline',
    };
    const record = await dataService.createCamera(payload);
    await cache.deleteByPrefix('cameras');
    emitEvent('camera:status', record, { type: 'cameras', location: record.location });
    emitEvent('stats:update', { type: 'cameras', data: record }, { type: 'cameras' });
    sendCreated(res, record);
});

const updateCamera = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const existing = await dataService.getCameraById(id);
    if (!existing) throw notFound('Camera', id);

    const updatedPayload = {
        ...existing,
        ...req.body,
        location: req.body.location || existing.location,
        status: req.body.status || existing.status,
        feed_url: req.body.feed_url || existing.feed_url,
        coordinates: existing.coordinates,
    };
    const updated = await dataService.updateCamera(id, updatedPayload);
    await cache.deleteByPrefix('cameras');
    emitEvent('camera:status', updated, { type: 'cameras', location: updated.location });
    emitEvent('stats:update', { type: 'cameras', data: updated }, { type: 'cameras' });
    sendSuccess(res, updated);
});

const deleteCamera = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const removed = await dataService.deleteCamera(id);
    if (!removed) throw notFound('Camera', id);

    await cache.deleteByPrefix('cameras');
    emitEvent('stats:update', { type: 'cameras', deletedId: id }, { type: 'cameras' });
    sendSuccess(res, { id });
});

module.exports = {
    getCameras,
    getCameraById,
    createCamera,
    updateCamera,
    deleteCamera,
};
