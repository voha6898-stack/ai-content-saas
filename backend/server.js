require('dotenv').config();

// Suppress BullMQ "Redis version needs to be >= 5" errors (Redis 3.x on Windows)
const _origError = console.error.bind(console);
console.error = (...a) => {
  if (typeof a[0] === 'string' && a[0].includes('Redis version needs to be greater')) return;
  if (a[0] instanceof Error && a[0].message?.includes('Redis version needs to be greater')) return;
  _origError(...a);
};
const _origWarn = console.warn.bind(console);
console.warn = (...a) => {
  if (typeof a[0] === 'string' && a[0].includes('highly recommended to use a minimum Redis')) return;
  _origWarn(...a);
};
process.on('unhandledRejection', (reason) => {
  if (reason?.message?.includes('Redis version needs to be greater')) return;
  console.error('Unhandled Rejection:', reason);
});

const app       = require('./app');
const connectDB = require('./src/config/db');
const IORedis   = require('ioredis');
const { startScheduler } = require('./src/cron/scheduler');

const PORT = process.env.PORT || 5000;

async function startWorkersSafe() {
  const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    connectTimeout: 3000,
    lazyConnect: true,
  });
  try {
    await redis.connect();
    const info = await redis.info('server');
    const match = info.match(/redis_version:(\S+)/);
    const version = match ? match[1] : '0';
    const major = parseInt(version.split('.')[0], 10);
    await redis.quit();

    if (major >= 5) {
      require('./src/queue/workers/distribution.worker');
      require('./src/queue/workers/pipeline.worker');
      require('./src/queue/workers/automation.worker');
      console.log('✅ BullMQ workers started (Redis', version + ')');
    } else {
      console.warn(`⚠️  BullMQ workers tắt — Redis ${version} quá cũ (cần >= 5.0). Queue/Automation sẽ không hoạt động.`);
    }
  } catch {
    console.warn('⚠️  BullMQ workers tắt — Redis không kết nối được. Queue/Automation sẽ không hoạt động.');
    try { await redis.quit(); } catch {}
  }
}

connectDB().then(async () => {
  await startWorkersSafe();
  startScheduler();
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  });
});
