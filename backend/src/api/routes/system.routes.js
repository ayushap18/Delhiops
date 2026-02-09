const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/metrics', authenticate, authorize(['Admin']), systemController.getSystemMetrics);
router.get('/cache/metrics', authenticate, authorize(['Admin']), systemController.getCacheMetrics);
router.get('/cache/keys', authenticate, authorize(['Admin']), systemController.listCacheKeys);
router.post('/cache/bust', authenticate, authorize(['Admin']), systemController.bustCache);
router.post('/cache/patch', authenticate, authorize(['Admin']), systemController.patchCache);
router.post('/cache/warm', authenticate, authorize(['Admin']), systemController.warmCacheNow);
router.post('/cache/preload', authenticate, authorize(['Admin']), systemController.triggerPreload);

router.get('/db/slow-queries', authenticate, authorize(['Admin']), systemController.getDbSlowQueries);
router.get('/db/locks', authenticate, authorize(['Admin']), systemController.getDbLockStatus);
router.get('/db/bloat', authenticate, authorize(['Admin']), systemController.getDbBloatStatus);
router.post('/db/views/refresh', authenticate, authorize(['Admin']), systemController.refreshDbViews);
router.post('/db/retention/run', authenticate, authorize(['Admin']), systemController.runDbRetention);
router.post('/db/partitions/archive', authenticate, authorize(['Admin']), systemController.archiveDbPartitions);

router.get('/config', authenticate, authorize(['Admin', 'Operator', 'Viewer']), systemController.getStaticConfig);
router.get('/preferences', authenticate, authorize(['Admin', 'Operator', 'Viewer']), systemController.getUserPreferences);
router.put('/preferences', authenticate, authorize(['Admin', 'Operator', 'Viewer']), systemController.upsertUserPreferences);

module.exports = router;
