const { validationResult } = require('express-validator');
const pipelineService = require('../services/pipeline.service');

const createPipeline = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const pipeline = await pipelineService.createPipeline(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Pipeline đã được tạo và đang chạy', pipeline });
  } catch (err) {
    next(err);
  }
};

const getPipelines = async (req, res, next) => {
  try {
    const data = await pipelineService.getPipelines(req.user.id, {
      page:  parseInt(req.query.page)  || 1,
      limit: parseInt(req.query.limit) || 10,
    });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const getPipelineStatus = async (req, res, next) => {
  try {
    const data = await pipelineService.getPipelineStatus(req.user.id, req.params.id);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const deletePipeline = async (req, res, next) => {
  try {
    await pipelineService.deletePipeline(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xoá pipeline' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPipeline, getPipelines, getPipelineStatus, deletePipeline };
