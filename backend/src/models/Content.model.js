const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index để query history nhanh hơn
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Topic không được vượt quá 200 ký tự'],
    },
    platform: {
      type: String,
      required: true,
      enum: ['YouTube', 'TikTok', 'Facebook', 'Instagram'],
    },
    output: {
      title: { type: String, required: true },
      script: { type: String, required: true },
      caption: { type: String, required: true },
      hashtags: [{ type: String }],
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);
