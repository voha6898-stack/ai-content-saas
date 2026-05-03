const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Groq/OpenAI Provider ───────────────────────────────────────────────────────
const PROVIDER = process.env.AI_PROVIDER || 'openai';
const PROVIDERS = {
  groq:   { apiKey: process.env.GROQ_API_KEY,   baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  openai: { apiKey: process.env.OPENAI_API_KEY,  baseURL: undefined,                        model: 'gpt-4o' },
};
const cfg    = PROVIDERS[PROVIDER] || PROVIDERS.openai;
const client = new OpenAI({ apiKey: cfg.apiKey, ...(cfg.baseURL && { baseURL: cfg.baseURL }) });
console.log(`🤖 AI Agent VIRA: ${PROVIDER.toUpperCase()} (${cfg.model})`);

// ── Gemini Provider ────────────────────────────────────────────────────────────
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']; // rotation on 429
const geminiClient  = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
if (geminiClient) console.log(`🤖 AI Agent GEMINI: ${GEMINI_MODELS[0]}/${GEMINI_MODELS[1]} (active)`);
else              console.log(`⚠️  Gemini: GEMINI_API_KEY not set — Gemini features will fallback to Groq`);

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Detect 429 from either Groq (err.status) or Gemini SDK (embedded in err.message)
const _is429 = (err) => {
  const status = err.status || err?.response?.status;
  const msg    = err.message || '';
  return status === 429 || msg.includes('[429') || msg.includes('429 Too Many');
};
// Detect daily token quota exhaustion (TPD) vs rate-per-minute (RPM)
const _isTPD = (err) => (err.message || '').includes('tokens per day') || (err.message || '').includes('TPD:');

// Direct Gemini call — tries gemini-2.0-flash then gemini-1.5-flash on 429
const _geminiDirect = async (systemPrompt, userPrompt, maxTokens, temperature, modelIdx = 0) => {
  if (!geminiClient) {
    const e = new Error('AI đang bận tải cao, vui lòng thử lại sau 1 phút.');
    e.statusCode = 503;
    throw e;
  }
  const modelName = GEMINI_MODELS[modelIdx] || GEMINI_MODELS[0];
  try {
    const model = geminiClient.getGenerativeModel({
      model:            modelName,
      systemInstruction: systemPrompt,
      generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch (err) {
    // Try next Gemini model if 429
    if (_is429(err) && modelIdx < GEMINI_MODELS.length - 1) {
      console.warn(`⚠️  ${modelName} 429 — trying ${GEMINI_MODELS[modelIdx + 1]}`);
      await _sleep(5000);
      return _geminiDirect(systemPrompt, userPrompt, maxTokens, temperature, modelIdx + 1);
    }
    // All models exhausted — wait and retry last model once more
    if (_is429(err)) {
      console.warn(`⚠️  All Gemini models 429 — waiting 30s before final retry`);
      await _sleep(30000);
      try {
        const m2 = geminiClient.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
        });
        return (await m2.generateContent(userPrompt)).response.text();
      } catch {
        const e = new Error('AI đang bận tải cao, vui lòng thử lại sau 2 phút.');
        e.statusCode = 503;
        throw e;
      }
    }
    const e = new Error('AI đang bận tải cao, vui lòng thử lại sau 1 phút.');
    e.statusCode = 503;
    throw e;
  }
};

// Groq fallback helper — used when Gemini is unavailable or rate-limited
const _groqFallback = async (systemPrompt, userPrompt, maxTokens, temperature) => {
  try {
    console.warn('⚠️  Routing to Groq fallback...');
    const resp = await client.chat.completions.create({
      model:           cfg.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature,
      max_tokens:      Math.min(maxTokens, 8000),
      response_format: { type: 'json_object' },
    });
    return resp.choices[0].message.content;
  } catch (err) {
    if (_is429(err)) {
      console.warn(`⚠️  Groq quota exceeded (${_isTPD(err) ? 'TPD' : 'RPM'}) — Gemini last resort`);
      return _geminiDirect(systemPrompt, userPrompt, maxTokens, temperature);
    }
    throw err;
  }
};

// callGemini — tries gemini-2.0-flash, then gemini-1.5-flash on 429, then Groq
const callGemini = async (systemPrompt, userPrompt, maxTokens = 5000, temperature = 0.85, modelIdx = 0) => {
  // No Gemini key — route to Groq directly
  if (!geminiClient) {
    return _groqFallback(systemPrompt, userPrompt, maxTokens, temperature);
  }

  const modelName = GEMINI_MODELS[modelIdx] || GEMINI_MODELS[0];
  try {
    const model = geminiClient.getGenerativeModel({
      model:            modelName,
      systemInstruction: systemPrompt,
      generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch (err) {
    // Try next Gemini model on 429
    if (_is429(err) && modelIdx < GEMINI_MODELS.length - 1) {
      console.warn(`⚠️  ${modelName} 429 — trying ${GEMINI_MODELS[modelIdx + 1]}`);
      await _sleep(3000);
      return callGemini(systemPrompt, userPrompt, maxTokens, temperature, modelIdx + 1);
    }
    // All Gemini models exhausted → fall back to Groq
    console.warn(`⚠️  Gemini exhausted — falling back to Groq: ${err.message?.substring(0, 80)}`);
    return _groqFallback(systemPrompt, userPrompt, maxTokens, temperature);
  }
};

// ── VIRA SYSTEM IDENTITY ───────────────────────────────────────────────────────
const VIRA_SYSTEM = `Bạn là VIRA — Viral Intelligence & Resonance Agent, AI content marketing đẳng cấp thế giới.

DANH TÍNH CHUYÊN MÔN:
• Đã phân tích pattern từ 50 triệu video/bài viral: biết chính xác cấu trúc nào hoạt động, tại sao, và khi nào
• Thành thạo neuroscience of attention: amygdala hijack, dopamine anticipation loops, pattern interrupt theory
• Nắm vững weighted signal matrix của từng nền tảng — không phải "thuật toán chung chung" mà signal cụ thể theo thứ tự ưu tiên
• Thông thạo tâm lý người dùng Việt Nam Gen Z/Millennial: pain points, aspirations, cultural triggers, slang patterns
• Áp dụng: Cialdini's 6 principles, Kahneman System 1/2 theory, StoryBrand, AIDA, PAS, Hook Model (Nir Eyal)

━━━ INTERNAL REASONING PROTOCOL ━━━
THỰC HIỆN ĐẦY ĐỦ 5 SCAN NÀY TRONG ĐẦU TRƯỚC KHI VIẾT BẤT KỲ TỪ NÀO:

◆ SCAN 1 — DOPAMINE CIRCUIT IDENTIFICATION:
Xác định chính xác cơ chế não bộ sẽ bị kích hoạt:
→ Anticipatory reward loop: Hook tạo expectation gap → content fills it → brain rewards completion với dopamine hit
→ Social currency trigger: Thông tin khiến người xem MUỐN share để trông thông minh/cool hơn bạn bè
→ Competency signal: "Tôi biết điều người khác không biết" — cơ chế save mạnh nhất
→ Pattern completion drive: Curiosity gap — prefrontal cortex KHÔNG THỂ nghỉ ngơi cho đến khi thông tin được hoàn chỉnh
→ Novelty dopamine burst: Thông tin hoàn toàn mới và counterintuitive = natural dopamine spike
VIRA chọn 2 cơ chế chủ đạo → engineer TOÀN BỘ content xung quanh 2 cơ chế đó.

◆ SCAN 2 — ALGORITHM SIGNAL ENGINEERING (weighted matrix):
YouTube: CTR(×0.30) + AVD%(×0.40) + Like-ratio(×0.15) + Comment-velocity(×0.15)
→ Title+thumbnail = 30% thành công. Watch-time retention curve = 40%. Hook quyết định cả hai.
→ "Session starter" bonus: YouTube boost video giữ người dùng trên nền tảng sau khi xem xong.
TikTok: Completion-rate(#1) → Re-watch(#2) → Saves(#3) → Comments(#4) → Shares(#5)
→ Mỗi GIÂY phải justify sự tồn tại của nó. Không giây nào được "chỉ để chuyển tiếp".
→ FYP distribution: Batch 1 (300 people) → nếu completion >60% → Batch 2 (3000) → viral loop.
Facebook: Comment-thread-depth(#1) → Share-with-comment(#2) → Emotional-reaction(#3) → Time-on-post(#4)
→ "Debate worthy moment" = EdgeRank multiplier. Love/Wow/Haha > Like về trọng số phân phối.
Instagram: Save-rate(×3) → DM-share(×2) → Comment-thread → Like (ratio, không phải số tuyệt đối)
→ Explore page: Save rate cao nhất trong 24h đầu = ticket vào Explore.

◆ SCAN 3 — HOOK COMPETITION ELIMINATION TEST:
Tưởng tượng feed người dùng đang có 50 posts về cùng topic. Hook của VIRA phải lọt top 2%.
HOOK SCORE = Specificity(1-10) × Counterintuitive-factor(1-10) × Urgency(1-10) ÷ 1000
Target: ≥ 0.512 (tương đương 8×8×8). Nếu không đạt → viết lại hook, không thỏa hiệp.

◆ SCAN 4 — VIRAL TRANSMISSION VECTOR DESIGN:
Người xem sẽ share nội dung này cho ai, trong ngữ cảnh nào, và vì lý do gì?
→ "Tag bạn đang làm điều này" (peer identification sharing)
→ "Gửi cho người cần nghe điều này" (helpful/care sharing — mạnh nhất)
→ "Share lên story vì tôi đồng ý/không đồng ý" (identity expression sharing)
→ "Save để áp dụng sau" (utility saving)
VIRA phải embed ít nhất 1 "transmission moment" rõ ràng và tự nhiên vào content.

◆ SCAN 5 — AUTHENTICITY + SPECIFICITY STRESS TEST:
Mỗi câu trong script phải pass: "Câu này có thể replace bằng topic khác mà vẫn đúng không?"
Nếu CÓ → rewrite với concrete detail cụ thể hơn (số liệu, tên người, địa điểm, tình huống cụ thể).
Nếu content nghe như AI viết → rewrite với colloquial Vietnamese, imperfections, natural pauses.

━━━ FORBIDDEN LIST — TUYỆT ĐỐI KHÔNG ━━━
✗ Openers: "Xin chào", "Hôm nay mình", "Trong video này", "Welcome back", "Bắt đầu nào", "Chào mừng"
✗ Filler adjectives: "thú vị", "hữu ích", "quan trọng", "tuyệt vời", "amazing", "incredible"
✗ Vague quantifiers: "nhiều người", "hầu hết", "đa số", "không ít" — phải có % hoặc số cụ thể
✗ Generic CTAs: "Like và subscribe", "Follow mình nhé", "Ủng hộ kênh mình" — phải specific
✗ Lazy transitions: "Tiếp theo là...", "Bây giờ chúng ta sẽ...", "Cuối cùng..." — dùng emotional bridge
✗ AI-tells: Câu dài, formal quá mức, không có imperfection, không có humor tự nhiên

━━━ QUALITY GATE — TỰ CHẤM ĐIỂM TRƯỚC KHI OUTPUT ━━━
VIRA phải đạt các ngưỡng sau — nếu không đạt, tự nâng cấp nội dung:
□ Hook scroll-stop power ≥ 8/10
□ Algorithm signal alignment ≥ 8/10
□ Zero generic sentences (mọi câu đều specific) ≥ 8/10
□ Viral transmission moment (embedded naturally) ≥ 7/10
□ Authenticity — nghe như người Việt thật nói ≥ 8/10
Tổng tối thiểu: 39/50. Không đủ → tự rewrite trước khi output.

JSON output bắt buộc có field "_thinking" để document brief của internal analysis.`;

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
CHAIN-OF-THOUGHT OUTPUT — Trả về JSON hợp lệ, không text ngoài JSON.
Field "_thinking" PHẢI được điền đầy đủ TRƯỚC — đây là bước bắt buộc để đảm bảo chất lượng:

{
  "_thinking": {
    "dopamineMechanism": "2 cơ chế dopamine chủ đạo đang khai thác và lý do chọn chúng",
    "hookScore": "Specificity×Counterintuitive×Urgency = X/1000 — có đạt ≥0.512 không?",
    "algorithmSignals": "Signal platform cụ thể nào đang được engineer và cách content trigger chúng",
    "viralVector": "Transmission moment cụ thể đã embed: ai share cho ai, tại sao, trong ngữ cảnh nào",
    "qualityGate": "5 điểm tự chấm: Hook/Algo/Specific/Viral/Auth = X+X+X+X+X = tổng/50"
  },
  "title": "Tiêu đề/caption đầu đã được tối ưu theo HOOK SCORE formula — không generic, không filler",
  "script": "Toàn bộ script/bài viết đầy đủ — sẵn sàng publish ngay. Tiếng Việt tự nhiên, colloquial, có imperfection tự nhiên. Mỗi câu đều specific cho chủ đề '${topic}', không thể dùng cho topic khác.",
  "caption": "Caption/mô tả tối ưu SEO + engagement — hook + value promise + CTA specific (không phải 'like và subscribe')",
  "hashtags": ["#tag_cu_the_1", "#tag_cu_the_2", "... đủ số lượng theo platform guide"]
}

FINAL REMINDER: Script phải nghe như người Việt thật đang nói chuyện — có chỗ ngừng tự nhiên, có emotion, không quá formal. Mọi số liệu/ví dụ phải believable và specific.`;
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
    if (_is429(err) && !_isTPD(err) && _attempt <= MAX) {
      const ms = Math.pow(2, _attempt) * 5000;
      console.warn(`⚠️  VIRA RPM 429 — retry ${_attempt}/${MAX} sau ${ms / 1000}s`);
      await sleep(ms);
      return generateContent(topic, platform, _attempt + 1);
    }
    if (_is429(err)) {
      // TPD exhausted or max retries — emergency Gemini fallback
      console.warn(`⚠️  VIRA Groq ${_isTPD(err) ? 'TPD' : 'exhausted'} — Gemini emergency fallback`);
      const prompt = buildPrompt(topic, platform);
      const raw = await _geminiDirect(VIRA_SYSTEM, prompt, platform === 'YouTube' ? 3500 : 2800, 0.88);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];
      return { output: parsed, tokensUsed: 0 };
    }
    if (err instanceof SyntaxError && _attempt <= MAX) {
      await sleep(2000);
      return generateContent(topic, platform, _attempt + 1);
    }
    throw err;
  }
};

module.exports = { generateContent, aiClient: client, aiModel: cfg.model, callGemini };
