const OpenAI = require('openai');

// ── AI Provider config ─────────────────────────────────────────────────────
const PROVIDER = process.env.AI_PROVIDER || 'openai';

const PROVIDERS = {
  groq: {
    apiKey:  process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    model:   'llama-3.3-70b-versatile',
  },
  openai: {
    apiKey:  process.env.OPENAI_API_KEY,
    baseURL: undefined, // default OpenAI
    model:   'gpt-4o',
  },
};

const cfg    = PROVIDERS[PROVIDER] || PROVIDERS.openai;
const client = new OpenAI({ apiKey: cfg.apiKey, ...(cfg.baseURL && { baseURL: cfg.baseURL }) });

console.log(`🤖 AI Provider: ${PROVIDER.toUpperCase()} (${cfg.model})`);

// ─────────────────────────────────────────────────────────────────────────────
// VIRAL PROMPT v2 — tối ưu theo từng platform
// ─────────────────────────────────────────────────────────────────────────────

const platformGuides = {

  // ── YOUTUBE ────────────────────────────────────────────────────────────────
  YouTube: (topic) => `
Bạn là một YouTuber Việt Nam chuyên nghiệp có kênh 2 triệu subscriber.
Tạo nội dung video YouTube VIRAL nhất có thể cho chủ đề: "${topic}"

━━━ TITLE ━━━
Chọn và áp dụng 1 trong 7 công thức title viral đã kiểm chứng:
1. Con số + Lợi ích cụ thể: "7 Cách [Topic] Giúp Bạn [Kết Quả Cụ Thể] Trong [Thời Gian]"
2. Bí mật bị che giấu: "Sự Thật Về [Topic] Mà 99% Người Việt Không Biết"
3. Thách thức + Kết quả gây sốc: "Tôi Đã [Hành Động Liên Quan Topic] Trong 30 Ngày - Kết Quả Bất Ngờ"
4. Câu hỏi gây tò mò: "Tại Sao [Phần Lớn] Người Việt [Topic] Sai Hoàn Toàn?"
5. Cảnh báo khẩn: "[ĐỪNG] Làm [Topic] Khi Chưa Xem Video Này"
6. So sánh + Trải nghiệm thực tế: "[A] vs [B]: Sau 1 Năm Dùng Cả Hai, Đây Là Sự Thật"
7. Danh sách siêu tiêu đề: "Top [X] [Topic] Đỉnh Nhất [Năm] - Xem Trước Khi Quyết Định"
Yêu cầu: 55-65 ký tự, có từ khoá chính ở đầu hoặc giữa, VIẾT HOA chữ đầu mỗi từ quan trọng.

━━━ SCRIPT ━━━
Viết kịch bản video 4-5 phút với cấu trúc bắt buộc sau:

[HOOK - 0 đến 15 giây] KHÔNG tự giới thiệu tên hay kênh. Mở đầu bằng:
  - Một câu khẳng định gây sốc hoặc đi ngược lại quan niệm thông thường, HOẶC
  - Đặt câu hỏi trực tiếp vào nỗi đau/mong muốn của người xem, HOẶC
  - Bắt đầu bằng kết quả cuối cùng để kéo sự tò mò

[VẤN ĐỀ - 15 đến 45 giây]
  - Mô tả vấn đề 80% người xem đang gặp phải với topic này
  - Dùng ngôn ngữ "Bạn có biết... / Bạn có từng.../ Hầu hết mọi người..."
  - Tạo cảm giác đồng cảm và "OMG đúng mình rồi"

[TEASER - 45 giây đến 1 phút]
  - "Và trong video này mình sẽ chia sẻ [lợi ích 1], [lợi ích 2], và đặc biệt là [lợi ích 3 bất ngờ nhất]"
  - Kết bằng "Ở lại xem hết nhé vì thông tin quan trọng nhất mình để cuối"

[NỘI DUNG CHÍNH - 1 phút đến 4:30]
  Chia thành 3-4 điểm rõ ràng, mỗi điểm có:
  - Tiêu đề điểm (ví dụ: "Điểm 1: ...")
  - Giải thích + Ví dụ thực tế hoặc số liệu cụ thể
  - Mini CTA nhỏ giữa video: "Nếu bạn thấy hữu ích, bấm Like để ủng hộ mình nhé"

[CTA CUỐI - 4:30 đến hết]
  - Tóm tắt 2-3 ý chính bằng bullet points
  - Subscribe CTA cụ thể: "Bấm Subscribe và bật thông báo để không bỏ lỡ video về [topic liên quan]"
  - Câu hỏi kích thích comment: "[Câu hỏi cụ thể liên quan topic]? Comment bên dưới cho mình biết nhé!"

━━━ CAPTION ━━━
Mô tả video 180-220 từ: Mở đầu bằng keyword SEO chính, tóm tắt nội dung,
thêm timestamps (00:00, 01:30, 03:00...), links CTA, và từ khoá phụ tự nhiên.

━━━ HASHTAGS ━━━
12-15 hashtag: 40% tiếng Việt trending, 40% tiếng Anh SEO mạnh, 20% niche chuyên sâu.`,

  // ── TIKTOK ────────────────────────────────────────────────────────────────
  TikTok: (topic) => `
Bạn là một TikToker Việt Nam chuyên nghiệp có tài khoản 5 triệu followers.
Tạo nội dung TikTok VIRAL nhất có thể cho chủ đề: "${topic}"

━━━ TITLE (Caption hiển thị trên TikTok) ━━━
Câu đầu tiên phải tạo PATTERN INTERRUPT trong 1-2 giây đầu người xem thấy.
Dùng 1 trong các công thức:
- Controversial opener: "Mình sắp nói điều mà nhiều người sẽ không đồng ý..."
- Cliffhanger: "Điều này đã thay đổi [khía cạnh liên quan topic] của mình mãi mãi"
- Challenge: "Thử cái này 7 ngày và nói cho mình biết kết quả"
- Shocking stat: "[X]% người Việt không biết [fact về topic]"
Dài tối đa 100 ký tự. Kết thúc bằng câu hỏi hoặc cliffhanger để tăng comment.

━━━ SCRIPT (30-60 giây, từng dòng = 1 cảnh quay) ━━━
[Giây 0-2]: HOOK tuyệt đối - Pattern interrupt, câu/hành động cực kỳ bắt mắt.
  KHÔNG dùng "Xin chào" hay "Hôm nay mình sẽ". Bắt đầu thẳng vào vấn đề.
[Giây 2-8]: Làm rõ vấn đề/lợi ích một cách relatable "Ai cũng từng..."
[Giây 8-20]: Điểm 1 + Điểm 2 — ngắn gọn, có ví dụ trực quan, nhanh
[Giây 20-40]: Điểm 3 — đây là điểm "SAVE-WORTHY" nhất, thông tin có giá trị cao nhất
[Giây 40-52]: Twist hoặc Surprise — điều bất ngờ mà người xem không đoán được
[Giây 52-60]: CTA: "Follow để xem thêm tip về [topic]" + câu hỏi kích comment

━━━ CAPTION ━━━
60-80 từ. Kết thúc bằng câu hỏi hoặc poll để kéo comment.

━━━ HASHTAGS ━━━
10-12 hashtag: bắt buộc có #xuhuong #viral #fyp #LearnOnTikTok + 6-8 hashtag niche.`,

  // ── FACEBOOK ───────────────────────────────────────────────────────────────
  Facebook: (topic) => `
Bạn là chuyên gia content Facebook Marketing với 10 năm kinh nghiệm tại Việt Nam,
đã tạo hàng trăm bài đạt 10.000+ share.
Tạo bài viết Facebook VIRAL cho chủ đề: "${topic}"

━━━ TITLE (Dòng đầu tiên của bài — phần hiển thị trước "Xem thêm") ━━━
- Emotional story opener: "3 năm trước, mình đã [hành động liên quan topic] và..."
- Relatable confession: "Ai đã từng [tình huống liên quan topic] thì lại đây mình kể nghe..."
- Bold statement: "Hầu hết mọi người [topic] sai hoàn toàn. Và mình từng là một trong số đó."
- Curiosity gap list: "5 điều mình ước gì có người nói với mình trước khi [topic]:"

━━━ SCRIPT (Bài viết 280-350 từ) ━━━
[ATTENTION]: Hook cực mạnh, KHÔNG dùng "Xin chào mọi người".
[INTEREST]: Kể câu chuyện cụ thể, dùng ngôn ngữ đời thường.
[DESIRE]: Giải pháp rõ ràng với 2-3 tips cụ thể.
[ACTION]: Câu hỏi kích comment + Tag trigger.

━━━ CAPTION ━━━
2-3 câu mở đầu bài cho khi share lại. Có 2-3 emoji phù hợp.

━━━ HASHTAGS ━━━
6-10 hashtag: mix giữa #cuocsong #tamsu #kinhnghiem và hashtag niche của topic.`,

  // ── INSTAGRAM ──────────────────────────────────────────────────────────────
  Instagram: (topic) => `
Bạn là một Instagram Influencer Việt Nam chuyên nghiệp, tài khoản 800K followers.
Tạo nội dung Instagram VIRAL cho chủ đề: "${topic}"

━━━ TITLE (Dòng đầu caption) ━━━
- Hook + emoji: "Không ai nói với mình điều này sớm hơn 😭 [topic]"
- Question hook: "Bạn đã thực sự biết [topic] chưa? 👇"
Tối đa 80 ký tự, có 1-2 emoji phù hợp.

━━━ SCRIPT ━━━
Reels (15-30 giây): kịch bản từng cảnh hook → vấn đề → giải pháp → CTA.
Carousel (6-10 slides): tiêu đề từng slide rõ ràng, slide cuối là CTA.

━━━ CAPTION ━━━
120-160 từ. Dùng line breaks, emoji đầu đoạn. Kết bằng "Save bài này 🔖".

━━━ HASHTAGS ━━━
20-25 hashtag: 5 lớn, 10 vừa, 5-7 niche.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const buildPrompt = (topic, platform) => {
  const guide = platformGuides[platform]?.(topic);
  if (!guide) throw new Error(`Platform không hỗ trợ: ${platform}`);

  return `${guide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trả lời ĐÚNG định dạng JSON sau, KHÔNG thêm bất kỳ text nào ngoài JSON.
Tất cả nội dung phải bằng tiếng Việt tự nhiên, hấp dẫn, phù hợp thị trường Việt Nam.
{
  "title": "...",
  "script": "...",
  "caption": "...",
  "hashtags": ["#tag1", "#tag2"]
}`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const generateContent = async (topic, platform, _attempt = 1) => {
  const prompt     = buildPrompt(topic, platform);
  const maxTokens  = platform === 'YouTube' ? 3000 : 2500;
  const maxRetries = 3;

  try {
    const response = await client.chat.completions.create({
      model:    cfg.model,
      messages: [
        {
          role:    'system',
          content: 'Bạn là chuyên gia content marketing viral hàng đầu Việt Nam. Luôn trả lời bằng JSON hợp lệ, nội dung chất lượng cao và có tính viral thực sự.',
        },
        { role: 'user', content: prompt },
      ],
      temperature:     0.9,
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

    // Rate limit (429) — exponential backoff, max 3 retries
    if (status === 429 && _attempt <= maxRetries) {
      const waitMs = Math.pow(2, _attempt) * 5000; // 10s, 20s, 40s
      console.warn(`⚠️  Groq 429 — retry ${_attempt}/${maxRetries} sau ${waitMs / 1000}s`);
      await sleep(waitMs);
      return generateContent(topic, platform, _attempt + 1);
    }

    if (status === 429) {
      const userErr = new Error('AI đang bận, vui lòng thử lại sau 30 giây.');
      userErr.statusCode = 503;
      throw userErr;
    }

    // JSON parse failure — retry once with same backoff
    if (err instanceof SyntaxError && _attempt <= maxRetries) {
      console.warn(`⚠️  AI JSON parse error — retry ${_attempt}/${maxRetries}`);
      await sleep(2000);
      return generateContent(topic, platform, _attempt + 1);
    }

    throw err;
  }
};

module.exports = { generateContent, aiClient: client, aiModel: cfg.model };
