const OpenAI = require('openai');

// ── Provider ───────────────────────────────────────────────────────────────────
const PROVIDER = process.env.AI_PROVIDER || 'openai';
const PROVIDERS = {
  groq:   { apiKey: process.env.GROQ_API_KEY,   baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  openai: { apiKey: process.env.OPENAI_API_KEY,  baseURL: undefined,                        model: 'gpt-4o' },
};
const cfg    = PROVIDERS[PROVIDER] || PROVIDERS.openai;
const client = new OpenAI({ apiKey: cfg.apiKey, ...(cfg.baseURL && { baseURL: cfg.baseURL }) });
console.log(`🤖 AI Agent VIRA: ${PROVIDER.toUpperCase()} (${cfg.model})`);

// ── VIRA SYSTEM IDENTITY ───────────────────────────────────────────────────────
// Viral Intelligence & Resonance Agent
const VIRA_SYSTEM = `Bạn là VIRA — Viral Intelligence & Resonance Agent, AI chuyên gia content marketing đẳng cấp thế giới.

CHUYÊN MÔN:
• Phân tích 50 triệu video/bài viral trên YouTube, TikTok, Facebook, Instagram
• Thành thạo tâm lý học hành vi người xem: dopamine triggers, attention hijacking, social proof loops
• Nắm vững thuật toán từng nền tảng: watch-time curve, engagement velocity, share triggers
• Thông thạo thị trường số Việt Nam: văn hoá, slang, xu hướng, tâm lý người tiêu dùng Gen Z & Millennial
• Áp dụng neuromarketing, copywriting frameworks (AIDA, PAS, StoryBrand) chuẩn quốc tế

NGUYÊN TẮC TƯ DUY:
Trước khi tạo nội dung, VIRA tự hỏi:
1. Điều gì khiến người xem DỪNG ngón tay trong 0.5 giây đầu?
2. Cảm xúc nào sẽ khiến họ PHẢI chia sẻ với bạn bè?
3. Thông tin gì có giá trị đến mức họ sẽ LƯU LẠI để xem sau?
4. Câu kết nào sẽ khiến họ COMMENT ngay lập tức?
5. Nội dung này có thể tạo ra VÒNG LẶP viral không (share → friend xem → share tiếp)?

TIÊU CHUẨN CHẤT LƯỢNG:
• KHÔNG generic — mỗi câu phải cụ thể, không thể dùng cho chủ đề khác
• Script phải là lời nói thật — đọc lên nghe tự nhiên như đang nói chuyện
• Hook phải vượt qua "scroll-stop threshold" — 90% người xem phải dừng lại
• Mọi thông tin đưa ra phải có cơ sở logic hoặc ví dụ thực tế
• Kết quả phải khiến người dùng cảm thấy: "Tôi có lợi thế không công bằng so với người khác"

Luôn trả về JSON hợp lệ, không thêm text ngoài JSON.`;

// ── PLATFORM GUIDES ────────────────────────────────────────────────────────────

const platformGuides = {

  // ── YOUTUBE ─────────────────────────────────────────────────────────────────
  YouTube: (topic) => `
NHIỆM VỤ: Tạo nội dung YouTube VIRAL tối thượng cho chủ đề: "${topic}"

PHÂN TÍCH THUẬT TOÁN YOUTUBE:
YouTube reward những video có: CTR cao (title+thumbnail), watch-time >60%, like/comment trong 24h đầu, replay rate cao ở đoạn giữa.

━━━ TITLE ━━━
Áp dụng công thức TITLE SCORE = (Curiosity Gap × Emotional Trigger × Keyword Strength).
Chọn và tuỳ biến 1 trong các công thức đã chứng minh đạt CTR >8%:
• [Số lượng cụ thể] + [Kết quả không ngờ] + [Thời gian ngắn bất ngờ]
  Ví dụ mẫu: "7 Sai Lầm [Topic] Khiến Bạn Mất Tiền Mỗi Ngày Mà Không Hay"
• [Sự thật bị che giấu] + [% người không biết]
  Ví dụ mẫu: "Bí Mật [Topic] Mà Chuyên Gia Không Muốn Bạn Biết (90% Người Việt Bỏ Lỡ)"
• [Thách thức cá nhân] + [Kết quả gây sốc]
  Ví dụ mẫu: "Tôi Thử [Topic] Trong 30 Ngày — Kết Quả Làm Tôi Choáng"
• [Cảnh báo khẩn + ĐỪNG/TRÁNH/STOP] + lý do cụ thể
• [So sánh A vs B] + góc nhìn counterintuitive
Yêu cầu: 55-65 ký tự, keyword chính đầu title, VIẾT HOA từ quan trọng.

━━━ SCRIPT (4-5 phút) ━━━
Áp dụng RETENTION CURVE ENGINEERING — đặt "bom tò mò" mỗi 60-90 giây.

[HOOK — 0:00-0:15] NEUROLOGICAL PATTERN INTERRUPT:
Dùng 1 trong 3 kỹ thuật khai thác amygdala:
  A. SHOCK OPENING: Tuyên bố phản trực giác cực mạnh liên quan trực tiếp đến đời sống người xem
  B. PAIN MIRROR: Mô tả chính xác nỗi đau người xem đang sống — khiến họ nghĩ "AI đọc được suy nghĩ mình vậy?"
  C. FUTURE PACING: Đặt họ vào kịch bản tương lai cụ thể trong 5 giây
→ KHÔNG bao giờ dùng: "Xin chào mọi người", "Hôm nay mình sẽ", "Welcome back"

[VẤN ĐỀ — 0:15-0:45] EMPATHY + AGITATION:
  Dùng ngôn ngữ "Bạn không phải người duy nhất..." / "Đây là lý do tại sao 80% người [topic] thất bại..."
  Amplify pain point — đừng chỉ nêu vấn đề, hãy làm nó đau hơn.

[HỨA HẸN — 0:45-1:00] OPEN LOOP + VALUE STACK:
  "Trong video này mình sẽ cho bạn [lợi ích 1 cụ thể], [lợi ích 2 bất ngờ], và cuối video có [insight mà 99% không biết]"
  Kết: "Nhớ xem hết vì phần quan trọng nhất mình để cuối cùng."

[NỘI DUNG CHÍNH — 1:00-4:30] INFORMATION ARCHITECTURE:
  Cấu trúc 3-4 điểm theo nguyên tắc ESCALATING VALUE:
  • Điểm 1: Dễ tiếp cận, ai cũng liên quan — build trust
  • Điểm 2: Sâu hơn, có ví dụ thực tế với con số/case study cụ thể — build authority
  • Điểm 3: Insight counterintuitive — thứ mà hầu hết không biết — create "aha moment"
  • Điểm 4 (nếu có): Advanced tip, practical application ngay lập tức
  → Mỗi điểm: Có tiêu đề rõ ràng + giải thích + ví dụ thực tế/số liệu + mini-CTA engagement

[CTA — 4:30-hết] COMMITMENT & CONSISTENCY:
  Tóm tắt 3 ý chính → Subscribe với lý do cụ thể (không phải generic "ủng hộ kênh") → Câu hỏi kích comment cụ thể và dễ trả lời → Preview video tiếp theo

━━━ CAPTION ━━━
180-220 từ: Mở bằng keyword SEO chính (câu đầu tiên quan trọng nhất). Tóm tắt giá trị video. Chapters/Timestamps (00:00, 01:30, 03:00...). 2 CTA (like+subscribe, comment). Từ khoá phụ nhúng tự nhiên cuối caption.

━━━ HASHTAGS ━━━
12-15 hashtag: Mix 40% trending Việt Nam + 40% SEO tiếng Anh mạnh + 20% niche chuyên sâu.`,

  // ── TIKTOK ──────────────────────────────────────────────────────────────────
  TikTok: (topic) => `
NHIỆM VỤ: Tạo nội dung TikTok VIRAL tối thượng cho chủ đề: "${topic}"

PHÂN TÍCH THUẬT TOÁN TIKTOK:
TikTok reward: completion rate >80%, rewatch rate, share velocity trong 1h đầu, comment sentiment (debate = viral), saves (= high value signal).

━━━ TITLE/CAPTION ━━━
Câu đầu = SCROLL STOPPER phải kích hoạt 1 trong 5 trigger tâm lý:
• FOMO: "Cái này bạn không biết thật sự thiệt thòi..."
• Controversy: "Mình sắp nói điều nhiều người sẽ ghét mình vì điều này..."
• Relatability: "Ai [tình huống cực relatable liên quan topic] thì bình luận cho mình biết 👇"
• Curiosity Gap: "Lý do thật sự tại sao [topic] không hoạt động với bạn là..."
• Pattern Interrupt: Bắt đầu bằng một câu CỰC KỲ bất ngờ/kỳ lạ liên quan topic
Dài tối đa 100 ký tự. Kết thúc bằng câu hỏi/cliffhanger để maximize comment rate.

━━━ SCRIPT (từng dòng = 1 cảnh 2-3 giây) ━━━
Áp dụng TIKTOK RETENTION FORMULA: Hook → Loop → Value → Reward → CTA

[0:00-0:02] PATTERN INTERRUPT HOOK — không "xin chào", không giới thiệu:
  Bắt đầu bằng hành động/câu nói CỰC KỲ bắt mắt hoặc counterintuitive statement về topic.
  Tạo "incomplete loop" — não người xem không thể không muốn biết phần tiếp theo.

[0:02-0:08] LOOP ANCHOR:
  Hé lộ một phần của "secret" nhưng giữ lại phần quan trọng nhất → người xem phải ở lại.

[0:08-0:25] VALUE DELIVERY — SAVE-WORTHY CONTENT:
  Đây là điểm "too good not to save" — thông tin cực kỳ có giá trị, cụ thể, actionable.
  Trình bày bằng text overlay + lời nói đồng thời → tăng retention.

[0:25-0:45] UNEXPECTED TWIST:
  Điều bất ngờ hoàn toàn mà người xem không dự đoán được — tạo "shareworthy moment".
  Đây là lý do tại sao người ta sẽ @tag bạn bè.

[0:45-hết] ENGAGEMENT CTA:
  "Follow để mình chia sẻ [topic liên quan] tuần này" + 1 câu hỏi CỰC DỄ trả lời để kích comment.

━━━ CAPTION ━━━
60-80 từ. Reinforces hook. Kết bằng câu hỏi tranh luận hoặc poll để maximize comment count.

━━━ HASHTAGS ━━━
10-12: Bắt buộc #xuhuong #viral #fyp + hashtag niche cụ thể của topic (không dùng hashtag quá rộng).`,

  // ── FACEBOOK ────────────────────────────────────────────────────────────────
  Facebook: (topic) => `
NHIỆM VỤ: Tạo bài viết Facebook VIRAL tối thượng cho chủ đề: "${topic}"

PHÂN TÍCH THUẬT TOÁN FACEBOOK:
Facebook reward: comment threads dài (đặc biệt là debate), shares với comment, reactions (haha/wow/sad > like), time on post (scrolling through long content), saves.

━━━ TITLE (Dòng trước "Xem thêm") ━━━
Đây là câu QUYẾT ĐỊNH — 90% người đọc chỉ thấy dòng này.
Áp dụng CURIOSITY GAP + EMOTIONAL RESONANCE:
• Story hook: "3 năm trước mình đã [hành động liên quan topic] và cái kết khiến mình không ngủ được..."
• Confession opener: "Thú nhận thật: Mình đã [điều xấu hổ nhưng relatable] vì [topic] suốt [thời gian]..."
• Bold claim: "[Tuyên bố counterintuitive về topic]. Nghe có vẻ vô lý nhưng đây là sự thật..."
• Vulnerability hook: "Lần đầu tiên mình thất bại với [topic], mình đã làm điều này..."
→ KHÔNG bao giờ dùng: "Xin chào mọi người ơi", "Hôm nay mình muốn chia sẻ", "Mình thấy nhiều bạn hỏi về"

━━━ SCRIPT (280-350 từ) ━━━
Áp dụng EMOTIONAL JOURNEY MAP: Nhận diện → Đồng cảm → Tò mò → Giá trị → Hành động

[ATTENTION — 30-50 từ đầu]:
  Mở đầu bằng story cực relatable hoặc tình huống 80% người đọc đã từng trải qua.
  Dùng ngôn ngữ mạnh: từng, đã từng, không ngờ, bất ngờ, sốc, thật ra...

[STORY/PROBLEM — 80-100 từ]:
  Kể câu chuyện thật (hoặc nghe như thật) với chi tiết cụ thể — tên người, con số, địa điểm.
  "Cụ thể là [tình huống], mình đã [hành động], và kết quả là [hậu quả/insight]..."

[VALUE DELIVERY — 100-130 từ]:
  2-3 insights/tips CỰC KỲ cụ thể về topic. Mỗi tip có ví dụ thực tế.
  Dùng bullet points hoặc đánh số để dễ đọc trên mobile.
  Phải có ít nhất 1 thông tin COUNTERINTUITIVE mà người đọc chưa nghe bao giờ.

[ENGAGEMENT TRIGGER — 40-60 từ cuối]:
  Kết thúc bằng câu hỏi CỤTHỂ dễ trả lời = maximize comment.
  Thêm "Tag người bạn cần đọc cái này" hoặc "Share nếu bạn đồng ý/không đồng ý".
  1-2 emoji phù hợp ngữ cảnh (không spam emoji).

━━━ CAPTION ━━━
2-3 câu share caption. Có hook + value promise. 1-2 emoji natural.

━━━ HASHTAGS ━━━
6-10 hashtag: Mix #cuocsong #kinhnghiem #tamsu + niche-specific hashtag của topic.`,

  // ── INSTAGRAM ───────────────────────────────────────────────────────────────
  Instagram: (topic) => `
NHIỆM VỤ: Tạo nội dung Instagram VIRAL tối thượng cho chủ đề: "${topic}"

PHÂN TÍCH THUẬT TOÁN INSTAGRAM:
Instagram reward: saves (tín hiệu mạnh nhất), shares via DM, comment threads, reel watch-time >80%, profile visits sau khi xem post.

━━━ TITLE (2 dòng đầu caption) ━━━
Line 1: Hook chứa keyword + emotional trigger + 1-2 emoji phù hợp (≤80 ký tự)
• Pattern: "Không ai nói với mình điều này về [topic] sớm hơn 😭" (regret trigger)
• Pattern: "[Số] thứ về [topic] mà mình ước biết sớm hơn 👇" (listicle curiosity)
• Pattern: "Nếu bạn [pain point liên quan topic], đọc ngay cái này 🔥" (direct relevance)
Line 2: Reinforce hook hoặc tease value của post.

━━━ SCRIPT ━━━
Format Reels (15-30s): Hook (0-3s) → Problem/Relatable moment (3-8s) → Solution/Value (8-22s) → Save CTA (22-30s)
Format Carousel (6-10 slides):
  Slide 1: Hook title — gây sốc/tò mò tối đa, phải làm người xem vuốt tiếp
  Slide 2-3: Problem agitation — "Bạn có đang mắc phải..."
  Slide 4-7: Value slides — mỗi slide 1 insight, text lớn, dễ đọc, save-worthy
  Slide 8-9: Counterintuitive insight — phần không ai khác nói
  Slide cuối: CTA — "Save bài này 🔖 để dùng sau" + question để comment

━━━ CAPTION ━━━
120-160 từ. Cấu trúc: Hook (2 dòng) → Line break → Story/context (3-4 dòng) → Value bullets → Line break → CTA + câu hỏi.
Dùng line breaks sau mỗi 2-3 dòng (Instagram không tự ngắt đoạn).
Kết bằng: "Save bài này 🔖" + câu hỏi cụ thể.

━━━ HASHTAGS ━━━
20-25 hashtag: 5 broad (1M+ post) + 8 medium (100K-1M) + 7 niche (<100K) = sweet spot reach.`,
};

// ── PROMPT BUILDER ─────────────────────────────────────────────────────────────

const buildPrompt = (topic, platform) => {
  const guide = platformGuides[platform]?.(topic);
  if (!guide) throw new Error(`Platform không hỗ trợ: ${platform}`);

  return `${guide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — Trả lời ĐÚNG JSON sau, KHÔNG thêm bất kỳ text nào ngoài JSON:
{
  "title": "Tiêu đề/caption đầu đã được tối ưu hoàn toàn",
  "script": "Toàn bộ script/bài viết đầy đủ — sẵn sàng dùng ngay, không cần chỉnh sửa",
  "caption": "Caption/mô tả tối ưu SEO và engagement",
  "hashtags": ["#tag1", "#tag2", "..."]
}

LƯU Ý CUỐI:
• Tất cả nội dung bằng tiếng Việt tự nhiên, đời thường — nghe như con người nói không phải AI
• Script phải cụ thể cho chủ đề "${topic}" — không thể hoán đổi cho chủ đề khác
• Mọi ví dụ, con số, tình huống phải realistic và believable`;
};

// ── RETRY LOGIC ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const generateContent = async (topic, platform, _attempt = 1) => {
  const prompt    = buildPrompt(topic, platform);
  const maxTokens = platform === 'YouTube' ? 3500 : 2800;
  const MAX       = 3;

  try {
    const response = await client.chat.completions.create({
      model:           cfg.model,
      messages: [
        { role: 'system', content: VIRA_SYSTEM },
        { role: 'user',   content: prompt },
      ],
      temperature:     0.88,
      max_tokens:      maxTokens,
      response_format: { type: 'json_object' },
    });

    const raw    = response.choices[0].message.content;
    const parsed = JSON.parse(raw);

    if (!parsed.title || !parsed.script || !parsed.caption) {
      throw new Error('AI trả về dữ liệu không đầy đủ, thử lại.');
    }
    if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];

    return { output: parsed, tokensUsed: response.usage?.total_tokens || 0 };

  } catch (err) {
    const status = err.status || err.response?.status;

    if (status === 429 && _attempt <= MAX) {
      const ms = Math.pow(2, _attempt) * 5000;
      console.warn(`⚠️  VIRA 429 — retry ${_attempt}/${MAX} sau ${ms / 1000}s`);
      await sleep(ms);
      return generateContent(topic, platform, _attempt + 1);
    }
    if (status === 429) {
      const e = new Error('AI đang bận, vui lòng thử lại sau 30 giây.');
      e.statusCode = 503;
      throw e;
    }
    if (err instanceof SyntaxError && _attempt <= MAX) {
      await sleep(2000);
      return generateContent(topic, platform, _attempt + 1);
    }
    throw err;
  }
};

module.exports = { generateContent, aiClient: client, aiModel: cfg.model };
