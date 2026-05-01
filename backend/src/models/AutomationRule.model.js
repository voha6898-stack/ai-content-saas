const mongoose = require('mongoose');

// Quy tắc automation của từng user
const automationRuleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name:     { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: false },

    // ── Nguồn trend ───────────────────────────────────
    trendSources: {
      type: [String],
      enum: ['google_trends', 'youtube_trending', 'rss_vnexpress', 'rss_tuoitre', 'rss_dantri'],
      default: ['google_trends', 'youtube_trending', 'rss_vnexpress'],
    },
    niches: {
      type: [String],
      default: ['technology', 'finance', 'lifestyle'],
    },
    regions: { type: [String], default: ['VN'] },

    // ── Filter trend ──────────────────────────────────
    minOverallScore:   { type: Number, default: 50, min: 0, max: 100 },
    maxTrendsPerRun:   { type: Number, default: 5,  min: 1, max: 20  },

    // ── Tạo content ───────────────────────────────────
    platforms: {
      type: [String],
      enum: ['YouTube', 'TikTok', 'Facebook', 'Instagram'],
      default: ['TikTok', 'YouTube'],
    },
    contentPerTrend: { type: Number, default: 1, min: 1, max: 4 }, // Số platform per trend

    // ── Phân phối ─────────────────────────────────────
    autoDistribute: { type: Boolean, default: false },
    distributeDelay: { type: Number, default: 60 }, // Phút delay sau khi generate xong

    // ── Monetization ──────────────────────────────────
    autoMonetize:   { type: Boolean, default: true },  // Tự động gắn affiliate + CTA
    autoOptimizeRPM:{ type: Boolean, default: false }, // Chỉ cho YouTube

    // ── Giới hạn ──────────────────────────────────────
    maxDailyPosts: { type: Number, default: 10 },
    postsToday:    { type: Number, default: 0  },
    postsResetAt:  { type: Date, default: null },

    // ── Lịch chạy ─────────────────────────────────────
    runEveryHours: { type: Number, default: 12, min: 1, max: 168 },
    lastRunAt:     { type: Date, default: null },
    nextRunAt:     { type: Date, default: null },

    // Stats
    stats: {
      totalRuns:          { type: Number, default: 0 },
      totalTrendsFound:   { type: Number, default: 0 },
      totalContentCreated:{ type: Number, default: 0 },
      totalPostsPublished:{ type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index để cron tìm rules cần chạy
automationRuleSchema.index({ isActive: 1, nextRunAt: 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
