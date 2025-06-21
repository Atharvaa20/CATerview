const express = require('express');
const router = express.Router();
const experiencesRouter = require('./experiences');
const statsRouter = require('./stats');
const collegesRouter = require('./colleges');
const usersRouter = require('./users');
const { admin } = require('../../middleware/auth');

// Experience routes
router.use('/experiences', admin, experiencesRouter);

// Stats route
router.use('/stats', admin, statsRouter);

// Colleges routes
router.use('/colleges', admin, collegesRouter);

// Users routes
router.use('/users', admin, usersRouter);

module.exports = router;
