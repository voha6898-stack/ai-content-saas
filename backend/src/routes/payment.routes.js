const express  = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  getBankInfo,
  submitManualPayment,
  getManualPaymentStatus,
  webhook,
} = require('../controllers/payment.controller');

const router = express.Router();

// Webhook (giữ lại, không còn dùng Stripe nhưng không bị lỗi)
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// Manual bank-transfer payment
router.get('/bank-info',      protect, getBankInfo);
router.post('/manual',        protect, submitManualPayment);
router.get('/manual/status',  protect, getManualPaymentStatus);

module.exports = router;
