const { body, validationResult } = require('express-validator');
const growthService = require('../services/growth.service');

const generate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { topic, platform, goal } = req.body;
    const plan = await growthService.generateGrowthPlan(req.user.id, topic, platform, goal);
    res.status(201).json({ success: true, message: 'Tạo kế hoạch tăng trưởng thành công', plan });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const page     = parseInt(req.query.page)  || 1;
    const limit    = parseInt(req.query.limit) || 6;
    const platform = req.query.platform        || null;
    const data = await growthService.getHistory(req.user.id, page, limit, platform);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const plan = await growthService.getOne(req.user.id, req.params.id);
    res.json({ success: true, plan });
  } catch (err) { next(err); }
};

const deletePlan = async (req, res, next) => {
  try {
    await growthService.deleteOne(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xoá kế hoạch' });
  } catch (err) { next(err); }
};

const generateValidation = [
  body('topic').trim().notEmpty().withMessage('Chủ đề không được để trống').isLength({ max: 300 }),
  body('platform').isIn(['YouTube', 'TikTok', 'Facebook']).withMessage('Platform không hợp lệ'),
  body('goal').trim().notEmpty().withMessage('Mục tiêu không được để trống').isLength({ max: 200 }),
];

module.exports = { generate, getHistory, getOne, deletePlan, generateValidation };
