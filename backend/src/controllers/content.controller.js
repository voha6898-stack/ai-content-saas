const { validationResult } = require('express-validator');
const contentService = require('../services/content.service');

const generate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { topic, platform } = req.body;
    const { content, usage } = await contentService.generate(
      req.user.id,
      topic,
      platform,
      req.todayCount || 0
    );

    res.status(201).json({ success: true, message: 'Tạo nội dung thành công', content, usage });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const page          = parseInt(req.query.page)   || 1;
    const limit         = parseInt(req.query.limit)  || 8;
    const platform      = req.query.platform         || null;
    const favoritesOnly = req.query.favorites === 'true';

    const data = await contentService.getHistory(req.user.id, page, limit, platform, favoritesOnly);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const deleteContent = async (req, res, next) => {
  try {
    await contentService.deleteOne(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xoá nội dung' });
  } catch (err) {
    next(err);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const result = await contentService.toggleFavorite(req.user.id, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, getHistory, deleteContent, toggleFavorite };
