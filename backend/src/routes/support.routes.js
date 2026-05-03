const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  createValidation, createTicket, getMyTickets, getTicket, addUserReply,
  adminGetAll, adminGetTicket, adminReply, adminUpdateStatus,
} = require('../controllers/support.controller');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
  next();
};

router.use(protect);

// ── User routes ───────────────────────────────────────────────────────────────
router.post('/',              createValidation, createTicket);
router.get('/',               getMyTickets);
router.get('/:id',            getTicket);
router.post('/:id/reply',     addUserReply);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/all',          requireAdmin, adminGetAll);
router.get('/admin/:id',          requireAdmin, adminGetTicket);
router.post('/admin/:id/reply',   requireAdmin, adminReply);
router.patch('/admin/:id/status', requireAdmin, adminUpdateStatus);

module.exports = router;
