const express = require('express');
const {
  createRule, getRules, updateRule, deleteRule, triggerRun, getRuns,
  getTrends, fetchTrendsNow,
} = require('../controllers/automation.controller');
const { protect }    = require('../middlewares/auth.middleware');
const { requirePro } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect, requirePro); // Automation chỉ dành cho Pro

// ── Automation Rules ──────────────────────────────────────────────────────────
router.post  ('/rules',         createRule);
router.get   ('/rules',         getRules);
router.patch ('/rules/:id',     updateRule);
router.delete('/rules/:id',     deleteRule);
router.post  ('/rules/:id/run', triggerRun); // Chạy thủ công ngay

// ── Runs history ──────────────────────────────────────────────────────────────
router.get('/runs', getRuns);

// ── Trends ───────────────────────────────────────────────────────────────────
router.get ('/trends',       getTrends);       // GET trending items từ DB
router.post('/trends/fetch', fetchTrendsNow);  // Trigger fetch thủ công

module.exports = router;
