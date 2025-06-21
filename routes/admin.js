const express = require('express');
const router = express.Router();

// Admin index route
router.use('/', require('./admin/index'));

// Admin experiences route (direct)
router.use('/experiences', require('./admin/experiences'));

// Admin colleges route (direct)
router.use('/colleges', require('./admin/colleges'));

module.exports = router;
