const mongoose = require('mongoose');

const distributionJobSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },

    platform: {
      type: String,
      enum: ['YouTube', 'TikTok', 'Facebook'],
      required: true,
    },

    // Trạng thái job
    status: {
      type: String,
      enum: ['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Thời gian đăng (null = đăng ngay)
    scheduledAt: { type: Date, default: null, index: true },

    // BullMQ job ID để track/cancel
    bullJobId: { type: String, default: null },

    // Kết quả sau khi post thành công
    result: {
      postId:  { type: String, default: null },
      postUrl: { type: String, default: null },
      postedAt: { type: Date, default: null },
    },

    // Chi tiết lỗi nếu failed
    error: { type: String, default: null },

    // Số lần đã retry
    attempts: { type: Number, default: 0 },

    // Metadata platform-specific (privacy, category, tags...)
    options: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Index để query jobs đến hạn
distributionJobSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('DistributionJob', distributionJobSchema);
