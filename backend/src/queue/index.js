const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');

// Redis connection — dùng chung cho tất cả queues
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times === 1) console.warn('⚠️  Redis không kết nối được — queue/worker tạm dừng. Cài Redis để dùng Automation & Pipeline.');
    return Math.min(times * 2000, 30000); // retry mỗi 2s → 30s tối đa, không spam log
  },
});

let _redisErrorLogged = false;
connection.on('error', (err) => {
  if (!_redisErrorLogged) {
    _redisErrorLogged = true;
    console.warn('⚠️  Redis error (chỉ hiển thị lần đầu):', err.code || err.message);
  }
});

connection.on('connect', () => {
  _redisErrorLogged = false;
  console.log('✅ Redis connected');
});

// ── Queue instances ───────────────────────────────────────────
const distributionQueue = new Queue('distribution', {
  connection,
  defaultJobOptions: {
    attempts:    3,
    backoff:     { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 }, // Giữ 100 completed jobs gần nhất
    removeOnFail:    { count: 200 },
  },
});

const pipelineQueue = new Queue('pipeline', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff:  { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail:    { count: 100 },
  },
});

// ── Queue Events (logging) ────────────────────────────────────
const distributionEvents = new QueueEvents('distribution', { connection });
distributionEvents.on('completed', ({ jobId }) =>
  console.log(`📤 Distribution job ${jobId} completed`)
);
distributionEvents.on('failed', ({ jobId, failedReason }) =>
  console.error(`❌ Distribution job ${jobId} failed:`, failedReason)
);

const automationQueue = new Queue('automation', {
  connection,
  defaultJobOptions: {
    attempts: 1,              // Automation không retry tự động
    removeOnComplete: { count: 50 },
    removeOnFail:    { count: 50 },
  },
});

module.exports = { distributionQueue, pipelineQueue, automationQueue, connection };
