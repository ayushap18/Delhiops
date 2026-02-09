const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { createIncidentSchema, updateIncidentSchema } = require('../validators/incidents');
const { incidentsQuerySchema } = require('../validators/query');

router.get('/', authenticate, authorize(['Admin', 'Operator', 'Viewer']), validateQuery(incidentsQuerySchema), incidentsController.getIncidents);
router.get('/:id', authenticate, authorize(['Admin', 'Operator', 'Viewer']), incidentsController.getIncidentById);
router.post(
    '/',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(createIncidentSchema),
    incidentsController.createIncident
);
router.patch(
    '/:id',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(updateIncidentSchema),
    incidentsController.updateIncident
);
router.delete(
    '/:id',
    authenticate,
    authorize(['Admin']),
    incidentsController.deleteIncident
);

module.exports = router;
