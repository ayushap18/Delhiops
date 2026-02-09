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

const policy = getPolicy('crime');

const getCrimeReports = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sort_by, sort_order, ...filterFields } = req.query;
    delete filterFields.page;
    delete filterFields.limit;

    const options = { limit, offset, sort_by, sort_order, filters: filterFields };
    const cacheKey = cacheKeys.crimeList(options);

    const [{ data, cached }, total] = await Promise.all([
        cache.withCache(cacheKey, policy, () => dataService.getCrimeReports(options)),
        dataService.countCrimeReports(filterFields),
    ]);

    recordAccess(req.user?.sub, cacheKey);
    preloadLikelyNext(cacheKey);

    sendPaginated(res, data, buildPaginationMeta(total, page, limit), { cached });
});

const getCrimeReportById = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const { data, cached } = await cache.withCache(
        cacheKeys.crimeById(id),
        policy,
        () => dataService.getCrimeById(id)
    );
    recordAccess(req.user?.sub, cacheKeys.crimeById(id));
    if (!data) throw notFound('Crime report', id);
    sendSuccess(res, data, 200, { cached });
});

const createCrimeReport = asyncHandler(async (req, res) => {
    const payload = {
        ...req.body,
        timestamp: req.body.timestamp || new Date(),
        status: req.body.status || 'reported',
    };
    const record = await dataService.createCrimeReport(payload);
    await cache.deleteByPrefix('crime');
    emitEvent('crime:report', record, {
        type: 'crime',
        severity: record.severity,
        location: record.location,
    });
    emitEvent('stats:update', { type: 'crime', data: record }, { type: 'crime' });
    sendCreated(res, record);
});

const updateCrimeReport = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const existing = await dataService.getCrimeById(id);
    if (!existing) throw notFound('Crime report', id);

    const updatedPayload = {
        ...existing,
        ...req.body,
        location: req.body.location || existing.location,
        timestamp: req.body.timestamp || existing.timestamp,
        status: req.body.status || existing.status,
    };
    const updated = await dataService.updateCrimeReport(id, updatedPayload);
    await cache.deleteByPrefix('crime');
    emitEvent('stats:update', { type: 'crime', data: updated }, { type: 'crime' });
    sendSuccess(res, updated);
});

const deleteCrimeReport = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const removed = await dataService.deleteCrimeReport(id);
    if (!removed) throw notFound('Crime report', id);

    await cache.deleteByPrefix('crime');
    emitEvent('stats:update', { type: 'crime', deletedId: id }, { type: 'crime' });
    sendSuccess(res, { id });
});

module.exports = {
    getCrimeReports,
    getCrimeReportById,
    createCrimeReport,
    updateCrimeReport,
    deleteCrimeReport,
};
