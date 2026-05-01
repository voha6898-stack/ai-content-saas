const mongoose = require('mongoose');

// Snapshot analytics theo ngày cho từng user
const analyticsSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    date: { type: Date, required: true, index: true }, // Ngày của snapshot (00:00:00)

    // Content generated
    contentGenerated: {
      total:    { type: Number, default: 0 },
      YouTube:  { type: Number, default: 0 },
      TikTok:   { type: Number, default: 0 },
      Facebook: { type: Number, default: 0 },
      Instagram:{ type: Number, default: 0 },
    },

    // Posts distributed
    postsDistributed: {
      total:    { type: Number, default: 0 },
      YouTube:  { type: Number, default: 0 },
      TikTok:   { type: Number, default: 0 },
      Facebook: { type: Number, default: 0 },
    },

    // Pipeline stats
    pipelinesRun:   { type: Number, default: 0 },
    tokensUsed:     { type: Number, default: 0 },

    // Engagement tổng hợp từ PostedContent analytics
    totalViews:    { type: Number, default: 0 },
    totalLikes:    { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analyticsSnapshotSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
