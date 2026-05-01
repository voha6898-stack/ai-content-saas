const { distributionQueue } = require('../queue/index');
const DistributionJob = require('../models/DistributionJob.model');
const Content         = require('../models/Content.model');

/**
 * Tạo và queue một distribution job
 * @param {string} userId
 * @param {string} contentId
 * @param {string} platform   - YouTube | TikTok | Facebook
 * @param {Date|null} scheduledAt - null = đăng ngay
 * @param {object} options    - { videoPath, imagePaths, privacy, ... }
 */
const schedulePost = async (userId, contentId, platform, scheduledAt = null, options = {}) => {
  // Kiểm tra content thuộc về user
  const content = await Content.findOne({ _id: contentId, userId });
  if (!content) {
    const err = new Error('Không tìm thấy nội dung');
    err.statusCode = 404;
    throw err;
  }

  // Tạo DB record
  const distJob = await DistributionJob.create({
    userId,
    contentId,
    platform,
    scheduledAt,
    options,
    status: 'queued',
  });

  // Tính delay (ms) nếu có lịch
  const delay = scheduledAt ? Math.max(0, new Date(scheduledAt) - Date.now()) : 0;

  // Thêm vào BullMQ
  const bullJob = await distributionQueue.add(
    `post-${platform}-${distJob._id}`,
    {
      distributionJobId: String(distJob._id),
      videoPath:  options.videoPath  || null,
      imagePaths: options.imagePaths || [],
    },
    { delay }
  );

  // Lưu BullMQ job ID để cancel sau này
  distJob.bullJobId = bullJob.id;
  await distJob.save();

  return distJob;
};

/**
 * Huỷ job đang chờ
 */
const cancelJob = async (userId, jobId) => {
  const distJob = await DistributionJob.findOne({ _id: jobId, userId });
  if (!distJob) {
    const err = new Error('Không tìm thấy job');
    err.statusCode = 404;
    throw err;
  }
  if (!['queued', 'pending'].includes(distJob.status)) {
    const err = new Error(`Không thể huỷ job đang ở trạng thái "${distJob.status}"`);
    err.statusCode = 400;
    throw err;
  }

  // Xoá khỏi BullMQ
  if (distJob.bullJobId) {
    try {
      const bullJob = await distributionQueue.getJob(distJob.bullJobId);
      await bullJob?.remove();
    } catch {}
  }

  distJob.status = 'cancelled';
  await distJob.save();
  return distJob;
};

/**
 * Lấy danh sách jobs của user
 */
const getJobs = async (userId, { status, platform, page = 1, limit = 20 } = {}) => {
  const query = { userId };
  if (status)   query.status   = status;
  if (platform) query.platform = platform;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    DistributionJob.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('contentId', 'topic platform output.title'),
    DistributionJob.countDocuments(query),
  ]);

  return {
    items,
    pagination: { total, page, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
  };
};

/**
 * Lấy chi tiết 1 job
 */
const getJobDetail = async (userId, jobId) => {
  const distJob = await DistributionJob.findOne({ _id: jobId, userId })
    .populate('contentId', 'topic platform output');
  if (!distJob) {
    const err = new Error('Không tìm thấy job');
    err.statusCode = 404;
    throw err;
  }
  return distJob;
};

/**
 * Dispatch ngay tất cả jobs đến hạn (dùng bởi cron)
 */
const dispatchDueJobs = async () => {
  const now = new Date();
  const dueJobs = await DistributionJob.find({
    status:      'pending',
    scheduledAt: { $lte: now },
  }).limit(50);

  for (const job of dueJobs) {
    const bullJob = await distributionQueue.add(
      `post-${job.platform}-${job._id}`,
      { distributionJobId: String(job._id) },
      { priority: 1 }
    );
    job.status    = 'queued';
    job.bullJobId = bullJob.id;
    await job.save();
  }

  return dueJobs.length;
};

module.exports = { schedulePost, cancelJob, getJobs, getJobDetail, dispatchDueJobs };
