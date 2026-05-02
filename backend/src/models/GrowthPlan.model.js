const mongoose = require('mongoose');

const growthPlanSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic:    { type: String, required: true, trim: true, maxlength: 300 },
    platform: { type: String, required: true, enum: ['YouTube', 'TikTok', 'Facebook'] },
    goal:     { type: String, required: true, trim: true, maxlength: 200 },
    output: { type: mongoose.Schema.Types.Mixed, default: {} },
    tokensUsed: { type: Number, default: 0 },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GrowthPlan', growthPlanSchema);
