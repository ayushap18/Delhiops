const express = require('express');
const router = express.Router();

// Resource-specific routes
router.use('/auth', require('./auth.routes'));
router.use('/system', require('./system.routes'));
router.use('/aqi', require('./aqi.routes'));
router.use('/crime', require('./crime.routes'));
router.use('/traffic', require('./traffic.routes'));
router.use('/cameras', require('./cameras.routes'));
router.use('/incidents', require('./incidents.routes'));

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to Delhi Ops Dashboard API v1' });
});

module.exports = router;
