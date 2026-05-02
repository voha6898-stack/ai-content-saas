const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic:    { type: String, required: true, trim: true, maxlength: 300 },
    platform: { type: String, required: true, enum: ['YouTube', 'TikTok', 'Facebook'] },
    duration: { type: String, required: true },
    style:    { type: String, required: true },
    output:   { type: mongoose.Schema.Types.Mixed, default: {} },
    tokensUsed:  { type: Number, default: 0 },
    isFavorite:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Script', scriptSchema);
