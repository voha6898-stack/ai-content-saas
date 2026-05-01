const { body, validationResult } = require('express-validator');
const scriptService = require('../services/script.service');

const PLATFORM_DURATIONS = {
  YouTube: ['5 phút', '10 phút', '15 phút'],
  TikTok:  ['30 giây', '60 giây', '90 giây'],
  Facebook:['Bài viết', 'Reel 60 giây', 'Video 5 phút'],
};

const STYLES = {
  YouTube: ['storytelling', 'tutorial', 'listicle', 'review'],
  TikTok:  ['tutorial', 'story', 'trending', 'skit'],
  Facebook:['storytelling', 'educational', 'motivational'],
};

const generate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { topic, platform, duration, style } = req.body;

    const validDurations = PLATFORM_DURATIONS[platform] || [];
    if (!validDurations.includes(duration)) {
      return res.status(400).json({ success: false, message: `Thời lượng không hợp lệ cho ${platform}. Chọn: ${validDurations.join(', ')}` });
    }

    const validStyles = STYLES[platform] || [];
    if (!validStyles.includes(style)) {
      return res.status(400).json({ success: false, message: `Phong cách không hợp lệ cho ${platform}.` });
    }

    const script = await scriptService.generateScript(req.user.id, topic, platform, duration, style);
    res.status(201).json({ success: true, message: 'Tạo kịch bản thành công', script });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const page     = parseInt(req.query.page)  || 1;
    const limit    = parseInt(req.query.limit) || 8;
    const platform = req.query.platform        || null;
    const data = await scriptService.getHistory(req.user.id, page, limit, platform);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const deleteScript = async (req, res, next) => {
  try {
    await scriptService.deleteOne(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xoá kịch bản' });
  } catch (err) {
    next(err);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const result = await scriptService.toggleFavorite(req.user.id, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const generateValidation = [
  body('topic').trim().notEmpty().withMessage('Topic không được để trống').isLength({ max: 300 }).withMessage('Topic tối đa 300 ký tự'),
  body('platform').isIn(['YouTube', 'TikTok', 'Facebook']).withMessage('Platform không hợp lệ'),
  body('duration').trim().notEmpty().withMessage('Thời lượng không được để trống'),
  body('style').trim().notEmpty().withMessage('Phong cách không được để trống'),
];

module.exports = { generate, getHistory, deleteScript, toggleFavorite, generateValidation };
