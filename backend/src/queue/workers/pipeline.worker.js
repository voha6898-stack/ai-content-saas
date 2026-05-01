const { Worker } = require('bullmq');
const { connection }    = require('../index');
const Pipeline          = require('../../models/Pipeline.model');
const PipelineItem      = require('../../models/PipelineItem.model');
const Content           = require('../../models/Content.model');
const { generateContent } = require('../../services/ai.service');

const PLATFORMS = ['YouTube', 'TikTok', 'Facebook', 'Instagram'];

const worker = new Worker(
  'pipeline',
  async (bullJob) => {
    const { pipelineId } = bullJob.data;

    const pipeline = await Pipeline.findById(pipelineId);
    if (!pipeline) throw new Error('Pipeline không tồn tại: ' + pipelineId);

    pipeline.status = 'running';
    await pipeline.save();

    // Lấy tất cả items pending của pipeline này
    const items = await PipelineItem.find({ pipelineId, status: 'pending' }).sort('orderIndex');

    let completed = 0;
    let failed    = 0;

    for (const item of items) {
      item.status = 'generating';
      await item.save();

      try {
        const { output, tokensUsed } = await generateContent(item.topic, item.platform);

        const content = await Content.create({
          userId:    item.userId,
          topic:     item.topic,
          platform:  item.platform,
          output,
          tokensUsed,
        });

        item.status    = 'completed';
        item.contentId = content._id;
        await item.save();
        completed++;

        // Update pipeline stats realtime
        await Pipeline.findByIdAndUpdate(pipelineId, {
          $inc: { 'stats.completed': 1 },
        });

        // Report progress về BullMQ
        await bullJob.updateProgress(Math.round((completed + failed) / items.length * 100));

        // Delay nhỏ để tránh rate limit OpenAI
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        item.status = 'failed';
        item.error  = err.message;
        await item.save();
        failed++;

        await Pipeline.findByIdAndUpdate(pipelineId, {
          $inc: { 'stats.failed': 1 },
        });
      }
    }

    // Cập nhật trạng thái pipeline
    const finalStatus = failed === items.length ? 'failed' : 'completed';
    await Pipeline.findByIdAndUpdate(pipelineId, { status: finalStatus });

    console.log(`✅ Pipeline ${pipelineId} done: ${completed} completed, ${failed} failed`);
    return { pipelineId, completed, failed };
  },
  {
    connection,
    concurrency: 1, // Pipeline chạy tuần tự để kiểm soát OpenAI rate limit
  }
);

worker.on('failed', async (bullJob, err) => {
  if (!bullJob?.data?.pipelineId) return;
  try {
    await Pipeline.findByIdAndUpdate(bullJob.data.pipelineId, { status: 'failed' });
  } catch {}
  console.error(`❌ Pipeline job failed [${bullJob.id}]:`, err.message);
});

console.log('🔄 Pipeline worker started');

module.exports = worker;
