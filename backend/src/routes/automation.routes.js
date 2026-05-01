const express = require('express');
const {
  createRule, getRules, updateRule, deleteRule, triggerRun, getRuns,
  getTrends, fetchTrendsNow,
} = require('../controllers/automation.controller');
const { protect, requirePro } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect);

// Trends — tất cả user đã đăng nhập đều xem được
router.get ('/trends',       getTrends);
router.post('/trends/fetch', fetchTrendsNow);

// Automation Rules + Runs — chỉ Pro (admin bypass tự động trong requirePro)
router.get   ('/rules',         requirePro, getRules);
router.post  ('/rules',         requirePro, createRule);
router.patch ('/rules/:id',     requirePro, updateRule);
router.delete('/rules/:id',     requirePro, deleteRule);
router.post  ('/rules/:id/run', requirePro, triggerRun);
router.get   ('/runs',          requirePro, getRuns);

module.exports = router;
