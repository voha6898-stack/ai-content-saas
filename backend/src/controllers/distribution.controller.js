const { validationResult } = require('express-validator');
const distributionService  = require('../services/distribution.service');

const schedulePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { contentId, platform, scheduledAt, options } = req.body;
    const job = await distributionService.schedulePost(
      req.user.id, contentId, platform,
      scheduledAt ? new Date(scheduledAt) : null,
      options || {}
    );

    const msg = scheduledAt
      ? `Đã lên lịch đăng lên ${platform} lúc ${new Date(scheduledAt).toLocaleString('vi-VN')}`
      : `Đang đăng lên ${platform}...`;

    res.status(201).json({ success: true, message: msg, job });
  } catch (err) {
    next(err);
  }
};

const cancelJob = async (req, res, next) => {
  try {
    const job = await distributionService.cancelJob(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã huỷ lịch đăng', job });
  } catch (err) {
    next(err);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const { status, platform, page, limit } = req.query;
    const data = await distributionService.getJobs(req.user.id, {
      status,
      platform,
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const getJobDetail = async (req, res, next) => {
  try {
    const job = await distributionService.getJobDetail(req.user.id, req.params.id);
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

module.exports = { schedulePost, cancelJob, getJobs, getJobDetail };
