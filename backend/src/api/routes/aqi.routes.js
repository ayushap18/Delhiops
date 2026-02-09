const express = require('express');
const router = express.Router();
const aqiController = require('../controllers/aqi.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { createAqiSchema, updateAqiSchema } = require('../validators/aqi');
const { aqiQuerySchema } = require('../validators/query');

router.get('/', authenticate, authorize(['Admin', 'Operator', 'Viewer']), validateQuery(aqiQuerySchema), aqiController.getAqiData);
router.get('/:id', authenticate, authorize(['Admin', 'Operator', 'Viewer']), aqiController.getAqiDataById);
router.post(
    '/',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(createAqiSchema),
    aqiController.createAqiData
);
router.patch(
    '/:id',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(updateAqiSchema),
    aqiController.updateAqiData
);
router.delete(
    '/:id',
    authenticate,
    authorize(['Admin']),
    aqiController.deleteAqiData
);

module.exports = router;
