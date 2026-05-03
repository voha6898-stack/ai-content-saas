const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    message:    { type: String, required: true, maxlength: 2000 },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    senderName: { type: String, default: '' },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Tiêu đề tối đa 200 ký tự'],
    },
    category: {
      type: String,
      required: true,
      enum: ['technical', 'billing', 'feature', 'other'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [3000, 'Mô tả tối đa 3000 ký tự'],
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    replies: [replySchema],
    // Track unread admin replies for user
    hasUnreadReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
