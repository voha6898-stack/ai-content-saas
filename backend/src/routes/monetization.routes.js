const express = require('express');
const { getAffiliateLinks, generateCTA, getRPMOptimization, addCustomLink, getMyLinks } = require('../controllers/monetization.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect);

// GET /api/monetization/affiliate/:contentId — tìm links phù hợp
router.get('/affiliate/:contentId', getAffiliateLinks);

// POST /api/monetization/cta/:contentId — tạo CTA tối ưu
router.post('/cta/:contentId', generateCTA);

// GET /api/monetization/rpm/:contentId — gợi ý tăng RPM
router.get('/rpm/:contentId', getRPMOptimization);

// POST /api/monetization/links — thêm affiliate link tuỳ chỉnh
router.post('/links', addCustomLink);

// GET /api/monetization/links — xem links của mình
router.get('/links', getMyLinks);

module.exports = router;
