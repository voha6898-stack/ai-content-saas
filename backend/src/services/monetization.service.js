const AffiliateLink               = require('../models/AffiliateLink.model');
const Content                     = require('../models/Content.model');
const { aiClient: openai, aiModel } = require('./ai.service');

// Niches và keyword mapping để match affiliate links
const NICHE_KEYWORDS = {
  technology: ['điện thoại', 'laptop', 'phần mềm', 'app', 'tech', 'gadget', 'ai', 'digital'],
  finance:    ['kiếm tiền', 'đầu tư', 'cổ phiếu', 'crypto', 'tiết kiệm', 'ngân hàng', 'tài chính'],
  lifestyle:  ['thời trang', 'làm đẹp', 'skincare', 'phong cách', 'xu hướng', 'mỹ phẩm'],
  food:       ['ăn uống', 'nấu ăn', 'nhà hàng', 'công thức', 'ẩm thực', 'review đồ ăn'],
  travel:     ['du lịch', 'khách sạn', 'vé máy bay', 'tour', 'điểm đến', 'resort'],
  fitness:    ['gym', 'tập thể dục', 'giảm cân', 'dinh dưỡng', 'sức khỏe', 'protein'],
  education:  ['học', 'khóa học', 'kỹ năng', 'chứng chỉ', 'tiếng anh', 'lập trình'],
  business:   ['kinh doanh', 'startup', 'marketing', 'bán hàng', 'doanh nghiệp', 'thương mại'],
  gaming:     ['game', 'esport', 'review game', 'hướng dẫn game', 'gaming gear'],
  entertainment: ['phim', 'nhạc', 'giải trí', 'review', 'tiktok', 'youtube', 'viral'],
};

/**
 * Tự động phát hiện niche từ topic + content
 */
const detectNiche = (topic, content) => {
  const text = `${topic} ${content?.output?.script || ''} ${content?.output?.title || ''}`.toLowerCase();

  let bestNiche = 'other';
  let maxMatches = 0;

  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    const matches = keywords.filter((kw) => text.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestNiche  = niche;
    }
  }
  return bestNiche;
};

/**
 * Tìm affiliate links phù hợp với content
 */
const findAffiliateLinks = async (contentId, userId) => {
  const content = await Content.findOne({ _id: contentId, userId });
  if (!content) {
    const err = new Error('Không tìm thấy nội dung');
    err.statusCode = 404;
    throw err;
  }

  const niche = detectNiche(content.topic, content);

  // Lấy links theo niche + links "all"
  const links = await AffiliateLink.find({
    isActive: true,
    $or: [{ niche }, { niche: 'all' }],
  }).limit(5);

  // Keyword matching để sort theo relevance
  const text = `${content.topic} ${content.output.script}`.toLowerCase();
  const scored = links.map((link) => {
    const score = link.keywords.filter((kw) => text.includes(kw.toLowerCase())).length;
    return { ...link.toObject(), relevanceScore: score };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);

  return { niche, links: scored, content };
};

/**
 * Tạo CTA được tối ưu với affiliate link
 */
const generateOptimizedCTA = async (contentId, affiliateLinkId, userId) => {
  const content = await Content.findOne({ _id: contentId, userId });
  if (!content) {
    const err = new Error('Không tìm thấy nội dung');
    err.statusCode = 404;
    throw err;
  }

  const affLink = await AffiliateLink.findById(affiliateLinkId);
  if (!affLink) {
    const err = new Error('Affiliate link không tồn tại');
    err.statusCode = 404;
    throw err;
  }

  const prompt = `Bạn là chuyên gia copywriting và affiliate marketing.
Tạo 3 CTA (Call-to-Action) viral, tự nhiên để tích hợp vào nội dung ${content.platform}.

Thông tin:
- Chủ đề content: "${content.topic}"
- Sản phẩm/dịch vụ affiliate: "${affLink.name}" (${affLink.description})
- Hoa hồng: ${affLink.commission}
- Nền tảng: ${content.platform}

Yêu cầu CTA:
1. Tự nhiên, không lộ liễu kiểu "quảng cáo"
2. Tích hợp vào cuối caption hoặc script
3. Tạo cảm giác FOMO hoặc lợi ích rõ ràng
4. Phù hợp văn phong Việt Nam

Trả về JSON:
{
  "ctas": [
    { "type": "soft", "text": "..." },
    { "type": "direct", "text": "..." },
    { "type": "story", "text": "..." }
  ],
  "integratedCaption": "Caption gốc đã được tích hợp CTA tốt nhất"
}`;

  const response = await openai.chat.completions.create({
    model:           aiModel,
    messages:        [{ role: 'user', content: prompt }],
    temperature:     0.8,
    max_tokens:      1000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Thêm affiliate URL vào mỗi CTA
  result.ctas = result.ctas.map((cta) => ({
    ...cta,
    fullText: `${cta.text}\n👉 ${affLink.url}`,
  }));

  return {
    affiliateLink: affLink,
    ...result,
  };
};

/**
 * Gợi ý tối ưu RPM (Revenue Per Mille) cho YouTube
 */
const getRPMOptimization = async (contentId, userId) => {
  const content = await Content.findOne({ _id: contentId, userId });
  if (!content) {
    const err = new Error('Không tìm thấy nội dung');
    err.statusCode = 404;
    throw err;
  }

  const prompt = `Bạn là chuyên gia monetization YouTube với RPM cao nhất.
Phân tích và tối ưu nội dung sau để tăng RPM (doanh thu quảng cáo):

Topic: "${content.topic}"
Title: "${content.output.title}"
Script (đầu): "${content.output.script.substring(0, 500)}..."
Platform: ${content.platform}

Hãy tư vấn:
1. Optimized title để thu hút advertiser trả giá cao
2. Keywords CPM cao nên thêm vào description
3. Video length recommendation (thời lượng tối ưu cho mid-rolls)
4. Cấu trúc video để giữ watch time cao (ảnh hưởng RPM)
5. Upload time tối ưu cho thị trường VN
6. 5 từ khoá high-CPM liên quan đến topic

Trả về JSON:
{
  "optimizedTitle": "...",
  "highCPMKeywords": ["kw1", "kw2", ...],
  "recommendations": [
    { "category": "...", "tip": "...", "impact": "high|medium|low" }
  ],
  "bestUploadTime": "...",
  "estimatedRPMRange": "...",
  "videoLengthMin": 0
}`;

  const response = await openai.chat.completions.create({
    model:           aiModel,
    messages:        [{ role: 'user', content: prompt }],
    temperature:     0.7,
    max_tokens:      1200,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { findAffiliateLinks, generateOptimizedCTA, getRPMOptimization, detectNiche };
