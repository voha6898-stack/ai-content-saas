const mongoose = require('mongoose');

const pipelineItemSchema = new mongoose.Schema(
  {
    pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline', required: true, index: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Content', default: null },

    topic:    { type: String, required: true, trim: true },
    platform: { type: String, enum: ['YouTube', 'TikTok', 'Facebook', 'Instagram'], required: true },
    niche:    { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },

    error:      { type: String, default: null },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PipelineItem', pipelineItemSchema);
