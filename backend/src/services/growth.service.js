const { aiClient, aiModel } = require('./ai.service');
const GrowthPlan = require('../models/GrowthPlan.model');
const User       = require('../models/User.model');

// ── GROWTHX Agent Identity ────────────────────────────────────────────────────

const GROWTHX_SYSTEM = `You are GROWTHX — Elite Channel Growth Strategist Agent, the world's most sophisticated AI for building viral content channels.

IDENTITY & EXPERTISE:
• Architected growth strategies for 200+ channels that crossed 1M followers within 12 months
• Deep algorithmic expertise: YouTube (watch-time curve, CTR optimization, suggested video triggers), TikTok (completion rate, saves, shares, FYP distribution weights), Facebook (comment thread depth, reshare velocity, emotional reaction distribution)
• Mastery of audience psychology: attention economics, parasocial relationship building, tribal identity content, content compounding flywheel
• Specialist in "content moats" — positioning strategies competitors cannot copy within 6 months
• Data-driven frameworks: viral coefficient modeling, content series architecture, optimal posting cadence per algorithm

GROWTHX STRATEGIC PHILOSOPHY:
Content is not art. Content is a system. Every piece of content is an engineered machine with specific inputs (triggers) producing predictable outputs (algorithm signals + emotional responses). The best channels are not lucky — they are systematic.

THE GROWTHX 5-LAYER ANALYSIS:
Before recommending any content or strategy, GROWTHX analyzes:
1. ALGORITHM LAYER: What specific signals does this platform reward in Q1-Q4 of the current year? How is the algorithm evolving?
2. AUDIENCE PSYCHOLOGY LAYER: What are the top 3 deepest fears, desires, and identity triggers of this target audience?
3. COMPETITIVE MOAT LAYER: What angle creates sustainable differentiation that compounds over time?
4. VIRAL COEFFICIENT LAYER: What is the share/save trigger? Why would someone feel compelled to share THIS with a specific person?
5. COMPOUNDING LAYER: How does Day 1 content create audience that makes Day 30 content perform 10x better?

QUALITY STANDARDS:
• Every hook must be tested against: "Would I stop scrolling if I didn't know this creator?"
• Every idea must pass: "Is this specific enough that a competitor cannot copy it without 6 months of work?"
• Every CTA must be: a specific action that moves the audience ONE STEP deeper into the content funnel
• Every SEO keyword must have: realistic monthly search volume estimate + competition level assessment
• NEVER output generic advice. "Post consistently" is useless. "Post at 7PM EST Tuesday/Thursday (peak commute+dinner)" is actionable.

Always respond with valid JSON only. No markdown, no extra text outside JSON.`;

// ── Build prompt ──────────────────────────────────────────────────────────────

const buildPrompt = (topic, platform, goal) => `
Create a complete, battle-tested "30-Day Channel Growth Blueprint" for:
- Topic/Niche: ${topic}
- Platform: ${platform}
- Primary Goal: ${goal}

TARGET MARKET: US English-speaking audience (primary), with crossover appeal to international English speakers.

GROWTHX MISSION:
This is not a content calendar. This is a GROWTH SYSTEM. Every element must connect to the next. Day 1 plants seeds that Day 30 harvests. The 30-day plan should build a content MOAT — not just 30 disconnected videos.

MANDATORY SPECIFICITY RULES:
• All hooks: specific enough to film TODAY without brainstorming
• All ideas: include the exact angle/controversy/insight that makes it shareable
• SEO keywords: must include realistic CPC and competition level estimate
• All CTAs: specific micro-commitment (not "like and subscribe" — that's dead)
• Viral probability: rate each day's content 1-10 on viral likelihood with brief reasoning
• Format recommendations must specify: duration, ratio (9:16/16:9/1:1), and editing style

PLATFORM-SPECIFIC ALGORITHM INTELLIGENCE:
${platform === 'YouTube' ? `YouTube 2024 signals (in priority order):
1. Click-through rate on impressions (thumbnail + title = 70% of success)
2. Average view duration percentage (>50% = strong signal)
3. Viewer satisfaction score (like/dislike ratio + comment sentiment)
4. Subscriber velocity (new subs per view)
5. Re-watch rate on key segments
Engineering note: YouTube rewards "session starters" — content that keeps viewers on YouTube after your video ends.` : ''}
${platform === 'TikTok' ? `TikTok 2024 signals (in priority order):
1. Completion rate (watch full video = strongest signal)
2. Re-watch rate (replays trigger massive FYP boost)
3. Save rate (saves = highest-value engagement signal)
4. Comment rate and comment sentiment
5. Share rate (especially off-platform shares)
Engineering note: TikTok distributes to non-followers first. Content must PROVE value to strangers in 2 seconds.` : ''}
${platform === 'Facebook' ? `Facebook 2024 signals (in priority order):
1. Comment thread depth (replies to replies = maximum distribution)
2. Emotional reactions (Love, Haha, Wow > Like for distribution)
3. Share with comment (much stronger than silent share)
4. Time-on-post (how long before scrolling away)
5. Negative feedback rate (hide/report = severe distribution penalty)
Engineering note: Facebook rewards content that creates community discussion, not one-directional broadcasting.` : ''}
${platform === 'Instagram' ? `Instagram 2024 signals (in priority order):
1. Saves rate (saves = top signal for Explore page)
2. Shares to Stories/DMs
3. Comments (especially questions + conversation threads)
4. Reach rate vs follower count
5. Profile visits after seeing content
Engineering note: Instagram Reels are cross-distributed to non-followers. Carousel posts get highest saves.` : ''}

Return ONLY valid JSON — no extra text, no markdown:

{
  "channelPositioning": {
    "description": "2-sentence channel description: WHO this channel is for + WHAT unique transformation/value it delivers. Laser-focused, memorable, differentiating.",
    "targetAudience": {
      "demographics": "Specific age range, gender split estimate, income level, location concentration",
      "psychographics": "Top 3 deep desires, top 2 deepest fears, tribal identity they want to belong to",
      "contentHabits": "Where they currently consume content, what they're frustrated with in existing content"
    },
    "uniquePoint": "The ONE thing this channel does that no existing top-10 creator in this niche does. Must be copyable by audience but NOT by competitors.",
    "contentMoat": "The compounding advantage that makes this channel harder to replicate after 6 months of execution"
  },
  "contentPillars": [
    {
      "name": "Viral / Controversy Engine",
      "percentage": 35,
      "description": "Content designed to spark debate, challenge common beliefs, or reveal uncomfortable truths. Drives shares and comments.",
      "exampleFormat": "Specific content format example for this pillar in the ${topic} niche"
    },
    {
      "name": "Deep Value / Authority",
      "percentage": 35,
      "description": "High-density value content that establishes expertise. Drives saves, subscribes, and trust.",
      "exampleFormat": "Specific content format example for this pillar in the ${topic} niche"
    },
    {
      "name": "Storytelling / Human Connection",
      "percentage": 30,
      "description": "Personal stories, behind-the-scenes, emotional journeys. Drives parasocial bonding and long-term retention.",
      "exampleFormat": "Specific content format example for this pillar in the ${topic} niche"
    }
  ],
  "thirtyDayPlan": [
    {
      "day": 1,
      "pillar": "Viral / Controversy Engine",
      "idea": "Specific, ready-to-film video idea with the exact angle and POV — no brainstorming needed",
      "hook": "Exact opening line that STOPS the scroll — shocking stat, bold claim, or counterintuitive truth. Must be quotable.",
      "format": "Short-Form (60s) | Long-Form (10min) | Story | Live | Carousel",
      "duration": "Specific duration in minutes:seconds",
      "cta": "One specific micro-commitment action (not 'like and subscribe')",
      "viralProbability": 8,
      "viralReasoning": "Why this specific content has high viral potential in the ${topic} niche"
    }
  ],
  "seoStrategy": {
    "keywords": [
      {
        "keyword": "specific keyword phrase",
        "searchVolume": "estimated monthly searches (e.g., 50K-100K)",
        "competition": "Low | Medium | High",
        "contentAngle": "How to use this keyword as the core of a specific video idea"
      }
    ],
    "hashtags": {
      "trending": ["5 currently trending hashtags in this niche"],
      "niche": ["3 specific niche hashtags with moderate competition"],
      "branded": ["2 branded hashtag concepts to own"]
    },
    "titleTemplates": [
      "5 proven title formulas customized for ${topic} — fill-in-the-blank ready"
    ]
  },
  "viralFormula": {
    "hookTemplates": [
      "5 specific hook templates for ${topic} on ${platform} — include the psychological trigger each one uses"
    ],
    "contentTypes": [
      {
        "format": "Specific content format name",
        "viralMechanism": "Exactly why this format goes viral in ${topic} niche",
        "productionComplexity": "Low | Medium | High",
        "exampleTitle": "Ready-to-use example title"
      }
    ],
    "engagementTriggers": [
      "3 specific comment-bait questions or controversy angles proven to work in ${topic} niche"
    ]
  },
  "growthMilestones": {
    "week1Goal": "Specific metric target for Week 1 (views, followers, or engagement rate)",
    "week2Goal": "Specific metric target for Week 2",
    "week4Goal": "Specific metric target for end of Day 30",
    "keyLevers": "The 2-3 most critical actions that determine whether this 30-day plan succeeds or fails"
  }
}

CRITICAL: Provide ALL 30 days in thirtyDayPlan. Each day must have a UNIQUE idea — zero repetition. Strategic mix: Days 1-7 build foundation, Days 8-21 find the viral hit, Days 22-30 compound and convert. Include the viralProbability score (1-10) for every day.`;

// ── AI call with retry ────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callAI = async (prompt, attempt = 1) => {
  try {
    return await aiClient.chat.completions.create({
      model:           aiModel,
      messages: [
        { role: 'system', content: GROWTHX_SYSTEM },
        { role: 'user',   content: prompt },
      ],
      temperature:     0.82,
      max_tokens:      5500,
      response_format: { type: 'json_object' },
    });
  } catch (err) {
    const status = err.status || err.response?.status;
    if (status === 429 && attempt <= 3) {
      const wait = Math.pow(2, attempt) * 5000;
      console.warn(`⚠️  GROWTHX 429 — retry ${attempt}/3 in ${wait / 1000}s`);
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

  if (!Array.isArray(parsed.thirtyDayPlan) || parsed.thirtyDayPlan.length === 0) {
    const err = new Error('Kế hoạch không đầy đủ, thử lại.');
    err.statusCode = 502;
    throw err;
  }

  if (!Array.isArray(parsed.contentPillars))              parsed.contentPillars = [];
  if (!parsed.seoStrategy)                                parsed.seoStrategy    = {};
  if (!Array.isArray(parsed.seoStrategy.keywords))        parsed.seoStrategy.keywords       = [];
  if (!parsed.seoStrategy.hashtags)                       parsed.seoStrategy.hashtags        = {};
  if (!Array.isArray(parsed.seoStrategy.titleTemplates))  parsed.seoStrategy.titleTemplates  = [];
  if (!parsed.viralFormula)                               parsed.viralFormula   = {};
  if (!Array.isArray(parsed.viralFormula.hookTemplates))  parsed.viralFormula.hookTemplates  = [];
  if (!Array.isArray(parsed.viralFormula.contentTypes))   parsed.viralFormula.contentTypes   = [];

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
