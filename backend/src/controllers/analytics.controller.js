const Content             = require('../models/Content.model');
const DistributionJob     = require('../models/DistributionJob.model');
const PostedContent       = require('../models/PostedContent.model');
const Pipeline            = require('../models/Pipeline.model');
const AnalyticsSnapshot   = require('../models/AnalyticsSnapshot.model');

/**
 * Dashboard overview — tổng hợp số liệu chính
 */
const getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      totalContent,
      totalPosted,
      totalPipelines,
      platformBreakdown,
      distributionBreakdown,
      recentActivity,
      last30Snapshots,
    ] = await Promise.all([
      Content.countDocuments({ userId }),

      PostedContent.countDocuments({ userId }),

      Pipeline.countDocuments({ userId }),

      // Content theo platform
      Content.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
      ]),

      // Posts theo platform
      PostedContent.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
      ]),

      // 10 nội dung gần nhất
      Content.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('topic platform output.title createdAt'),

      // 30 ngày gần nhất từ snapshots
      AnalyticsSnapshot.find({ userId })
        .sort({ date: -1 })
        .limit(30)
        .select('date contentGenerated postsDistributed totalViews totalLikes'),
    ]);

    // Format platform breakdown
    const contentByPlatform = {};
    platformBreakdown.forEach(({ _id, count }) => { contentByPlatform[_id] = count; });

    const postedByPlatform = {};
    distributionBreakdown.forEach(({ _id, count }) => { postedByPlatform[_id] = count; });

    // Jobs stats
    const jobStats = await DistributionJob.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const jobsByStatus = {};
    jobStats.forEach(({ _id, count }) => { jobsByStatus[_id] = count; });

    res.json({
      success: true,
      overview: {
        totalContent,
        totalPosted,
        totalPipelines,
        contentByPlatform,
        postedByPlatform,
        jobsByStatus,
      },
      recentActivity,
      chartData: last30Snapshots.reverse(), // Oldest first cho chart
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo snapshot analytics cho ngày hôm nay
 * (gọi bởi cron job, không expose qua API)
 */
const createDailySnapshot = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const [contentStats, postStats, pipelines, postedStats] = await Promise.all([
    Content.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId.createFromHexString(String(userId)),
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: '$platform', count: { $sum: 1 }, tokens: { $sum: '$tokensUsed' } } },
    ]),
    DistributionJob.countDocuments({
      userId, status: 'completed',
      'result.postedAt': { $gte: today, $lt: tomorrow },
    }),
    Pipeline.countDocuments({
      userId,
      updatedAt: { $gte: today, $lt: tomorrow },
      status: 'completed',
    }),
    PostedContent.aggregate([
      {
        $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(String(userId)) },
      },
      {
        $group: {
          _id: null,
          totalViews:    { $sum: '$analytics.views' },
          totalLikes:    { $sum: '$analytics.likes' },
          totalComments: { $sum: '$analytics.comments' },
        },
      },
    ]),
  ]);

  const contentGenerated = { total: 0, YouTube: 0, TikTok: 0, Facebook: 0, Instagram: 0 };
  let tokensUsed = 0;
  contentStats.forEach(({ _id, count, tokens }) => {
    contentGenerated[_id] = count;
    contentGenerated.total += count;
    tokensUsed += tokens;
  });

  const engagement = postedStats[0] || { totalViews: 0, totalLikes: 0, totalComments: 0 };

  await AnalyticsSnapshot.findOneAndUpdate(
    { userId, date: today },
    {
      contentGenerated,
      postsDistributed: { total: postStats },
      pipelinesRun: pipelines,
      tokensUsed,
      totalViews:    engagement.totalViews,
      totalLikes:    engagement.totalLikes,
      totalComments: engagement.totalComments,
    },
    { upsert: true, new: true }
  );
};

module.exports = { getOverview, createDailySnapshot };
