const mongoose = require('mongoose');

// Thư viện affiliate links theo niche và keywords
const affiliateLinkSchema = new mongoose.Schema(
  {
    // Niche phù hợp
    niche: {
      type: String,
      enum: ['technology', 'finance', 'lifestyle', 'food', 'travel', 'fitness',
             'education', 'entertainment', 'business', 'gaming', 'other', 'all'],
      required: true,
      index: true,
    },

    // Keywords trong content để match link này
    keywords: [{ type: String, lowercase: true }],

    name:        { type: String, required: true },   // Tên sản phẩm/dịch vụ
    description: { type: String, default: '' },
    url:         { type: String, required: true },   // Affiliate URL
    network:     { type: String, default: 'direct' }, // clickbank, cj, shareasale...

    // CTA template phù hợp
    ctaTemplates: [{ type: String }],

    commission:  { type: String, default: '' },  // "10%" hoặc "$5/sale"
    isActive:    { type: Boolean, default: true },
    clickCount:  { type: Number,  default: 0 },

    // Quản lý bởi admin (userId = null) hoặc user tự thêm
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

affiliateLinkSchema.index({ niche: 1, isActive: 1 });

module.exports = mongoose.model('AffiliateLink', affiliateLinkSchema);
