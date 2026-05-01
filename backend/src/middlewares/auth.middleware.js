const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('plan email');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc người dùng không tồn tại.',
      });
    }

    req.user = {
      id: user._id.toString(),
      plan: user.plan,
      email: user.email,
      isAdmin: user.email === (process.env.ADMIN_EMAIL || ''),
    };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn, vui lòng đăng nhập lại.' });
    }
    next(err);
  }
};

// Chỉ cho phép Pro — admin luôn được bypass
const requirePro = (req, res, next) => {
  if (req.user.plan === 'pro' || req.user.isAdmin) return next();
  return res.status(403).json({
    success: false,
    code: 'PRO_REQUIRED',
    message: 'Tính năng này chỉ dành cho người dùng Pro.',
  });
};

module.exports = { protect, requirePro };
