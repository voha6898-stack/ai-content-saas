const Content = require('../models/Content.model');

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT) || 3;

// Giới hạn số lần generate mỗi ngày cho free users
const checkDailyLimit = async (req, res, next) => {
  try {
    if (req.user.plan === 'pro') return next();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await Content.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: startOfDay },
    });

    if (todayCount >= FREE_DAILY_LIMIT) {
      const resetAt = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      return res.status(429).json({
        success: false,
        message: `Bạn đã dùng hết ${FREE_DAILY_LIMIT} lượt miễn phí hôm nay. Nâng cấp Pro để dùng không giới hạn.`,
        code: 'DAILY_LIMIT_EXCEEDED',
        limit: FREE_DAILY_LIMIT,
        used: todayCount,
        resetAt,
      });
    }

    // Truyền xuống controller để đính kèm vào response
    req.todayCount = todayCount;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkDailyLimit };
