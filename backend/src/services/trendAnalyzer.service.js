const TrendItem               = require('../models/TrendItem.model');
const { aiClient: openai, aiModel } = require('./ai.service');

// CPM theo niche (USD, tham khảo thị trường VN)
const NICHE_CPM = {
  finance:      8,
  technology:   7,
  business:     7,
  education:    6,
  travel:       5,
  fitness:      5,
  lifestyle:    4,
  food:         4,
  entertainment:3,
  gaming:       3,
  news:         3,
  other:        2,
};

// Từ khoá gợi ý niche
const NICHE_KEYWORDS = {
  finance:       ['tiền', 'đầu tư', 'kiếm', 'ngân hàng', 'cổ phiếu', 'crypto', 'tài chính', 'tiết kiệm', 'vay', 'lãi'],
  technology:    ['điện thoại', 'laptop', 'ai', 'app', 'phần mềm', 'game', 'robot', 'công nghệ', 'internet'],
  business:      ['kinh doanh', 'startup', 'doanh nghiệp', 'thương mại', 'marketing', 'bán hàng'],
  education:     ['học', 'khóa học', 'thi', 'đại học', 'kỹ năng', 'chứng chỉ', 'tiếng anh'],
  travel:        ['du lịch', 'resort', 'khách sạn', 'tour', 'điểm đến', 'vé máy bay', 'check-in'],
  fitness:       ['gym', 'giảm cân', 'ăn kiêng', 'tập thể dục', 'sức khỏe', 'dinh dưỡng', 'yoga'],
  food:          ['ăn', 'nấu', 'nhà hàng', 'món', 'quán', 'ẩm thực', 'recipe', 'đồ ăn'],
  lifestyle:     ['phong cách', 'mỹ phẩm', 'skincare', 'thời trang', 'làm đẹp', 'xu hướng'],
  entertainment: ['phim', 'nhạc', 'giải trí', 'idol', 'kpop', 'nghệ sĩ', 'show', 'concert'],
  gaming:        ['game', 'esport', 'gaming', 'liên quân', 'minecraft', 'gamer'],
  news:          ['chính sách', 'chính phủ', 'quốc hội', 'tai nạn', 'sự kiện', 'xảy ra'],
};

/**
 * Phát hiện niche từ keyword + description
 */
const detectNiche = (keyword, description = '') => {
  const text = `${keyword} ${description}`.toLowerCase();
  let bestNiche = 'other';
  let maxScore  = 0;
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > maxScore) { maxScore = score; bestNiche = niche; }
  }
  return bestNiche;
};

/**
 * Tính điểm heuristic trước khi gọi AI
 */
const heuristicScore = (item) => {
  // Viral: từ velocity (Google/YouTube) hoặc recency (RSS)
  const viral = item.velocity ?? item.recencyScore ?? 50;

  // Monetization: dựa trên niche CPM
  const niche = detectNiche(item.keyword, item.description);
  const monetization = Math.min(100, ((NICHE_CPM[niche] || 2) / 8) * 100);

  // Competition heuristic: RSS bài mới = ít cạnh tranh hơn
  const competition = item.source === 'google_trends' ? 40 : item.source === 'youtube_trending' ? 55 : 70;

  const overall = Math.round(0.4 * viral + 0.35 * monetization + 0.25 * competition);

  return { viral: Math.round(viral), monetization: Math.round(monetization), competition, overall, niche };
};

/**
 * AI batch analysis: gửi top trends đến GPT-4o để score + suggest content angles
 * @param {Array} items - Raw trend items (đã heuristic scored)
 * @returns {Array} items với aiAnalysis thêm vào
 */
const batchAnalyzeWithAI = async (items) => {
  if (!items.length) return [];

  const trendList = items.map((item, i) =>
    `${i + 1}. Keyword: "${item.keyword}" | Nguồn: ${item.source} | Niche: ${item.niche || 'unknown'}
   Mô tả: ${(item.description || '').substring(0, 100)}`
  ).join('\n\n');

  const prompt = `Bạn là chuyên gia phân tích xu hướng mạng xã hội Việt Nam.
Phân tích ${items.length} xu hướng sau và đánh giá tiềm năng làm nội dung viral:

${trendList}

Với MỖI xu hướng, trả về:
- viralScore (0-100): Tiềm năng viral trên mạng xã hội Việt Nam
- monetizationScore (0-100): Tiềm năng kiếm tiền (CPM cao, affiliate tốt)
- competitionScore (0-100): Điểm cạnh tranh THẤP = cơ hội nhiều (ít content về topic này)
- niche: Technology/Finance/Lifestyle/Food/Travel/Fitness/Education/Entertainment/Business/Gaming/News/Other
- bestPlatforms: ["TikTok", "YouTube", ...] — 1-3 platform phù hợp nhất
- contentAngles: ["Góc 1", "Góc 2", "Góc 3"] — 3 góc tiếp cận độc đáo để làm nội dung
- whyViral: 1 câu giải thích tại sao xu hướng này có thể viral
- estimatedCPM: "$X-Y" — ước tính CPM nếu làm YouTube

Trả về JSON:
{
  "analyses": [
    {
      "index": 1,
      "viralScore": 0,
      "monetizationScore": 0,
      "competitionScore": 0,
      "niche": "...",
      "bestPlatforms": [],
      "contentAngles": [],
      "whyViral": "...",
      "estimatedCPM": "..."
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model:           aiModel,
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0.6,
      max_tokens:      3000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    const analyses = result.analyses || [];

    return items.map((item, i) => {
      const ai = analyses.find((a) => a.index === i + 1) || {};
      return {
        ...item,
        niche: ai.niche?.toLowerCase() || item.niche || 'other',
        scores: {
          viral:        ai.viralScore        || item.scores?.viral        || 50,
          monetization: ai.monetizationScore || item.scores?.monetization || 50,
          competition:  ai.competitionScore  || item.scores?.competition  || 50,
          overall:      Math.round(
            0.4  * (ai.viralScore        || 50) +
            0.35 * (ai.monetizationScore || 50) +
            0.25 * (ai.competitionScore  || 50)
          ),
        },
        aiAnalysis: {
          bestPlatforms:  ai.bestPlatforms  || [],
          contentAngles:  ai.contentAngles  || [],
          whyViral:       ai.whyViral       || '',
          estimatedCPM:   ai.estimatedCPM   || '',
        },
      };
    });
  } catch (err) {
    console.error('AI batch analyze error:', err.message);
    // Fallback: trả về với heuristic scores
    return items;
  }
};

/**
 * Full analyze pipeline: heuristic → AI → save to DB
 * @param {Array} rawItems - từ fetchAllTrends
 * @param {object} filter  - { niches, minScore }
 */
const analyzeAndSave = async (rawItems, filter = {}) => {
  const { niches = [], minScore = 0 } = filter;

  // Bước 1: heuristic scoring
  const scored = rawItems.map((item) => {
    const h = heuristicScore(item);
    return { ...item, niche: h.niche, scores: h };
  });

  // Bước 2: Filter sơ bộ theo niche trước khi gọi AI (tiết kiệm tokens)
  const filtered = scored.filter((item) => {
    if (niches.length && !niches.includes(item.niche)) return false;
    return item.scores.overall >= Math.max(0, minScore - 20); // buffer 20 điểm
  });

  if (!filtered.length) return [];

  // Bước 3: AI analysis (batch, tối đa 15 items để tiết kiệm tokens)
  const toAnalyze = filtered.slice(0, 15);
  const analyzed  = await batchAnalyzeWithAI(toAnalyze);

  // Bước 4: Filter cuối theo minScore sau AI
  const final = analyzed.filter((item) => item.scores.overall >= minScore);

  // Bước 5: Lưu vào DB (upsert bằng keyword + source + ngày)
  const saved = [];
  for (const item of final) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doc = await TrendItem.findOneAndUpdate(
      {
        keyword: item.keyword,
        source:  item.source,
        fetchedAt: { $gte: today },
      },
      {
        $set: {
          description:  item.description,
          url:          item.url,
          imageUrl:     item.imageUrl,
          niche:        item.niche,
          scores:       item.scores,
          aiAnalysis:   item.aiAnalysis,
          rawData:      item.rawData || {},
          region:       item.region  || 'VN',
          fetchedAt:    new Date(),
        },
      },
      { upsert: true, new: true }
    );
    saved.push(doc);
  }

  console.log(`✅ Analyzed ${rawItems.length} → saved ${saved.length} trend items`);
  return saved;
};

module.exports = { analyzeAndSave, detectNiche, heuristicScore };
