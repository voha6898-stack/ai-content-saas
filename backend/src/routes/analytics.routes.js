const express = require('express');
const { getOverview } = require('../controllers/analytics.controller');
const { protect }     = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect);

// GET /api/analytics/overview
router.get('/overview', getOverview);

module.exports = router;
