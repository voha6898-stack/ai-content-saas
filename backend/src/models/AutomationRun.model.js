const mongoose = require('mongoose');

// Log của mỗi lần automation chạy
const automationRunSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    automationRuleId:{ type: mongoose.Schema.Types.ObjectId, ref: 'AutomationRule', required: true },

    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'partial'],
      default: 'running',
    },

    // Kết quả từng bước
    steps: {
      fetchTrends: {
        status:  { type: String, enum: ['pending','running','done','error'], default: 'pending' },
        count:   { type: Number, default: 0 },
        duration:{ type: Number, default: 0 }, // ms
      },
      analyzeTrends: {
        status:    { type: String, enum: ['pending','running','done','error'], default: 'pending' },
        selected:  { type: Number, default: 0 },
        duration:  { type: Number, default: 0 },
      },
      generateContent: {
        status:    { type: String, enum: ['pending','running','done','error'], default: 'pending' },
        created:   { type: Number, default: 0 },
        failed:    { type: Number, default: 0 },
        duration:  { type: Number, default: 0 },
      },
      monetize: {
        status:     { type: String, enum: ['pending','running','done','error','skipped'], default: 'pending' },
        linksAdded: { type: Number, default: 0 },
      },
      distribute: {
        status:    { type: String, enum: ['pending','running','done','error','skipped'], default: 'pending' },
        queued:    { type: Number, default: 0 },
      },
    },

    // IDs liên quan
    trendItemIds:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'TrendItem'       }],
    contentIds:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content'         }],
    distributionJobIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DistributionJob' }],

    error:    { type: String, default: null },
    startedAt:{ type: Date, default: Date.now },
    endedAt:  { type: Date, default: null     },

    // Thời gian chạy tổng (ms)
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

automationRunSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AutomationRun', automationRunSchema);
