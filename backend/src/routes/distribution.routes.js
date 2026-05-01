const express = require('express');
const { body } = require('express-validator');
const { schedulePost, cancelJob, getJobs, getJobDetail } = require('../controllers/distribution.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect);

const scheduleRules = [
  body('contentId').notEmpty().withMessage('contentId bắt buộc'),
  body('platform').isIn(['YouTube', 'TikTok', 'Facebook']).withMessage('Platform không hợp lệ'),
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt phải là ISO8601'),
];

// POST /api/distribution/schedule
router.post('/schedule', scheduleRules, schedulePost);

// GET /api/distribution/jobs?status=&platform=&page=
router.get('/jobs', getJobs);

// GET /api/distribution/jobs/:id
router.get('/jobs/:id', getJobDetail);

// DELETE /api/distribution/jobs/:id
router.delete('/jobs/:id', cancelJob);

module.exports = router;
