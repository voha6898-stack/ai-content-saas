const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transferCode: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    bankName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    note: {
      type: String,
      default: '',
    },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
