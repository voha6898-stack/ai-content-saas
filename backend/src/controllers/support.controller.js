const { body, validationResult } = require('express-validator');
const SupportTicket = require('../models/SupportTicket.model');

// ── Validation ────────────────────────────────────────────────────────────────

const CATEGORIES = { technical: 'Lỗi kỹ thuật', billing: 'Thanh toán', feature: 'Yêu cầu tính năng', other: 'Khác' };

const createValidation = [
  body('subject').trim().notEmpty().withMessage('Tiêu đề không được để trống').isLength({ max: 200 }),
  body('category').isIn(Object.keys(CATEGORIES)).withMessage('Danh mục không hợp lệ'),
  body('description').trim().notEmpty().withMessage('Mô tả không được để trống').isLength({ max: 3000 }),
];

// ── User: create ticket ───────────────────────────────────────────────────────

const createTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { subject, category, description, priority } = req.body;
    const ticket = await SupportTicket.create({
      userId:      req.user.id,
      subject:     subject.trim(),
      category,
      description: description.trim(),
      priority:    ['low', 'normal', 'high', 'urgent'].includes(priority) ? priority : 'normal',
      replies: [{
        message:    description.trim(),
        senderRole: 'user',
        senderName: req.user.email,
      }],
    });

    res.status(201).json({ success: true, message: 'Gửi yêu cầu hỗ trợ thành công!', data: ticket });
  } catch (err) { next(err); }
};

// ── User: get my tickets ──────────────────────────────────────────────────────

const getMyTickets = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(20, parseInt(req.query.limit) || 10);
    const status = req.query.status;
    const filter = { userId: req.user.id };
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) filter.status = status;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-replies'),
      SupportTicket.countDocuments(filter),
    ]);

    res.json({ success: true, data: { tickets, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── User: get single ticket (with replies) ────────────────────────────────────

const getTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    // Mark as read when user views it
    if (ticket.hasUnreadReply) {
      await SupportTicket.updateOne({ _id: ticket._id }, { hasUnreadReply: false });
      ticket.hasUnreadReply = false;
    }

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

// ── User: add reply to own ticket ─────────────────────────────────────────────

const addUserReply = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Nội dung không được để trống.' });

    const ticket = await SupportTicket.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    if (ticket.status === 'closed') return res.status(400).json({ success: false, message: 'Ticket đã đóng.' });

    ticket.replies.push({ message: message.trim(), senderRole: 'user', senderName: req.user.email });
    if (ticket.status === 'resolved') ticket.status = 'open'; // reopen if user replies after resolved
    await ticket.save();

    res.json({ success: true, message: 'Đã gửi phản hồi.', data: ticket });
  } catch (err) { next(err); }
};

// ── Admin: get all tickets ────────────────────────────────────────────────────

const adminGetAll = async (req, res, next) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page) || 1);
    const limit    = Math.min(50, parseInt(req.query.limit) || 15);
    const status   = req.query.status;
    const priority = req.query.priority;
    const search   = req.query.search;

    const filter = {};
    if (status   && ['open', 'in_progress', 'resolved', 'closed'].includes(status))  filter.status = status;
    if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) filter.priority = priority;
    if (search)  filter.subject = { $regex: search, $options: 'i' };

    const [tickets, total, counts] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email plan')
        .select('-replies'),
      SupportTicket.countDocuments(filter),
      SupportTicket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const statusCounts = counts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {});
    res.json({ success: true, data: { tickets, total, page, pages: Math.ceil(total / limit), statusCounts } });
  } catch (err) { next(err); }
};

// ── Admin: get single ticket ──────────────────────────────────────────────────

const adminGetTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('userId', 'name email plan');
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

// ── Admin: reply to ticket ────────────────────────────────────────────────────

const adminReply = async (req, res, next) => {
  try {
    const { message, status } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Nội dung không được để trống.' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    ticket.replies.push({ message: message.trim(), senderRole: 'admin', senderName: 'Admin' });
    ticket.hasUnreadReply = true;

    const newStatus = ['open', 'in_progress', 'resolved', 'closed'].includes(status) ? status : 'in_progress';
    ticket.status = newStatus;

    await ticket.save();
    res.json({ success: true, message: 'Đã phản hồi ticket.', data: ticket });
  } catch (err) { next(err); }
};

// ── Admin: update status only ─────────────────────────────────────────────────

const adminUpdateStatus = async (req, res, next) => {
  try {
    const { status, priority } = req.body;
    const update = {};
    if (status   && ['open', 'in_progress', 'resolved', 'closed'].includes(status))  update.status = status;
    if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) update.priority = priority;

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('userId', 'name email plan');
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    res.json({ success: true, message: 'Đã cập nhật.', data: ticket });
  } catch (err) { next(err); }
};

module.exports = {
  createValidation,
  createTicket,
  getMyTickets,
  getTicket,
  addUserReply,
  adminGetAll,
  adminGetTicket,
  adminReply,
  adminUpdateStatus,
};
