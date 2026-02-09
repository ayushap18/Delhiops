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

const policy = getPolicy('incidents');

const getIncidents = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sort_by, sort_order, ...filterFields } = req.query;
    delete filterFields.page;
    delete filterFields.limit;

    const options = { limit, offset, sort_by, sort_order, filters: filterFields };
    const cacheKey = cacheKeys.incidentsList(options);

    const [{ data, cached }, total] = await Promise.all([
        cache.withCache(cacheKey, policy, () => dataService.getIncidents(options)),
        dataService.countIncidents(filterFields),
    ]);

    recordAccess(req.user?.sub, cacheKey);
    preloadLikelyNext(cacheKey);

    sendPaginated(res, data, buildPaginationMeta(total, page, limit), { cached });
});

const getIncidentById = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const { data, cached } = await cache.withCache(
        cacheKeys.incidentsById(id),
        policy,
        () => dataService.getIncidentById(id)
    );
    recordAccess(req.user?.sub, cacheKeys.incidentsById(id));
    if (!data) throw notFound('Incident', id);
    sendSuccess(res, data, 200, { cached });
});

const createIncident = asyncHandler(async (req, res) => {
    const payload = {
        ...req.body,
        timestamp: req.body.timestamp || new Date(),
        status: req.body.status || 'open',
    };
    const record = await dataService.createIncident(payload);
    await cache.deleteByPrefix('incidents');
    emitEvent('incident:new', record, {
        type: 'incidents',
        severity: record.severity,
        location: record.location,
    });
    emitEvent('stats:update', { type: 'incidents', data: record }, { type: 'incidents' });
    sendCreated(res, record);
});

const updateIncident = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const existing = await dataService.getIncidentById(id);
    if (!existing) throw notFound('Incident', id);

    const updatedPayload = {
        ...existing,
        ...req.body,
        location: req.body.location || existing.location,
        timestamp: req.body.timestamp || existing.timestamp,
        status: req.body.status || existing.status,
    };
    const updated = await dataService.updateIncident(id, updatedPayload);
    await cache.deleteByPrefix('incidents');
    emitEvent('incident:update', updated, {
        type: 'incidents',
        severity: updated.severity,
        location: updated.location,
    });
    emitEvent('stats:update', { type: 'incidents', data: updated }, { type: 'incidents' });
    sendSuccess(res, updated);
});

const deleteIncident = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw badRequest('Invalid ID parameter');

    const removed = await dataService.deleteIncident(id);
    if (!removed) throw notFound('Incident', id);

    await cache.deleteByPrefix('incidents');
    emitEvent('stats:update', { type: 'incidents', deletedId: id }, { type: 'incidents' });
    sendSuccess(res, { id });
});

module.exports = {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
};
