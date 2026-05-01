const cron = require('node-cron');
const { dispatchDueJobs }        = require('../services/distribution.service');
const { createDailySnapshot }    = require('../controllers/analytics.controller');
const { dispatchDueAutomations } = require('../services/automation.service');
const User = require('../models/User.model');

let started = false;

const startScheduler = () => {
  if (started) return;
  started = true;

  // ── 1. Dispatch scheduled posts — mỗi 5 phút ─────────────────────────────
  cron.schedule('*/5 * * * *', async () => {
    try {
      const count = await dispatchDueJobs();
      if (count > 0) console.log(`📤 Cron: dispatched ${count} due distribution job(s)`);
    } catch (err) {
      console.error('Cron dispatch error:', err.message);
    }
  });

  // ── 2. Daily analytics snapshot — 00:05 mỗi ngày ─────────────────────────
  cron.schedule('5 0 * * *', async () => {
    console.log('📊 Cron: generating daily analytics snapshots...');
    try {
      const users = await User.find({}).select('_id').lean();
      for (const user of users) {
        try {
          await createDailySnapshot(String(user._id));
        } catch {}
      }
      console.log(`✅ Snapshots created for ${users.length} users`);
    } catch (err) {
      console.error('Cron snapshot error:', err.message);
    }
  });

  // ── 3. Plan expiry check — 01:00 mỗi ngày ────────────────────────────────
  cron.schedule('0 1 * * *', async () => {
    try {
      const expired = await User.updateMany(
        { plan: 'pro', planExpiresAt: { $lt: new Date() } },
        { plan: 'free', planExpiresAt: null, credits: parseInt(process.env.FREE_CREDITS) || 10 }
      );
      if (expired.modifiedCount > 0) {
        console.log(`⬇️  Cron: ${expired.modifiedCount} Pro plan(s) expired → downgraded to free`);
      }
    } catch (err) {
      console.error('Cron plan expiry error:', err.message);
    }
  });

  // ── 4. Dispatch automation rules — mỗi 30 phút ──────────────────────────
  cron.schedule('*/30 * * * *', async () => {
    try {
      const count = await dispatchDueAutomations();
      if (count > 0) console.log(`🤖 Cron: dispatched ${count} automation run(s)`);
    } catch (err) {
      console.error('Cron automation error:', err.message);
    }
  });

  console.log('✅ Cron scheduler started (dispatch/5min, automation/30min, snapshot/day, expiry/day)');
};

module.exports = { startScheduler };
