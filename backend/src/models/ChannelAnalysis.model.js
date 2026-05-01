const mongoose = require('mongoose');

const ChannelAnalysisSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  platform: { type: String, required: true },
  handle:   { type: String, default: '' },
  niche:    { type: String, required: true },
  goal:     { type: String, required: true },
  mode:     { type: String, enum: ['quick', 'deep'], default: 'deep' },
  metrics: {
    subscribers:    { type: String, default: '' },
    avgViews:       { type: String, default: '' },
    engagementRate: { type: String, default: '' },
    postFrequency:  { type: String, default: '' },
  },
  sampleContent: { type: String, default: '' },
  analysis:      { type: mongoose.Schema.Types.Mixed, default: null },
  rewrite:       { type: mongoose.Schema.Types.Mixed, default: null },
  tokensUsed:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ChannelAnalysis', ChannelAnalysisSchema);
