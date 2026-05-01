const User           = require('../models/User.model');
const PaymentRequest = require('../models/PaymentRequest.model');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FREE_CREDITS = parseInt(process.env.FREE_CREDITS) || 10;
const PRO_DAYS     = parseInt(process.env.PRO_DAYS) || 30;

// ── Helpers ─────────────────────────────────────────────────────────────────

const bankInfo = () => ({
  bankName:      process.env.BANK_NAME          || 'Vietcombank',
  bankId:        process.env.BANK_ID            || 'VCB',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
  accountName:   process.env.BANK_ACCOUNT_NAME   || 'NGUYEN VAN A',
  amount:        parseInt(process.env.PRO_PRICE_VND) || 199000,
});

const makeTransferCode = (userId) =>
  `CONTENTAI ${userId.toString().slice(-6).toUpperCase()}`;

// ── GET /api/payment/bank-info ───────────────────────────────────────────────
const getBankInfo = (req, res) => {
  const info = bankInfo();
  const transferCode = makeTransferCode(req.user.id);

  // VietQR URL — hiển thị QR code quét được bằng app ngân hàng Việt
  const qrUrl =
    `https://img.vietqr.io/image/${info.bankId}-${info.accountNumber}-compact2.jpg` +
    `?amount=${info.amount}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(info.accountName)}`;

  res.json({
    success: true,
    bankInfo: {
      ...info,
      transferCode,
      qrUrl,
    },
  });
};

// ── POST /api/payment/manual — user xác nhận đã chuyển khoản ────────────────
const submitManualPayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.plan === 'pro') {
      return res.status(400).json({ success: false, message: 'Tài khoản bạn đang là Pro rồi.' });
    }

    // Kiểm tra xem đã có pending request chưa
    const existing = await PaymentRequest.findOne({ userId: user._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi yêu cầu, đang chờ admin xác nhận. Thường trong vòng 24h.',
        requestId: existing._id,
        createdAt: existing.createdAt,
      });
    }

    const info = bankInfo();
    const request = await PaymentRequest.create({
      userId:       user._id,
      transferCode: makeTransferCode(user._id),
      amount:       info.amount,
      bankName:     info.bankName,
    });

    res.json({
      success: true,
      message: 'Đã ghi nhận. Admin sẽ xác nhận trong vòng 24h và tự động nâng cấp tài khoản.',
      requestId: request._id,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payment/manual/status — kiểm tra trạng thái yêu cầu ────────────
const getManualPaymentStatus = async (req, res, next) => {
  try {
    const request = await PaymentRequest
      .findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    if (!request) {
      return res.json({ success: true, status: null });
    }

    res.json({
      success:   true,
      status:    request.status,
      requestId: request._id,
      createdAt: request.createdAt,
      note:      request.note,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payment/webhook — Stripe webhook (raw body) ───────────────────
// Giữ lại để không bị lỗi import, nhưng Stripe không còn là payment chính
const webhook = async (req, res) => {
  // Stripe webhook không còn được dùng trong bản này
  res.json({ received: true });
};

module.exports = {
  getBankInfo,
  submitManualPayment,
  getManualPaymentStatus,
  webhook,
};
