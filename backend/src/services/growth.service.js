const { aiClient, aiModel } = require('./ai.service');
const GrowthPlan = require('../models/GrowthPlan.model');
const User       = require('../models/User.model');

// ── Build prompt ──────────────────────────────────────────────────────────────

const buildPrompt = (topic, platform, goal) => `
You are a world-class ${platform} Growth Strategist and AI Content Expert with 10+ years experience building viral channels from 0 to millions of followers.

Create a complete "30-Day Channel Growth Plan" for:
- Topic: ${topic}
- Platform: ${platform}
- Goal: ${goal}

CRITICAL RULES:
- Target audience: US viewers (English-speaking)
- NEVER be generic — every idea must be specific and immediately usable
- Every hook must trigger curiosity, controversy, or strong emotion
- All content must have viral potential
- Ideas must be controversial enough to spark debate in comments

Return ONLY valid JSON — no extra text, no markdown, no code blocks.

{
  "channelPositioning": {
    "description": "1-2 sentence channel description that's laser-focused and memorable",
    "targetAudience": "Specific demographic: age, interests, pain points, aspirations",
    "uniquePoint": "What makes this channel impossible to ignore vs competitors"
  },
  "contentPillars": [
    { "name": "Viral / Controversial", "percentage": 40, "description": "Content designed to spark debate and get shared" },
    { "name": "Storytelling / Personal", "percentage": 30, "description": "Behind-the-scenes, personal journeys, emotional arcs" },
    { "name": "High-Value / Educational", "percentage": 30, "description": "Actionable tips, tutorials, insider knowledge" }
  ],
  "thirtyDayPlan": [
    {
      "day": 1,
      "idea": "Specific, ready-to-film video idea with a clear angle",
      "hook": "Opening line that STOPS the scroll — shocking stat, bold claim, or provocative question",
      "format": "Short|Long|Story|Live|Collab",
      "cta": "Specific call-to-action (not just 'like and subscribe')"
    }
  ],
  "seoStrategy": {
    "keywords": ["10 specific high-volume, low-competition keywords for ${topic}"],
    "hashtags": ["10 hashtags mix: trending + niche + branded"],
    "titleTemplates": [
      "5 proven viral title formulas customized for ${topic}"
    ]
  },
  "viralFormula": {
    "hookTemplates": [
      "5 fill-in-the-blank hook templates that work for ${topic} on ${platform}"
    ],
    "contentTypes": [
      "3 specific content formats proven to go viral in the ${topic} niche"
    ]
  }
}

IMPORTANT for thirtyDayPlan: provide ALL 30 days. Each day must have a UNIQUE idea — no repetition. Vary formats across the 30 days. Mix viral bait, storytelling, and value days strategically.
`;

// ── AI call with retry ────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callAI = async (prompt, attempt = 1) => {
  try {
    return await aiClient.chat.completions.create({
      model:           aiModel,
      messages: [
        {
          role:    'system',
          content: 'You are an elite social media growth strategist. Always respond with valid JSON only. Be extremely specific, tactical, and US-market focused.',
        },
        { role: 'user', content: prompt },
      ],
      temperature:     0.85,
      max_tokens:      5000,
      response_format: { type: 'json_object' },
    });
  } catch (err) {
    const status = err.status || err.response?.status;
    if (status === 429 && attempt <= 3) {
      const wait = Math.pow(2, attempt) * 5000;
      console.warn(`⚠️  Growth AI 429 — retry ${attempt}/3 in ${wait / 1000}s`);
      await sleep(wait);
      return callAI(prompt, attempt + 1);
    }
    if (status === 429) {
      const e = new Error('AI đang bận, vui lòng thử lại sau 30 giây.');
      e.statusCode = 503;
      throw e;
    }
    throw err;
  }
};

// ── Main generate ─────────────────────────────────────────────────────────────

const generateGrowthPlan = async (userId, topic, platform, goal) => {
  const user = await User.findById(userId);
  if (user.plan === 'free' && user.credits <= 0) {
    const err = new Error('Bạn đã hết lượt dùng miễn phí. Nâng cấp lên Pro để tiếp tục.');
    err.statusCode = 403;
    throw err;
  }

  const prompt = buildPrompt(topic, platform, goal);
  const resp   = await callAI(prompt);
  const raw    = resp.choices[0].message.content;

  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    const err = new Error('AI trả về dữ liệu không hợp lệ, thử lại.');
    err.statusCode = 502;
    throw err;
  }

  // Ensure 30 days exist
  if (!Array.isArray(parsed.thirtyDayPlan) || parsed.thirtyDayPlan.length === 0) {
    const err = new Error('Kế hoạch không đầy đủ, thử lại.');
    err.statusCode = 502;
    throw err;
  }

  // Normalize arrays
  if (!Array.isArray(parsed.contentPillars))              parsed.contentPillars = [];
  if (!parsed.seoStrategy)                                parsed.seoStrategy    = {};
  if (!Array.isArray(parsed.seoStrategy.keywords))        parsed.seoStrategy.keywords       = [];
  if (!Array.isArray(parsed.seoStrategy.hashtags))        parsed.seoStrategy.hashtags       = [];
  if (!Array.isArray(parsed.seoStrategy.titleTemplates))  parsed.seoStrategy.titleTemplates = [];
  if (!parsed.viralFormula)                               parsed.viralFormula   = {};
  if (!Array.isArray(parsed.viralFormula.hookTemplates))  parsed.viralFormula.hookTemplates = [];
  if (!Array.isArray(parsed.viralFormula.contentTypes))   parsed.viralFormula.contentTypes  = [];

  const plan = await GrowthPlan.create({
    userId,
    topic,
    platform,
    goal,
    output:     parsed,
    tokensUsed: resp.usage?.total_tokens || 0,
  });

  if (user.plan === 'free') {
    await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } });
  }

  return plan;
};

const getHistory = async (userId, page = 1, limit = 6, platform = null) => {
  const skip  = (page - 1) * limit;
  const query = { userId };
  if (platform) query.platform = platform;
  const [items, total] = await Promise.all([
    GrowthPlan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-tokensUsed -output.thirtyDayPlan'),
    GrowthPlan.countDocuments(query),
  ]);
  return { items, pagination: { total, page, totalPages: Math.ceil(total / limit), hasNext: page * limit < total } };
};

const getOne = async (userId, planId) => {
  const plan = await GrowthPlan.findOne({ _id: planId, userId });
  if (!plan) {
    const err = new Error('Không tìm thấy kế hoạch');
    err.statusCode = 404;
    throw err;
  }
  return plan;
};

const deleteOne = async (userId, planId) => {
  const plan = await GrowthPlan.findOne({ _id: planId, userId });
  if (!plan) {
    const err = new Error('Không tìm thấy kế hoạch');
    err.statusCode = 404;
    throw err;
  }
  await plan.deleteOne();
};

module.exports = { generateGrowthPlan, getHistory, getOne, deleteOne };
