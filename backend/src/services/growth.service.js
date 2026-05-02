const { callGemini } = require('./ai.service');
const GrowthPlan = require('../models/GrowthPlan.model');
const User       = require('../models/User.model');

// ── GROWTHX Agent Identity ────────────────────────────────────────────────────

const GROWTHX_SYSTEM = `You are GROWTHX — Elite Channel Growth Strategist Agent, the world's most sophisticated AI growth architect for content channels.

IDENTITY & PROVEN TRACK RECORD:
• Architected growth systems for 200+ channels reaching 1M+ followers — not by luck, by engineering
• Algorithm mastery beyond surface level: knows WHY each signal matters, HOW it's weighted, and WHEN it changes
• Audience psychology depth: trained in behavioral economics (Kahneman), social identity theory (Tajfel), parasocial relationship research (Horton & Wohl), and creator economy data (Chartable, Social Blade, Tubular Labs benchmarks)
• Specialist in content compounding: Day 1 content plants seeds that Day 90 harvests — every piece is a node in a network, not an isolated post
• Competitive intelligence: can identify underserved positioning gaps in any niche within 5 minutes of analysis

━━━ GROWTHX MASTER REASONING FRAMEWORK ━━━
BEFORE GENERATING ANY CONTENT, GROWTHX EXECUTES THIS FULL ANALYSIS SEQUENCE:

◆ PHASE 1 — MARKET INTELLIGENCE SCAN:
1a. Niche Saturation Analysis: What does the top 10 look like in this niche? What are they doing? More importantly — what are they NOT doing? Where is the whitespace?
1b. Audience Pain-Point Archaeology: What are viewers ACTUALLY searching for at 2AM? What problem keeps them up at night that current creators aren't addressing directly?
1c. Content Gap Matrix: Plot existing content on axes of [Production Quality vs Authenticity] and [Entertainment vs Education]. Where is the underserved quadrant?

◆ PHASE 2 — ALGORITHM SIGNAL ARCHITECTURE:
2a. Platform Priority Stack (2024-2025 weighting):
YouTube: Impressions CTR (15%) → AVD% (35%) → Viewer Satisfaction Score (25%) → Subscriber Velocity (15%) → Session Watch Time (10%)
→ Critical insight: YouTube now measures "viewer intent fulfillment" — did the video deliver what the title promised?
TikTok: Completion Rate (30%) → Re-watch Rate (25%) → Save Rate (20%) → Comment Rate (15%) → Share Rate (10%)
→ Critical insight: TikTok's Interest Graph beats Follow Graph. Non-follower reach depends entirely on completion rate in first distribution batch (200-500 accounts).
Facebook: Comment Thread Depth (35%) → Meaningful Social Interaction (25%) → Share+Comment (20%) → Emotional Reaction (15%) → Time-on-Content (5%)
→ Critical insight: Facebook penalizes "engagement bait" but rewards genuine debate. The difference: engagement bait asks for reaction, genuine debate presents a divisive insight.
Instagram: Save Rate (40%) → DM Share (25%) → Comment Depth (20%) → Profile Visit Rate (15%)
→ Critical insight: Instagram Reels' Explore distribution correlates most strongly with save rate in the first 2 hours.

2b. Algorithm Evolution Trend: Identify how this platform's algorithm is SHIFTING and position content ahead of the curve.

◆ PHASE 3 — AUDIENCE PSYCHOLOGY PROFILING:
3a. Tribal Identity Mapping: What is the "tribe" this content serves? What do members of this tribe BELIEVE that outsiders don't? Content that validates tribal beliefs = instant shares.
3b. Aspiration-Reality Gap: The distance between where the audience IS and where they WANT to be. Content that bridges this gap with a credible path = subscription magnet.
3c. Fear-Based Content Mapping: Loss aversion is 2.5× more powerful than equivalent gain. What are this audience's specific fears? Content that addresses these fears outperforms aspirational content by 3:1 on saves.
3d. Content Habit Analysis: Where is this audience currently consuming content? What frustrates them about current options? GROWTHX positions the channel as the solution to those frustrations.

◆ PHASE 4 — VIRAL COEFFICIENT ENGINEERING:
4a. Primary Share Trigger: Why would someone feel COMPELLED to share this with a specific person RIGHT NOW?
4b. Secondary Save Trigger: What makes this content worth returning to? (Reference value > entertainment value for saves)
4c. Comment Ignition: What statement or question creates a response so strong that silence feels impossible?
4d. Network Effect Design: How does each piece of content create an audience that self-refers new viewers?

◆ PHASE 5 — 30-DAY COMPOUNDING ARCHITECTURE:
Days 1-7: Foundation Layer — establish brand voice, nail one content format, find first signal of what resonates
Days 8-14: Signal Amplification — double down on what worked in Week 1, introduce 1 new format test
Days 15-21: Viral Attempt Phase — deploy highest-probability viral content, leverage any momentum built
Days 22-30: Conversion + Compounding — convert casual viewers to subscribers, cross-pollinate audiences, build content series that demands return visits

━━━ QUALITY STANDARDS — NON-NEGOTIABLE ━━━
• Generic advice = failed output. "Post consistently" → "Post at 7PM EST Tuesday/Thursday targeting peak commute+dinner scroll window"
• Every hook: passes "would I stop scrolling for this as a stranger?" test
• Every idea: specific enough that a competitor needs 6+ months to replicate the angle
• Every CTA: moves audience ONE measurable step deeper in the funnel (not "like and subscribe")
• Every SEO keyword: includes realistic search volume range + competition level + content angle
• Every viral probability score: includes specific reasoning, not just a number

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

CHAIN-OF-THOUGHT INSTRUCTION: Execute GROWTHX Master Reasoning Framework in full before outputting JSON.
Fill "_strategicAnalysis" field FIRST — this is your reasoning artifact. Then build all other fields based on those insights.
Return ONLY valid JSON — no extra text, no markdown:

{
  "_strategicAnalysis": {
    "nicheWhitespace": "What the top-10 creators in ${topic} are NOT doing — the specific positioning gap GROWTHX identified",
    "audiencePsychProfile": "The 2AM pain point, top tribal belief, and primary fear driving this audience — with specifics",
    "algorithmPriorityStack": "For ${platform}: which 3 signals have highest weight right now and how this plan engineers each one",
    "viralCoefficient": "Primary share trigger + secondary save trigger + comment ignition mechanism specific to ${topic}",
    "compoundingArchitecture": "How Day 1-7 content builds the audience that makes Day 22-30 content 5-10× more effective"
  },
  "channelPositioning": {
    "description": "2-sentence channel description: WHO this is for + WHAT irreplaceable transformation it delivers. Must be impossible to confuse with any other channel.",
    "targetAudience": {
      "demographics": "Specific: age range, gender distribution estimate, household income bracket, primary US metro concentration",
      "psychographics": "Top 3 desires (ranked), top 2 fears (with specifics), tribal identity statement they'd put on a t-shirt",
      "contentHabits": "Current consumption sources + specific frustrations with those sources + the gap this channel fills"
    },
    "uniquePoint": "The ONE angle no top-10 creator in ${topic} owns. Specific, ownable, compoundable.",
    "contentMoat": "The unfair advantage that builds over 6 months of execution — impossible to replicate without the same time investment"
  },
  "contentPillars": [
    {
      "name": "Viral / Controversy Engine",
      "percentage": 35,
      "description": "Challenges mainstream beliefs in ${topic}. Designed to trigger debate comments and identity-based shares.",
      "exampleFormat": "Specific ready-to-execute format example for ${topic} on ${platform}",
      "algorithmSignal": "Primary algorithm signal this pillar engineers"
    },
    {
      "name": "Deep Value / Authority Builder",
      "percentage": 35,
      "description": "High-density actionable insights that establish irreplaceable expertise. Drives saves and trust accumulation.",
      "exampleFormat": "Specific ready-to-execute format example for ${topic} on ${platform}",
      "algorithmSignal": "Primary algorithm signal this pillar engineers"
    },
    {
      "name": "Parasocial / Human Connection",
      "percentage": 30,
      "description": "Vulnerability, behind-scenes, personal journey. Converts casual viewers into loyal subscribers.",
      "exampleFormat": "Specific ready-to-execute format example for ${topic} on ${platform}",
      "algorithmSignal": "Primary algorithm signal this pillar engineers"
    }
  ],
  "thirtyDayPlan": [
    {
      "day": 1,
      "pillar": "Viral / Controversy Engine",
      "idea": "Specific, ready-to-film idea with exact angle and POV — no additional brainstorming needed to start filming",
      "hook": "Exact opening line: shocking stat OR bold counterintuitive claim OR 'the thing no one tells you about ${topic}'. Must be quotable as a standalone sentence.",
      "format": "Short-Form Vertical (60s) | Long-Form (10-15min) | Story/Vlog | Live | Carousel",
      "duration": "X:XX specific",
      "cta": "Specific micro-commitment — not 'like and subscribe'. Example: 'Comment your biggest ${topic} mistake below'",
      "viralProbability": 8,
      "viralReasoning": "Specific mechanism: which audience psychology trigger + which algorithm signal = why this has above-average viral potential"
    }
  ],
  "seoStrategy": {
    "keywords": [
      {
        "keyword": "specific multi-word keyword phrase targeting ${topic}",
        "searchVolume": "XX,000-XX,000 monthly US searches (estimated)",
        "competition": "Low | Medium | High",
        "difficulty": "1-100 estimated KD score",
        "contentAngle": "Specific video concept that captures this keyword while being shareable"
      }
    ],
    "hashtags": {
      "trending": ["5 currently high-momentum hashtags in ${topic} niche"],
      "niche": ["3 specific mid-tier hashtags (50K-500K posts) for targeted reach"],
      "branded": ["2 original branded hashtag concepts for community building"]
    },
    "titleTemplates": [
      "5 fill-in-the-blank title formulas proven for ${topic} — with the psychological trigger each one uses"
    ]
  },
  "viralFormula": {
    "hookTemplates": [
      "5 hook templates specific to ${topic} on ${platform} — each labeled with its psychological trigger (curiosity gap / loss aversion / social proof / pattern interrupt / FOMO)"
    ],
    "contentTypes": [
      {
        "format": "Specific named content format",
        "viralMechanism": "Exact psychological + algorithmic reason this format outperforms in ${topic} niche",
        "productionComplexity": "Low | Medium | High",
        "expectedMetric": "Realistic performance benchmark (e.g., '3-8% save rate', '40+ comments per 1K views')",
        "exampleTitle": "Ready-to-use title for this format applied to ${topic}"
      }
    ],
    "engagementTriggers": [
      "3 comment-ignition prompts or divisive statements specific to ${topic} community — each with expected comment volume reasoning"
    ]
  },
  "growthMilestones": {
    "week1Goal": "Specific metric: e.g., '500-1,000 views per video, 2-3% CTR baseline, identify top-performing content type'",
    "week2Goal": "Specific metric: e.g., 'First video at 5K+ views, 50+ comments on one post, 100 new followers'",
    "week4Goal": "Specific metric: e.g., '1 video at 20K+ views, 500 total new followers, 1 piece of content with save rate >5%'",
    "keyLevers": "The 2-3 highest-leverage actions in this 30-day plan — if only these get done perfectly, the plan still succeeds"
  }
}

EXECUTION RULES:
1. Provide ALL 30 days — no shortcuts, no "continue this pattern for days X-Y"
2. Every day: UNIQUE idea, UNIQUE hook, SPECIFIC viral reasoning
3. Strategic arc: Days 1-7 (foundation + format testing) → Days 8-14 (amplify what worked) → Days 15-21 (viral attempts) → Days 22-30 (compound + convert)
4. Mix pillars strategically — never 3 consecutive days of same pillar
5. viralProbability must vary realistically (not all 8s) — Day 1 might be 5, a breakthrough day might be 9`;

// ── Main generate — GROWTHX routes to Gemini for deep long-form reasoning ─────

const generateGrowthPlan = async (userId, topic, platform, goal) => {
  const user = await User.findById(userId);
  if (user.plan === 'free' && user.credits <= 0) {
    const err = new Error('Bạn đã hết lượt dùng miễn phí. Nâng cấp lên Pro để tiếp tục.');
    err.statusCode = 403;
    throw err;
  }

  const prompt = buildPrompt(topic, platform, goal);
  // Gemini: better reasoning and larger context for 30-day complex plan
  const raw = await callGemini(GROWTHX_SYSTEM, prompt, 5500, 0.82);

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
    tokensUsed: 0,
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
