const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { generate, getHistory, deleteContent, toggleFavorite } = require('../controllers/content.controller');
const { protect }         = require('../middlewares/auth.middleware');
const { checkDailyLimit } = require('../middlewares/plan.middleware');

const router = express.Router();

// Rate limit chống spam OpenAI (per-IP)
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Tạo nội dung quá nhanh, thử lại sau 1 phút.' },
});

const generateRules = [
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic không được để trống')
    .isLength({ max: 200 }).withMessage('Topic không được vượt quá 200 ký tự'),
  body('platform')
    .isIn(['YouTube', 'TikTok', 'Facebook', 'Instagram'])
    .withMessage('Platform không hợp lệ'),
];

router.use(protect);

// POST /api/content/generate
router.post('/generate', generateLimiter, checkDailyLimit, generateRules, generate);

// GET /api/content/history?page=1&limit=8&platform=YouTube&favorites=true
router.get('/history', getHistory);

// PATCH /api/content/:id/favorite
router.patch('/:id/favorite', toggleFavorite);

// DELETE /api/content/:id
router.delete('/:id', deleteContent);

module.exports = router;
