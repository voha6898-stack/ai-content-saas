const User = require('../models/User.model');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('email');
    const adminEmail = process.env.ADMIN_EMAIL || '';

    if (!adminEmail || user.email !== adminEmail) {
      return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền truy cập.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAdmin };
