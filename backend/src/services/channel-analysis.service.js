const { aiClient, aiModel, callGemini } = require('./ai.service');
const ChannelAnalysis = require('../models/ChannelAnalysis.model');
const User            = require('../models/User.model');

// ── ANALYTICA Agent ───────────────────────────────────────────────────────────

const ANALYTICA_SYSTEM = `You are ANALYTICA — Elite Channel Performance Intelligence Agent.

IDENTITY:
• Diagnosed 10,000+ channels across YouTube, TikTok, Facebook, Instagram
• You see what human consultants miss: algorithm blind spots, audience mismatch, compounding weaknesses
• You combine neuroscience, platform engineering, and competitive intelligence into one surgical diagnosis
• Your reports have helped channels go from 500 to 500,000 followers by fixing the RIGHT problems in the RIGHT order

━━━ DIAGNOSIS PHILOSOPHY ━━━
Most creators optimize the wrong things. You identify the REAL constraint — the one bottleneck that, once fixed, unlocks compounding growth. Not a laundry list of improvements. A ranked, ROI-weighted action plan.

━━━ PRE-ANALYSIS PROTOCOL ━━━
Before scoring, ANALYTICA performs:

◆ ALGORITHM GAP SCAN:
Map which platform signals the channel IS and IS NOT triggering.
YouTube: CTR × AVD% × Subscriber velocity × Session time
TikTok: Completion rate × Re-watch × Saves × Comment depth
Facebook: Comment thread depth × Share+comment × Emotional reactions × Time-on-post
Instagram: Save rate × DM shares × Comment threads × Profile visits

◆ AUDIENCE ALIGNMENT CHECK:
Is the content reaching the RIGHT people? Wrong audience → low retention → algorithm suppression spiral.

◆ CONTENT MOAT ASSESSMENT:
What is this channel's defensible angle? Could a competitor replicate it in 3 months? If yes, it's not a moat.

◆ COMPOUNDING WEAKNESS IDENTIFICATION:
Which problem, if left unfixed, makes all other improvements useless?

━━━ 8-DIMENSION SCORING FRAMEWORK ━━━
Each dimension scored 0-100 with specific grade:
90-100: Elite (Top 1%) | 75-89: Strong (Top 10%) | 60-74: Developing (Top 30%) | 45-59: Average | 0-44: Critical

1. Hook Effectiveness (weight: 20%) — First impression power, scroll-stop probability
2. Algorithm Alignment (weight: 20%) — Signals being triggered vs. platform requirements
3. Content Strategy Coherence (weight: 15%) — Clear pillars, consistent positioning, theme clarity
4. Audience Retention Architecture (weight: 15%) — Does content engineering keep people watching/reading?
5. Viral Coefficient (weight: 10%) — Share/save triggers embedded in content
6. Monetization Readiness (weight: 10%) — CPM potential, affiliate fit, product alignment
7. Competitive Positioning (weight: 5%) — Differentiation strength vs. niche competitors
8. Brand Consistency (weight: 5%) — Visual/voice/topic consistency across all content

WEIGHTED OVERALL SCORE = sum(dimension_score × weight)

━━━ QUALITY STANDARDS ━━━
• Every score must be justified with a specific observation — no vague "needs improvement"
• Every recommendation must be immediately actionable — specific enough to execute tomorrow
• Priority actions must be ranked by ROI, not by difficulty
• NEVER recommend doing everything at once — identify the 3 highest-leverage moves

Respond with valid JSON only. No markdown, no extra text.`;

const REWRITEX_SYSTEM = `You are REWRITEX — Channel Content Optimization & Rewrite Specialist.

IDENTITY:
• Specialist in transforming underperforming channels into algorithm-aligned, audience-obsessed machines
• You don't "improve" content — you RECONSTRUCT it from the ground up using the analysis findings
• Every word you rewrite is engineered for a specific signal: CTR, retention, saves, comments, or shares

━━━ REWRITE PHILOSOPHY ━━━
Bad content optimized is still bad content. REWRITEX starts from first principles:
1. What does the TARGET AUDIENCE need to feel/think/do at each touchpoint?
2. What does the ALGORITHM need to see to distribute this content?
3. What makes this content IMPOSSIBLE TO COPY by a competitor?

━━━ REWRITE PROTOCOL ━━━
Given the channel analysis, REWRITEX:
◆ Rewrites channel bio/description using the identified unique positioning
◆ Creates title templates that embed the channel's specific hook formula
◆ Engineers hook templates tuned to the channel's audience psychology profile
◆ Scripts CTAs that drive the specific micro-commitment this audience responds to
◆ Builds hashtag strategy optimized for the channel's current reach vs. target reach
◆ Reconstructs content pillars based on the identified algorithm gaps and audience needs

━━━ QUALITY GATE ━━━
Every rewrite must:
□ Fix at least one Critical or Average dimension identified in the analysis
□ Be immediately usable — no placeholders except [TOPIC/NICHE]
□ Sound like a human creator, not a marketing brief
□ Be platform-specific — TikTok bio ≠ YouTube description

Respond with valid JSON only. No markdown, no extra text.`;

// ── Prompt builders ───────────────────────────────────────────────────────────

const buildAnalysisPrompt = (data) => {
  const { platform, handle, niche, goal, mode, metrics, sampleContent } = data;

  const metricsBlock = (metrics.subscribers || metrics.avgViews || metrics.engagementRate || metrics.postFrequency)
    ? `\nCHANNEL METRICS:\n- Subscribers/Followers: ${metrics.subscribers || 'not provided'}\n- Average Views/Reach per post: ${metrics.avgViews || 'not provided'}\n- Engagement Rate: ${metrics.engagementRate || 'not provided'}\n- Posting Frequency: ${metrics.postFrequency || 'not provided'}`
    : '\nCHANNEL METRICS: Not provided — base analysis on niche benchmarks.';

  const contentBlock = sampleContent
    ? `\nSAMPLE CONTENT FOR ANALYSIS:\n${sampleContent}`
    : '\nSAMPLE CONTENT: Not provided — analyze based on niche patterns.';

  const depthBlock = mode === 'quick'
    ? 'MODE: QUICK SCAN — concise scores, top insight per dimension, 5 priority actions. Be direct and surgical.'
    : 'MODE: DEEP ANALYSIS — comprehensive diagnosis, specific examples, competitive context, full 30-day roadmap. Leave nothing unexamined.';

  return `${depthBlock}

CHANNEL TO ANALYZE:
- Platform: ${platform}
- Handle/Name: ${handle || 'Not specified'}
- Niche/Topic: ${niche}
- Primary Goal: ${goal}
${metricsBlock}
${contentBlock}

Execute the full Pre-Analysis Protocol, then return this exact JSON structure:

{
  "_reasoning": {
    "algorithmGapScan": "Which platform signals are being hit vs. missed — specific, not generic",
    "audienceAlignmentCheck": "Is content reaching right people? Signs of audience mismatch?",
    "contentMoatAssessment": "What is defensible? What can a competitor copy in 3 months?",
    "compoundingWeakness": "The ONE problem that makes all other improvements less effective"
  },
  "overallScore": 67,
  "overallGrade": "Developing",
  "overallInsight": "1-2 sentence diagnosis: what is this channel's fundamental situation and the highest-leverage opportunity",
  "dimensions": [
    {
      "name": "Hook Effectiveness",
      "score": 55,
      "grade": "Average",
      "weight": 20,
      "insight": "Specific observation about current hook quality with example if possible",
      "recommendation": "Specific actionable fix — can be executed tomorrow"
    },
    { "name": "Algorithm Alignment", "score": 0, "grade": "", "weight": 20, "insight": "", "recommendation": "" },
    { "name": "Content Strategy Coherence", "score": 0, "grade": "", "weight": 15, "insight": "", "recommendation": "" },
    { "name": "Audience Retention Architecture", "score": 0, "grade": "", "weight": 15, "insight": "", "recommendation": "" },
    { "name": "Viral Coefficient", "score": 0, "grade": "", "weight": 10, "insight": "", "recommendation": "" },
    { "name": "Monetization Readiness", "score": 0, "grade": "", "weight": 10, "insight": "", "recommendation": "" },
    { "name": "Competitive Positioning", "score": 0, "grade": "", "weight": 5, "insight": "", "recommendation": "" },
    { "name": "Brand Consistency", "score": 0, "grade": "", "weight": 5, "insight": "", "recommendation": "" }
  ],
  "strengths": [
    "Specific strength #1 with evidence",
    "Specific strength #2 with evidence",
    "Specific strength #3 with evidence"
  ],
  "weaknesses": [
    "Critical weakness #1 — why it matters algorithmically",
    "Critical weakness #2 — why it matters algorithmically",
    "Critical weakness #3 — why it matters algorithmically"
  ],
  "priorityActions": [
    {
      "rank": 1,
      "action": "Specific action — not a category, a concrete step",
      "impact": "High",
      "effort": "Low",
      "roi": "Why this action has the highest return for this specific channel",
      "timeline": "This week"
    }
  ],
  "thirtyDayRoadmap": [
    {
      "week": 1,
      "focus": "Week 1 theme",
      "actions": ["Specific action 1", "Specific action 2", "Specific action 3"],
      "successMetric": "How to know this week succeeded — specific measurable signal"
    },
    { "week": 2, "focus": "", "actions": [], "successMetric": "" },
    { "week": 3, "focus": "", "actions": [], "successMetric": "" },
    { "week": 4, "focus": "", "actions": [], "successMetric": "" }
  ],
  "competitorBenchmark": "How this channel compares to top 10% in ${niche} on ${platform} — specific gaps and opportunities"
}

RULES: All 8 dimensions must have real scores. priorityActions must have at least 5 items ranked by ROI. thirtyDayRoadmap only needed for deep mode — for quick mode return empty array.`;
};

const buildRewritePrompt = (data, analysis) => {
  const { platform, handle, niche, goal, sampleContent } = data;

  return `Completely rewrite and optimize all channel content based on this diagnosis.

CHANNEL CONTEXT:
- Platform: ${platform}
- Handle: ${handle || 'Not specified'}
- Niche: ${niche}
- Goal: ${goal}
- Overall Score: ${analysis.overallScore}/100 (${analysis.overallGrade})
- Core Issue: ${analysis._reasoning?.compoundingWeakness || 'See weaknesses'}
- Top Weaknesses: ${(analysis.weaknesses || []).slice(0, 3).join(' | ')}
- Top Priority Action: ${(analysis.priorityActions || [])[0]?.action || 'See recommendations'}

${sampleContent ? `ORIGINAL SAMPLE CONTENT TO REWRITE:\n${sampleContent}\n` : ''}

REWRITEX MISSION: Transform every content touchpoint. Fix the compounding weakness. Engineer for the specific algorithm signals this channel is missing.

Return this exact JSON:

{
  "_rewriteStrategy": "2-3 sentences: the core transformation approach — what is being fixed and why these rewrites address the compounding weakness",
  "channelBio": "Rewritten bio/about — platform-appropriate length. Identity-first, not description-first. Hook the right audience in line 1.",
  "channelDescription": "Full optimized channel description (150-300 words). SEO keywords embedded naturally. Value proposition crystal clear. Ideal viewer identified explicitly.",
  "titleTemplates": [
    {
      "template": "Fill-in-the-blank title formula using [TOPIC] or [SPECIFIC_ANGLE]",
      "psychTrigger": "Psychological mechanism: curiosity gap / loss aversion / social proof / FOMO / pattern interrupt",
      "example": "Applied to ${niche} — ready to use"
    }
  ],
  "hookTemplates": [
    {
      "hook": "Exact opening line template — first 5 seconds / first sentence",
      "mechanism": "Why this hook stops the scroll for ${platform} ${niche} audience",
      "variant": "Spoken (video) | Written (post) | Both"
    }
  ],
  "ctaScripts": [
    {
      "placement": "End of video | Mid-content | Caption | Comment reply",
      "script": "Exact CTA script — specific micro-commitment, not 'like and subscribe'",
      "goal": "What funnel step this drives: follow / save / comment / DM / click link"
    }
  ],
  "hashtagStrategy": {
    "tier1": ["5 broad hashtags (1M+ posts) for maximum reach"],
    "tier2": ["5 mid-tier hashtags (100K-1M posts) for targeted reach"],
    "tier3": ["5 niche hashtags (<100K posts) for community reach"],
    "branded": ["1-2 original branded hashtag concepts to own"]
  },
  "contentPillarsRewrite": [
    {
      "pillar": "Pillar name",
      "percentage": 35,
      "why": "Why this pillar for THIS channel's specific audience and algorithm gap",
      "formatExample": "Specific ready-to-execute content format",
      "algorithmSignal": "Which platform signal this pillar primarily drives"
    }
  ],
  "postingStrategy": {
    "frequency": "Specific recommended posting frequency with reasoning",
    "optimalTimes": "Best posting windows for ${platform} targeting this audience (timezone-aware)",
    "formatMix": "% breakdown of content formats (e.g., 60% short-form, 30% long-form, 10% live)",
    "firstWeekPlan": "Day-by-day content type sequence for Week 1 to maximize algorithm momentum"
  }
}

RULES: Minimum 10 titleTemplates, 8 hookTemplates, 5 ctaScripts. All content platform-specific. No generic advice — every recommendation must fix something identified in the analysis.`;
};

// ── AI callers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callGroqAnalysis = async (prompt, attempt = 1) => {
  try {
    const resp = await aiClient.chat.completions.create({
      model:           aiModel,
      messages: [
        { role: 'system', content: ANALYTICA_SYSTEM },
        { role: 'user',   content: prompt },
      ],
      temperature:     0.75,
      max_tokens:      3500,
      response_format: { type: 'json_object' },
    });
    return resp.choices[0].message.content;
  } catch (err) {
    const isTPD = (err.message || '').includes('tokens per day') || (err.message || '').includes('TPD:');
    const msg   = (err.message || '').toLowerCase();
    const is429 = (err.status || err?.response?.status || err?.httpStatus) === 429
      || msg.includes('[429') || msg.includes('429 too many') || msg.includes('resource_exhausted')
      || msg.includes('quota exceeded') || msg.includes('rate_limit') || msg.includes('too many requests');
    // TPD: skip retries, go straight to Gemini
    if (is429 && !isTPD && attempt <= 2) {
      await sleep(attempt * 8000);
      return callGroqAnalysis(prompt, attempt + 1);
    }
    console.warn(`⚠️  Groq analysis ${isTPD ? 'TPD' : 'exhausted'} — falling back to Gemini`);
    return callGemini(ANALYTICA_SYSTEM, prompt, 3500, 0.75);
  }
};

// ── Main functions ────────────────────────────────────────────────────────────

const analyzeChannel = async (userId, { platform, handle, niche, goal, mode, metrics, sampleContent }) => {
  const user = await User.findById(userId);
  if (user.plan === 'free' && user.credits <= 0) {
    const err = new Error('Bạn đã hết lượt dùng miễn phí. Nâng cấp lên Pro để tiếp tục.');
    err.statusCode = 403; throw err;
  }

  const prompt = buildAnalysisPrompt({ platform, handle, niche, goal, mode, metrics: metrics || {}, sampleContent: sampleContent || '' });

  let raw;
  if (mode === 'quick') {
    raw = await callGroqAnalysis(prompt);
  } else {
    raw = await callGemini(ANALYTICA_SYSTEM, prompt, 4500, 0.75);
  }

  let analysis;
  try { analysis = JSON.parse(raw); }
  catch { const e = new Error('AI trả về dữ liệu không hợp lệ, thử lại.'); e.statusCode = 502; throw e; }

  if (!analysis.overallScore || !Array.isArray(analysis.dimensions)) {
    const e = new Error('Phân tích không đầy đủ, thử lại.'); e.statusCode = 502; throw e;
  }

  // Normalize arrays
  if (!Array.isArray(analysis.strengths))      analysis.strengths      = [];
  if (!Array.isArray(analysis.weaknesses))     analysis.weaknesses     = [];
  if (!Array.isArray(analysis.priorityActions)) analysis.priorityActions = [];
  if (!Array.isArray(analysis.thirtyDayRoadmap)) analysis.thirtyDayRoadmap = [];

  const doc = await ChannelAnalysis.create({
    userId, platform, handle: handle || '', niche, goal, mode,
    metrics: metrics || {}, sampleContent: sampleContent || '',
    analysis, tokensUsed: 0,
  });

  if (user.plan === 'free') await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } });
  return doc;
};

const rewriteChannel = async (userId, docId) => {
  const doc = await ChannelAnalysis.findOne({ _id: docId, userId });
  if (!doc) { const e = new Error('Không tìm thấy phân tích.'); e.statusCode = 404; throw e; }
  if (!doc.analysis) { const e = new Error('Cần phân tích trước khi rewrite.'); e.statusCode = 400; throw e; }

  const user = await User.findById(userId);
  if (user.plan === 'free' && user.credits <= 0) {
    const err = new Error('Bạn đã hết lượt dùng miễn phí. Nâng cấp lên Pro để tiếp tục.');
    err.statusCode = 403; throw err;
  }

  const prompt = buildRewritePrompt(doc, doc.analysis);
  // Rewrite always uses Gemini — needs maximum creative depth
  const raw = await callGemini(REWRITEX_SYSTEM, prompt, 5000, 0.88);

  let rewrite;
  try { rewrite = JSON.parse(raw); }
  catch { const e = new Error('AI trả về dữ liệu không hợp lệ, thử lại.'); e.statusCode = 502; throw e; }

  doc.rewrite = rewrite;
  await doc.save();

  if (user.plan === 'free') await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } });
  return doc;
};

const getHistory = async (userId, page = 1, limit = 6) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ChannelAnalysis.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select('platform handle niche goal mode analysis.overallScore analysis.overallGrade rewrite createdAt'),
    ChannelAnalysis.countDocuments({ userId }),
  ]);
  return { items, pagination: { total, page, totalPages: Math.ceil(total / limit), hasNext: page * limit < total } };
};

const getOne = async (userId, docId) => {
  const doc = await ChannelAnalysis.findOne({ _id: docId, userId });
  if (!doc) { const e = new Error('Không tìm thấy.'); e.statusCode = 404; throw e; }
  return doc;
};

const deleteOne = async (userId, docId) => {
  const doc = await ChannelAnalysis.findOne({ _id: docId, userId });
  if (!doc) { const e = new Error('Không tìm thấy.'); e.statusCode = 404; throw e; }
  await doc.deleteOne();
};

module.exports = { analyzeChannel, rewriteChannel, getHistory, getOne, deleteOne };
