const { Worker } = require('bullmq');
const { connection } = require('../index');
const DistributionJob = require('../../models/DistributionJob.model');
const PostedContent   = require('../../models/PostedContent.model');
const Content         = require('../../models/Content.model');
const ytService       = require('../../services/distribution/youtube.service');
const tkService       = require('../../services/distribution/tiktok.service');
const fbService       = require('../../services/distribution/facebook.service');

const PLATFORM_HANDLER = {
  YouTube:  async (job) => ytService.postVideo(job),
  TikTok:   async (job) => tkService.postVideo(job),
  Facebook: async (job) => fbService.postText(job),
};

const worker = new Worker(
  'distribution',
  async (bullJob) => {
    const { distributionJobId } = bullJob.data;

    // Lấy job từ DB
    const distJob = await DistributionJob.findById(distributionJobId);
    if (!distJob) throw new Error('DistributionJob không tồn tại: ' + distributionJobId);
    if (distJob.status === 'cancelled') return { skipped: true };

    // Đánh dấu đang xử lý
    distJob.status   = 'processing';
    distJob.attempts += 1;
    await distJob.save();

    // Lấy content
    const content = await Content.findById(distJob.contentId);
    if (!content) throw new Error('Content không tồn tại');

    // Gọi platform handler
    const handler = PLATFORM_HANDLER[distJob.platform];
    if (!handler) throw new Error('Platform không hỗ trợ: ' + distJob.platform);

    const jobPayload = {
      content,
      videoPath: bullJob.data.videoPath  || null,
      imagePaths: bullJob.data.imagePaths || [],
      options:   distJob.options,
    };

    const { postId, postUrl } = await handler(jobPayload);

    // Cập nhật kết quả vào DB
    distJob.status          = 'completed';
    distJob.result.postId   = postId;
    distJob.result.postUrl  = postUrl;
    distJob.result.postedAt = new Date();
    distJob.error           = null;
    await distJob.save();

    // Lưu PostedContent để track analytics
    await PostedContent.create({
      userId:            distJob.userId,
      contentId:         distJob.contentId,
      distributionJobId: distJob._id,
      platform:          distJob.platform,
      postId,
      postUrl,
      title:             content.output.title,
      postedAt:          new Date(),
    });

    console.log(`✅ Posted to ${distJob.platform}: ${postUrl}`);
    return { postId, postUrl };
  },
  {
    connection,
    concurrency: 2, // Xử lý tối đa 2 jobs song song
  }
);

worker.on('failed', async (bullJob, err) => {
  if (!bullJob?.data?.distributionJobId) return;
  try {
    await DistributionJob.findByIdAndUpdate(bullJob.data.distributionJobId, {
      status: 'failed',
      error:  err.message,
    });
  } catch {}
  console.error(`❌ Distribution job failed [${bullJob.id}]:`, err.message);
});

console.log('🔄 Distribution worker started');

module.exports = worker;
