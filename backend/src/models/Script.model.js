const mongoose = require('mongoose');

const sceneSchema = new mongoose.Schema({
  id:        { type: Number, required: true },
  name:      { type: String, required: true },
  timestamp: { type: String, required: true },
  duration:  { type: String, required: true },
  type:      { type: String, default: 'content' },
  script:    { type: String, required: true },
  direction: { type: String, default: '' },
  overlay:   { type: String, default: '' },
}, { _id: false });

const scriptSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic:    { type: String, required: true, trim: true, maxlength: 300 },
    platform: { type: String, required: true, enum: ['YouTube', 'TikTok', 'Facebook'] },
    duration: { type: String, required: true },
    style:    { type: String, required: true },
    output: {
      title:          { type: String, required: true },
      totalDuration:  { type: String, default: '' },
      scenes:         [sceneSchema],
      hashtags:       [{ type: String }],
      productionTips: [{ type: String }],
    },
    tokensUsed:  { type: Number, default: 0 },
    isFavorite:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Script', scriptSchema);
