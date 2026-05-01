const AutomationRule  = require('../models/AutomationRule.model');
const AutomationRun   = require('../models/AutomationRun.model');
const TrendItem       = require('../models/TrendItem.model');
const Content         = require('../models/Content.model');
const AffiliateLink   = require('../models/AffiliateLink.model');
const { fetchAllTrends }   = require('./trendFetcher.service');
const { analyzeAndSave }   = require('./trendAnalyzer.service');
const { generateContent }  = require('./ai.service');
const { schedulePost }     = require('./distribution.service');
const { detectNiche }      = require('./trendAnalyzer.service');

// ─────────────────────────────────────────────────────────────────────────────
// Chạy đầy đủ pipeline cho 1 automation rule
// Flow: fetch → analyze → generate → monetize → distribute
// ─────────────────────────────────────────────────────────────────────────────
const runAutomation = async (ruleId) => {
  const rule = await AutomationRule.findById(ruleId);
  if (!rule || !rule.isActive) return null;

  const run = await AutomationRun.create({
    userId:           rule.userId,
    automationRuleId: rule._id,
    status:           'running',
    startedAt:        new Date(),
  });

  const stepTimer = {};
  const log = (msg) => console.log(`[Automation ${ruleId}] ${msg}`);

  try {

    // ── STEP 1: FETCH TRENDS ────────────────────────────────────────────────
    await updateStep(run, 'fetchTrends', 'running');
    stepTimer.fetch = Date.now();
    log('Fetching trends...');

    const rawTrends = await fetchAllTrends(rule.trendSources);

    await updateStep(run, 'fetchTrends', 'done', { count: rawTrends.length, duration: Date.now() - stepTimer.fetch });
    log(`Fetched ${rawTrends.length} raw trends`);

    // ── STEP 2: ANALYZE & FILTER ────────────────────────────────────────────
    await updateStep(run, 'analyzeTrends', 'running');
    stepTimer.analyze = Date.now();

    const analyzed = await analyzeAndSave(rawTrends, {
      niches:   rule.niches,
      minScore: rule.minOverallScore,
    });

    // Sort by overall score, take top N
    const topTrends = analyzed
      .sort((a, b) => b.scores.overall - a.scores.overall)
      .slice(0, rule.maxTrendsPerRun);

    run.trendItemIds = topTrends.map((t) => t._id);
    await updateStep(run, 'analyzeTrends', 'done', {
      selected: topTrends.length,
      duration: Date.now() - stepTimer.analyze,
    });
    log(`Analyzed: ${topTrends.length} trends selected (min score: ${rule.minOverallScore})`);

    if (!topTrends.length) {
      run.status  = 'completed';
      run.endedAt = new Date();
      await run.save();
      await scheduleNextRun(rule);
      return run;
    }

    // ── STEP 3: GENERATE CONTENT ────────────────────────────────────────────
    await updateStep(run, 'generateContent', 'running');
    stepTimer.generate = Date.now();

    const contentIds = [];
    let genCreated = 0;
    let genFailed  = 0;

    for (const trend of topTrends) {
      // Chọn platforms theo rule + AI suggestion
      const suggestedPlatforms = trend.aiAnalysis?.bestPlatforms?.length
        ? rule.platforms.filter((p) => trend.aiAnalysis.bestPlatforms.includes(p))
        : rule.platforms;
      const targetPlatforms = suggestedPlatforms.length ? suggestedPlatforms : rule.platforms;
      const platformsToUse  = targetPlatforms.slice(0, rule.contentPerTrend);

      // Dùng content angle hay nhất từ AI làm topic
      const angle = trend.aiAnalysis?.contentAngles?.[0] || trend.keyword;
      const topic = `${trend.keyword} — ${angle}`.substring(0, 200);

      for (const platform of platformsToUse) {
        try {
          const { output, tokensUsed } = await generateContent(topic, platform);
          const content = await Content.create({
            userId:    rule.userId,
            topic,
            platform,
            output,
            tokensUsed,
          });
          contentIds.push(content._id);

          // Liên kết content với trend item
          await TrendItem.findByIdAndUpdate(trend._id, {
            $push: { generatedContentIds: content._id },
          });

          genCreated++;
          await new Promise((r) => setTimeout(r, 1200)); // Rate limit
        } catch (err) {
          log(`Generate failed [${platform}/${trend.keyword}]: ${err.message}`);
          genFailed++;
        }
      }
    }

    run.contentIds = contentIds;
    await updateStep(run, 'generateContent', 'done', {
      created:  genCreated,
      failed:   genFailed,
      duration: Date.now() - stepTimer.generate,
    });
    log(`Generated: ${genCreated} content (${genFailed} failed)`);

    // ── STEP 4: MONETIZE ────────────────────────────────────────────────────
    if (rule.autoMonetize && contentIds.length) {
      await updateStep(run, 'monetize', 'running');
      let linksAdded = 0;

      for (const contentId of contentIds) {
        try {
          const content = await Content.findById(contentId);
          if (!content) continue;

          const niche     = detectNiche(content.topic, content);
          const affLinks  = await AffiliateLink.find({ niche, isActive: true }).limit(1);

          if (affLinks.length) {
            // Append affiliate link vào caption
            const link = affLinks[0];
            const cta  = link.ctaTemplates?.[0] || `👉 Tham khảo thêm: ${link.url}`;
            content.output.caption = `${content.output.caption}\n\n${cta}`;
            await content.save();
            linksAdded++;
          }
        } catch {}
      }

      await updateStep(run, 'monetize', 'done', { linksAdded });
      log(`Monetized: ${linksAdded} content pieces with affiliate links`);
    } else {
      await updateStep(run, 'monetize', 'skipped');
    }

    // ── STEP 5: DISTRIBUTE ──────────────────────────────────────────────────
    const distributionJobIds = [];

    if (rule.autoDistribute && contentIds.length) {
      await updateStep(run, 'distribute', 'running');

      // Check daily post limit
      await resetDailyPostsIfNeeded(rule);
      const remaining = rule.maxDailyPosts - rule.postsToday;

      if (remaining <= 0) {
        await updateStep(run, 'distribute', 'skipped');
        log('Daily post limit reached, skipping distribution');
      } else {
        let queued = 0;
        const toPost = contentIds.slice(0, remaining);

        for (const contentId of toPost) {
          try {
            const content = await Content.findById(contentId);
            if (!content) continue;

            // Delay giữa các bài để tránh spam
            const delayMs = queued * rule.distributeDelay * 60 * 1000;
            const postAt  = delayMs > 0 ? new Date(Date.now() + delayMs) : null;

            // Chỉ post lên platform phù hợp với content
            const supportedPlatforms = ['YouTube', 'TikTok', 'Facebook'];
            if (!supportedPlatforms.includes(content.platform)) continue;

            const job = await schedulePost(
              String(rule.userId),
              String(contentId),
              content.platform,
              postAt,
              {}
            );

            distributionJobIds.push(job._id);

            // Liên kết job với trend item
            const trend = topTrends.find((t) =>
              t.generatedContentIds?.some((id) => String(id) === String(contentId))
            );
            if (trend) {
              await TrendItem.findByIdAndUpdate(trend._id, {
                $push: { distributionJobIds: job._id },
              });
            }

            queued++;
          } catch (err) {
            log(`Distribute failed [${contentId}]: ${err.message}`);
          }
        }

        run.distributionJobIds = distributionJobIds;
        await AutomationRule.findByIdAndUpdate(ruleId, { $inc: { postsToday: queued } });
        await updateStep(run, 'distribute', 'done', { queued });
        log(`Queued ${queued} distribution jobs`);
      }
    } else {
      await updateStep(run, 'distribute', 'skipped');
    }

    // ── DONE ────────────────────────────────────────────────────────────────
    run.status  = 'completed';
    run.endedAt = new Date();
    run.duration = run.endedAt - run.startedAt;
    await run.save();

    // Cập nhật stats của rule
    await AutomationRule.findByIdAndUpdate(ruleId, {
      $inc: {
        'stats.totalRuns':           1,
        'stats.totalTrendsFound':    topTrends.length,
        'stats.totalContentCreated': genCreated,
        'stats.totalPostsPublished': distributionJobIds.length,
      },
      lastRunAt: new Date(),
    });

    await scheduleNextRun(rule);
    log(`✅ Run completed in ${run.duration}ms`);
    return run;

  } catch (err) {
    run.status  = 'failed';
    run.error   = err.message;
    run.endedAt = new Date();
    run.duration = run.endedAt - run.startedAt;
    await run.save();
    await scheduleNextRun(rule);
    console.error(`[Automation ${ruleId}] ❌ Failed:`, err.message);
    throw err;
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const updateStep = async (run, stepKey, status, extra = {}) => {
  const update = { [`steps.${stepKey}.status`]: status };
  Object.entries(extra).forEach(([k, v]) => { update[`steps.${stepKey}.${k}`] = v; });
  Object.assign(run.steps[stepKey], { status, ...extra });
  await AutomationRun.findByIdAndUpdate(run._id, { $set: update });
};

const scheduleNextRun = async (rule) => {
  const nextRunAt = new Date(Date.now() + rule.runEveryHours * 3600 * 1000);
  await AutomationRule.findByIdAndUpdate(rule._id, { nextRunAt });
};

const resetDailyPostsIfNeeded = async (rule) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!rule.postsResetAt || rule.postsResetAt < today) {
    await AutomationRule.findByIdAndUpdate(rule._id, {
      postsToday:   0,
      postsResetAt: today,
    });
    rule.postsToday = 0;
  }
};

// ── CRUD operations ───────────────────────────────────────────────────────────

const createRule = async (userId, data) => {
  const rule = await AutomationRule.create({ userId, ...data });
  if (data.isActive) {
    await scheduleNextRun(rule);
  }
  return rule;
};

const updateRule = async (userId, ruleId, data) => {
  const rule = await AutomationRule.findOneAndUpdate(
    { _id: ruleId, userId },
    { ...data },
    { new: true }
  );
  if (!rule) {
    const err = new Error('Rule không tìm thấy');
    err.statusCode = 404;
    throw err;
  }
  if (data.isActive === true && !rule.nextRunAt) {
    await scheduleNextRun(rule);
  }
  return rule;
};

const getRules = async (userId) =>
  AutomationRule.find({ userId }).sort({ createdAt: -1 });

const getRuns = async (userId, ruleId, limit = 10) => {
  const query = { userId };
  if (ruleId) query.automationRuleId = ruleId;
  return AutomationRun.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-trendItemIds -contentIds -distributionJobIds');
};

const deleteRule = async (userId, ruleId) => {
  const rule = await AutomationRule.findOneAndDelete({ _id: ruleId, userId });
  if (!rule) {
    const err = new Error('Rule không tìm thấy');
    err.statusCode = 404;
    throw err;
  }
};

// Dispatch rules đến hạn (gọi từ cron)
const dispatchDueAutomations = async () => {
  const { automationQueue } = require('../queue/index');
  const now  = new Date();
  const rules = await AutomationRule.find({
    isActive:  true,
    $or: [
      { nextRunAt: { $lte: now } },
      { nextRunAt: null },
    ],
  });

  for (const rule of rules) {
    await automationQueue.add(`automation-${rule._id}`, { ruleId: String(rule._id) });
    await scheduleNextRun(rule); // Đặt lại ngay để tránh double-dispatch
    console.log(`🤖 Queued automation run for rule: ${rule.name}`);
  }
  return rules.length;
};

module.exports = {
  runAutomation, createRule, updateRule, getRules, getRuns, deleteRule,
  dispatchDueAutomations,
};
