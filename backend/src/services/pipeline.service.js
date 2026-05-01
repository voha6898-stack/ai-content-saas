const { pipelineQueue }  = require('../queue/index');
const Pipeline           = require('../models/Pipeline.model');
const PipelineItem       = require('../models/PipelineItem.model');

const PLATFORMS = ['YouTube', 'TikTok', 'Facebook', 'Instagram'];

/**
 * Tạo pipeline mới và queue job
 */
const createPipeline = async (userId, { name, niche, platform, topics, autoDistribute, distributeAt }) => {
  if (!topics?.length) {
    const err = new Error('Danh sách topics không được để trống');
    err.statusCode = 400;
    throw err;
  }

  // Xác định platforms cần generate
  const targetPlatforms = platform === 'all' ? PLATFORMS : [platform];

  const pipeline = await Pipeline.create({
    userId,
    name,
    niche,
    platform,
    topics,
    autoDistribute: autoDistribute || false,
    distributeAt:   distributeAt   || null,
    stats: { total: topics.length * targetPlatforms.length, completed: 0, failed: 0 },
  });

  // Tạo PipelineItems cho từng topic × platform
  const items = [];
  let order = 0;
  for (const topic of topics) {
    for (const plt of targetPlatforms) {
      items.push({
        pipelineId:  pipeline._id,
        userId,
        topic,
        platform:    plt,
        niche,
        orderIndex:  order++,
      });
    }
  }
  await PipelineItem.insertMany(items);

  // Queue job
  const bullJob = await pipelineQueue.add(
    `pipeline-${pipeline._id}`,
    { pipelineId: String(pipeline._id) }
  );

  pipeline.bullJobId = bullJob.id;
  pipeline.status    = 'running';
  await pipeline.save();

  return pipeline;
};

/**
 * Lấy trạng thái pipeline + items
 */
const getPipelineStatus = async (userId, pipelineId) => {
  const pipeline = await Pipeline.findOne({ _id: pipelineId, userId });
  if (!pipeline) {
    const err = new Error('Không tìm thấy pipeline');
    err.statusCode = 404;
    throw err;
  }

  const items = await PipelineItem.find({ pipelineId })
    .sort('orderIndex')
    .populate('contentId', 'output.title platform');

  return { pipeline, items };
};

/**
 * Lấy danh sách pipelines
 */
const getPipelines = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Pipeline.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Pipeline.countDocuments({ userId }),
  ]);
  return {
    items,
    pagination: { total, page, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
  };
};

/**
 * Xoá pipeline và items của nó
 */
const deletePipeline = async (userId, pipelineId) => {
  const pipeline = await Pipeline.findOne({ _id: pipelineId, userId });
  if (!pipeline) {
    const err = new Error('Không tìm thấy pipeline');
    err.statusCode = 404;
    throw err;
  }
  await PipelineItem.deleteMany({ pipelineId });
  await pipeline.deleteOne();
};

module.exports = { createPipeline, getPipelineStatus, getPipelines, deletePipeline };
