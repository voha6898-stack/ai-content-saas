const mongoose = require('mongoose');

const pipelineSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name:  { type: String, required: true, trim: true, maxlength: 100 },
    niche: {
      type: String,
      enum: ['technology', 'finance', 'lifestyle', 'food', 'travel', 'fitness',
             'education', 'entertainment', 'business', 'gaming', 'other'],
      required: true,
    },

    platform: {
      type: String,
      enum: ['YouTube', 'TikTok', 'Facebook', 'Instagram', 'all'],
      default: 'all',
    },

    // Danh sách topics từ user
    topics: [{ type: String, trim: true, maxlength: 200 }],

    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'paused'],
      default: 'pending',
      index: true,
    },

    // Thống kê
    stats: {
      total:     { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      failed:    { type: Number, default: 0 },
    },

    // BullMQ job ID của pipeline job
    bullJobId: { type: String, default: null },

    // Có tự động phân phối sau khi generate xong không
    autoDistribute: { type: Boolean, default: false },
    distributeAt:   { type: Date,    default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pipeline', pipelineSchema);
