const mongoose = require('mongoose');

const growthPlanSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic:    { type: String, required: true, trim: true, maxlength: 300 },
    platform: { type: String, required: true, enum: ['YouTube', 'TikTok', 'Facebook'] },
    goal:     { type: String, required: true, trim: true, maxlength: 200 },
    output: {
      channelPositioning: {
        description:    { type: String, default: '' },
        targetAudience: { type: String, default: '' },
        uniquePoint:    { type: String, default: '' },
      },
      contentPillars: [
        {
          name:        { type: String },
          percentage:  { type: Number },
          description: { type: String },
          _id: false,
        },
      ],
      thirtyDayPlan: [
        {
          day:    { type: Number },
          idea:   { type: String },
          hook:   { type: String },
          format: { type: String },
          cta:    { type: String },
          _id: false,
        },
      ],
      seoStrategy: {
        keywords:       [{ type: String }],
        hashtags:       [{ type: String }],
        titleTemplates: [{ type: String }],
      },
      viralFormula: {
        hookTemplates: [{ type: String }],
        contentTypes:  [{ type: String }],
      },
    },
    tokensUsed: { type: Number, default: 0 },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GrowthPlan', growthPlanSchema);
