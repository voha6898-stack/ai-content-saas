const { Worker }       = require('bullmq');
const { connection }   = require('../index');
const { runAutomation } = require('../../services/automation.service');

const worker = new Worker(
  'automation',
  async (bullJob) => {
    const { ruleId } = bullJob.data;
    console.log(`🤖 Starting automation run for rule: ${ruleId}`);

    await bullJob.updateProgress(5);
    const run = await runAutomation(ruleId);
    await bullJob.updateProgress(100);

    return {
      runId:     String(run._id),
      status:    run.status,
      duration:  run.duration,
      generated: run.contentIds?.length || 0,
      posted:    run.distributionJobIds?.length || 0,
    };
  },
  {
    connection,
    concurrency: 1, // Chỉ 1 automation chạy cùng lúc (bảo vệ OpenAI rate limit)
    lockDuration: 10 * 60 * 1000, // 10 phút lock (automation có thể chạy lâu)
  }
);

worker.on('failed', (bullJob, err) => {
  console.error(`❌ Automation worker failed [${bullJob?.id}]:`, err.message);
});

worker.on('completed', (bullJob, result) => {
  console.log(`✅ Automation worker completed [${bullJob.id}]:`, result);
});

console.log('🤖 Automation worker started');
module.exports = worker;
