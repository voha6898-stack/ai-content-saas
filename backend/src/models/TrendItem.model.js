const mongoose = require('mongoose');

// Một xu hướng từ bất kỳ nguồn nào, đã được score
const trendItemSchema = new mongoose.Schema(
  {
    // Nguồn lấy trend
    source: {
      type: String,
      enum: ['google_trends', 'youtube_trending', 'rss_vnexpress', 'rss_tuoitre', 'rss_dantri', 'rss_reddit'],
      required: true,
    },

    keyword:     { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    url:         { type: String, default: null },   // Link gốc (bài báo, video...)
    imageUrl:    { type: String, default: null },

    region:   { type: String, default: 'VN' },
    language: { type: String, default: 'vi' },

    // Category / niche detected
    niche: {
      type: String,
      enum: ['technology', 'finance', 'lifestyle', 'food', 'travel', 'fitness',
             'education', 'entertainment', 'business', 'gaming', 'news', 'other'],
      default: 'other',
    },

    // Điểm số do AI + heuristics đánh giá (0-100)
    scores: {
      viral:        { type: Number, default: 0 },   // Tốc độ viral
      monetization: { type: Number, default: 0 },   // Tiềm năng kiếm tiền
      competition:  { type: Number, default: 0 },   // Cạnh tranh thấp = điểm cao
      overall:      { type: Number, default: 0 },   // Tổng hợp (weighted)
    },

    // Phân tích từ AI
    aiAnalysis: {
      summary:         { type: String, default: null },
      whyViral:        { type: String, default: null },
      bestPlatforms:   [{ type: String }],           // ['TikTok', 'YouTube']
      contentAngles:   [{ type: String }],           // Góc tiếp cận gợi ý
      estimatedCPM:    { type: String, default: null },
    },

    // Liên kết với content đã tạo từ trend này
    generatedContentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    distributionJobIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'DistributionJob' }],

    // Metadata raw từ nguồn
    rawData: { type: mongoose.Schema.Types.Mixed, default: {} },

    fetchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

trendItemSchema.index({ source: 1, fetchedAt: -1 });
trendItemSchema.index({ 'scores.overall': -1 });
trendItemSchema.index({ niche: 1, 'scores.overall': -1 });

module.exports = mongoose.model('TrendItem', trendItemSchema);
