const svc = require('../services/channel-analysis.service');

const analyze = async (req, res, next) => {
  try {
    const { platform, handle, niche, goal, mode, metrics, sampleContent } = req.body;
    if (!platform || !niche || !goal) {
      return res.status(400).json({ success: false, message: 'platform, niche, goal là bắt buộc.' });
    }
    const doc = await svc.analyzeChannel(req.user.id, { platform, handle, niche, goal, mode: mode || 'deep', metrics, sampleContent });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

const rewrite = async (req, res, next) => {
  try {
    const doc = await svc.rewriteChannel(req.user.id, req.params.id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const result = await svc.getHistory(req.user.id, Number(page), Number(limit));
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const doc = await svc.getOne(req.user.id, req.params.id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

const deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xoá.' });
  } catch (err) { next(err); }
};

module.exports = { analyze, rewrite, getHistory, getOne, deleteOne };
