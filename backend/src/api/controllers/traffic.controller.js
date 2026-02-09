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

const policy = getPolicy('traffic');

const getTrafficData = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sort_by, sort_order, ...filterFields } = req.query;
    delete filterFields.page;
    delete filterFields.limit;

    const options = { limit, offset, sort_by, sort_order, filters: filterFields };
    const cacheKey = cacheKeys.trafficList(options);

    const [{ data, cached }, total] = await Promise.all([
        cache.withCache(cacheKey, policy, () => dataService.getTrafficData(options)),
        dataService.countTrafficData(filterFields),
    ]);

    recordAccess(req.user?.sub, cacheKey);
    preloadLikelyNext(cacheKey);

    sendPaginated(res, data, buildPaginationMeta(total, page, limit), { cached });
});

const getTrafficDataById = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const { data, cached } = await cache.withCache(
        cacheKeys.trafficById(id),
        policy,
        () => dataService.getTrafficById(id)
    );
    recordAccess(req.user?.sub, cacheKeys.trafficById(id));
    if (!data) throw notFound('Traffic record', id);
    sendSuccess(res, data, 200, { cached });
});

const createTrafficData = asyncHandler(async (req, res) => {
    const payload = {
        ...req.body,
        timestamp: req.body.timestamp || new Date(),
    };
    const record = await dataService.createTrafficData(payload);
    await cache.deleteByPrefix('traffic');
    emitEvent('traffic:congestion', record, { type: 'traffic' });
    emitEvent('stats:update', { type: 'traffic', data: record }, { type: 'traffic' });
    sendCreated(res, record);
});

const updateTrafficData = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const existing = await dataService.getTrafficById(id);
    if (!existing) throw notFound('Traffic record', id);

    const updatedPayload = {
        ...existing,
        ...req.body,
        timestamp: req.body.timestamp || existing.timestamp,
    };
    const updated = await dataService.updateTrafficData(id, updatedPayload);
    await cache.deleteByPrefix('traffic');
    emitEvent('traffic:congestion', updated, { type: 'traffic' });
    emitEvent('stats:update', { type: 'traffic', data: updated }, { type: 'traffic' });
    sendSuccess(res, updated);
});

const deleteTrafficData = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const removed = await dataService.deleteTrafficData(id);
    if (!removed) throw notFound('Traffic record', id);

    await cache.deleteByPrefix('traffic');
    emitEvent('stats:update', { type: 'traffic', deletedId: id }, { type: 'traffic' });
    sendSuccess(res, { id });
});

module.exports = {
    getTrafficData,
    getTrafficDataById,
    createTrafficData,
    updateTrafficData,
    deleteTrafficData,
};
