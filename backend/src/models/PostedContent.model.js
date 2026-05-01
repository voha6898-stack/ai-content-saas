const mongoose = require('mongoose');

// Track content đã được đăng lên social platform
const postedContentSchema = new mongoose.Schema(
  {
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    distributionJobId:{ type: mongoose.Schema.Types.ObjectId, ref: 'DistributionJob', required: true },

    platform: {
      type: String,
      enum: ['YouTube', 'TikTok', 'Facebook'],
      required: true,
    },

    postId:  { type: String, required: true },  // ID của post trên platform
    postUrl: { type: String, default: null },    // URL công khai
    title:   { type: String, default: null },

    // Analytics platform (cập nhật bởi cron)
    analytics: {
      views:    { type: Number, default: 0 },
      likes:    { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares:   { type: Number, default: 0 },
      lastSyncAt: { type: Date, default: null },
    },

    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

postedContentSchema.index({ userId: 1, platform: 1 });
postedContentSchema.index({ contentId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('PostedContent', postedContentSchema);
