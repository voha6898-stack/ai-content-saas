const express = require('express');
const { body } = require('express-validator');
const { createPipeline, getPipelines, getPipelineStatus, deletePipeline } = require('../controllers/pipeline.controller');
const { protect }   = require('../middlewares/auth.middleware');
const { requirePro } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect, requirePro); // Pipeline chỉ dành cho Pro

const createRules = [
  body('name').trim().notEmpty().withMessage('Tên pipeline bắt buộc'),
  body('niche').isIn(['technology', 'finance', 'lifestyle', 'food', 'travel',
    'fitness', 'education', 'entertainment', 'business', 'gaming', 'other'])
    .withMessage('Niche không hợp lệ'),
  body('platform').isIn(['YouTube', 'TikTok', 'Facebook', 'Instagram', 'all'])
    .withMessage('Platform không hợp lệ'),
  body('topics').isArray({ min: 1, max: 50 }).withMessage('Topics phải là mảng 1-50 phần tử'),
];

router.post('/',         createRules, createPipeline);
router.get('/',          getPipelines);
router.get('/:id',       getPipelineStatus);
router.delete('/:id',    deletePipeline);

module.exports = router;
