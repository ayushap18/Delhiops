const express = require('express');
const router = express.Router();
const crimeController = require('../controllers/crime.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { createCrimeSchema, updateCrimeSchema } = require('../validators/crime');
const { crimeQuerySchema } = require('../validators/query');

router.get('/', authenticate, authorize(['Admin', 'Operator', 'Viewer']), validateQuery(crimeQuerySchema), crimeController.getCrimeReports);
router.get('/:id', authenticate, authorize(['Admin', 'Operator', 'Viewer']), crimeController.getCrimeReportById);
router.post(
    '/',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(createCrimeSchema),
    crimeController.createCrimeReport
);
router.patch(
    '/:id',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(updateCrimeSchema),
    crimeController.updateCrimeReport
);
router.delete(
    '/:id',
    authenticate,
    authorize(['Admin']),
    crimeController.deleteCrimeReport
);

module.exports = router;
