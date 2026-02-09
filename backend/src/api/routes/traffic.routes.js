const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/traffic.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { createTrafficSchema, updateTrafficSchema } = require('../validators/traffic');
const { trafficQuerySchema } = require('../validators/query');

router.get('/', authenticate, authorize(['Admin', 'Operator', 'Viewer']), validateQuery(trafficQuerySchema), trafficController.getTrafficData);
router.get('/:id', authenticate, authorize(['Admin', 'Operator', 'Viewer']), trafficController.getTrafficDataById);
router.post(
    '/',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(createTrafficSchema),
    trafficController.createTrafficData
);
router.patch(
    '/:id',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(updateTrafficSchema),
    trafficController.updateTrafficData
);
router.delete(
    '/:id',
    authenticate,
    authorize(['Admin']),
    trafficController.deleteTrafficData
);

module.exports = router;
