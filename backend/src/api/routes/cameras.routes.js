const express = require('express');
const router = express.Router();
const camerasController = require('../controllers/cameras.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { createCameraSchema, updateCameraSchema } = require('../validators/cameras');
const { camerasQuerySchema } = require('../validators/query');

router.get('/', authenticate, authorize(['Admin', 'Operator', 'Viewer']), validateQuery(camerasQuerySchema), camerasController.getCameras);
router.get('/:id', authenticate, authorize(['Admin', 'Operator', 'Viewer']), camerasController.getCameraById);
router.post(
    '/',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(createCameraSchema),
    camerasController.createCamera
);
router.patch(
    '/:id',
    authenticate,
    authorize(['Admin', 'Operator']),
    validateBody(updateCameraSchema),
    camerasController.updateCamera
);
router.delete(
    '/:id',
    authenticate,
    authorize(['Admin']),
    camerasController.deleteCamera
);

module.exports = router;
