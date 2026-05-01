const Content = require('../models/Content.model');
const User    = require('../models/User.model');
const { generateContent } = require('./ai.service');

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT) || 3;

const generate = async (userId, topic, platform, todayCount = 0) => {
  const user = await User.findById(userId);

  if (user.plan === 'free' && user.credits <= 0) {
    const err = new Error('Bạn đã hết lượt dùng miễn phí. Nâng cấp lên Pro để tiếp tục.');
    err.statusCode = 403;
    throw err;
  }

  const { output, tokensUsed } = await generateContent(topic, platform);

  const content = await Content.create({ userId, topic, platform, output, tokensUsed });

  if (user.plan === 'free') {
    await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } });
  }

  // Tính daily usage để trả về frontend
  const newTodayCount = todayCount + 1;
  const usage = user.plan === 'free'
    ? { todayCount: newTodayCount, dailyLimit: FREE_DAILY_LIMIT, remaining: Math.max(0, FREE_DAILY_LIMIT - newTodayCount) }
    : null;

  return { content, usage };
};

const getHistory = async (userId, page = 1, limit = 10, platform = null, favoritesOnly = false) => {
  const skip = (page - 1) * limit;

  const query = { userId };
  if (platform) query.platform = platform;
  if (favoritesOnly) query.isFavorite = true;

  const [items, total] = await Promise.all([
    Content.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-tokensUsed'),
    Content.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
    },
  };
};

const deleteOne = async (userId, contentId) => {
  const content = await Content.findOne({ _id: contentId, userId });
  if (!content) {
    const err = new Error('Không tìm thấy nội dung');
    err.statusCode = 404;
    throw err;
  }
  await content.deleteOne();
};

const toggleFavorite = async (userId, contentId) => {
  const content = await Content.findOne({ _id: contentId, userId });
  if (!content) {
    const err = new Error('Không tìm thấy nội dung');
    err.statusCode = 404;
    throw err;
  }
  content.isFavorite = !content.isFavorite;
  await content.save();
  return { isFavorite: content.isFavorite };
};

module.exports = { generate, getHistory, deleteOne, toggleFavorite };
