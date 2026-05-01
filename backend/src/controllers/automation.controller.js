const automationService = require('../services/automation.service');
const TrendItem         = require('../models/TrendItem.model');
const { automationQueue } = require('../queue/index');

// ── Automation Rules ──────────────────────────────────────────────────────────

const createRule = async (req, res, next) => {
  try {
    const rule = await automationService.createRule(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Đã tạo automation rule', rule });
  } catch (err) { next(err); }
};

const getRules = async (req, res, next) => {
  try {
    const rules = await automationService.getRules(req.user.id);
    res.json({ success: true, rules });
  } catch (err) { next(err); }
};

const updateRule = async (req, res, next) => {
  try {
    const rule = await automationService.updateRule(req.user.id, req.params.id, req.body);
    res.json({ success: true, message: 'Đã cập nhật rule', rule });
  } catch (err) { next(err); }
};

const deleteRule = async (req, res, next) => {
  try {
    await automationService.deleteRule(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xoá rule' });
  } catch (err) { next(err); }
};

// Chạy thủ công ngay lập tức
const triggerRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bullJob = await automationQueue.add(
      `manual-${id}`,
      { ruleId: id },
      { priority: 1 }
    );
    res.json({ success: true, message: 'Automation đang chạy...', bullJobId: bullJob.id });
  } catch (err) { next(err); }
};

// Lịch sử runs
const getRuns = async (req, res, next) => {
  try {
    const { ruleId } = req.query;
    const runs = await automationService.getRuns(req.user.id, ruleId, 20);
    res.json({ success: true, runs });
  } catch (err) { next(err); }
};

// ── Trends ───────────────────────────────────────────────────────────────────

const getTrends = async (req, res, next) => {
  try {
    const { niche, source, minScore = 0, limit = 30 } = req.query;

    const query = { 'scores.overall': { $gte: parseInt(minScore) } };
    if (niche)  query.niche  = niche;
    if (source) query.source = source;

    const trends = await TrendItem.find(query)
      .sort({ 'scores.overall': -1, fetchedAt: -1 })
      .limit(parseInt(limit))
      .select('-rawData');

    res.json({ success: true, trends, total: trends.length });
  } catch (err) { next(err); }
};

// Fetch trends thủ công (không qua automation rule)
const fetchTrendsNow = async (req, res, next) => {
  try {
    const { sources = ['google_trends', 'youtube_trending', 'rss_vnexpress'], niches = [], minScore = 40 } = req.body;

    const { fetchAllTrends }  = require('../services/trendFetcher.service');
    const { analyzeAndSave }  = require('../services/trendAnalyzer.service');

    const raw      = await fetchAllTrends(sources);
    const analyzed = await analyzeAndSave(raw, { niches, minScore });

    res.json({
      success: true,
      message: `Đã phân tích ${raw.length} xu hướng → ${analyzed.length} đạt tiêu chuẩn`,
      trends:  analyzed.sort((a, b) => b.scores.overall - a.scores.overall).slice(0, 20),
    });
  } catch (err) { next(err); }
};

module.exports = {
  createRule, getRules, updateRule, deleteRule, triggerRun, getRuns,
  getTrends, fetchTrendsNow,
};
