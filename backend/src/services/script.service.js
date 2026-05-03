const { aiClient, aiModel, aiModelFallback, callGemini } = require('./ai.service');

// YouTube 10/15min scripts route to Gemini (long-form, needs larger context)
const GEMINI_DURATIONS = new Set(['10 phút', '15 phút']);
const Script = require('../models/Script.model');
const User   = require('../models/User.model');

// ── SCRIPTA Agent Identity ────────────────────────────────────────────────────

const SCRIPTA_SYSTEM = `Bạn là SCRIPTA — Master Screenwriter & Director Agent, AI biên kịch đẳng cấp thế giới.

DANH TÍNH & NĂNG LỰC:
• Biên kịch cho 500+ video triệu view — nắm rõ pattern nào hoạt động trên từng platform, tại sao, ở giây nào
• Neuroscience of attention: amygdala response timing (0.07s), anterior cingulate cortex engagement, dopamine drip engineering
• Thành thạo: Hollywood 3-Act + Save the Cat beat sheet + Dan Harmon Story Circle + 5-Act Dramatic Structure — áp dụng cho short/long form
• Platform algorithm mastery: YouTube (watch-time curve dips tại 30%, 50%, 70% — phải "bom tò mò" ở đó), TikTok (re-watch trigger = loop ending), Facebook (comment-depth engineering)
• Cinematic language fluency: 180-degree rule, J/L cuts, Dutch angle cho dramatic moments, rack focus cho revelation scenes

━━━ SCENE ENGINEERING PROTOCOL ━━━
SCRIPTA PHẢI THỰC HIỆN 6 BƯỚC NÀY CHO MỖI SCENE TRƯỚC KHI VIẾT:

◆ BƯỚC 1 — ATTENTION CURVE MAPPING:
Với scene này trong toàn bộ video, người xem đang ở đâu trên attention curve?
→ 0-15s: Curiosity peak — dễ mất attention nhất, hook PHẢI deliver ngay
→ 30-45s: First drop — cần "loop anchor" (hé lộ một phần của secret, giữ lại phần còn lại)
→ 60-90s: Engagement trough — cần pattern interrupt (đổi nhịp, thay đổi visual, shocking fact)
→ Mid-point: Retention valley — cần "value bomb" lớn nhất hoặc emotional peak
→ Last 20%: Completion motivation — cần teased payoff được đề cập từ đầu

◆ BƯỚC 2 — PSYCHOLOGICAL TRIGGER SELECTION:
Chọn trigger phù hợp nhất cho scene này từ menu:
→ Curiosity gap (Zeigarnik effect): Mở một câu hỏi, KHÔNG đóng lại ngay
→ Social proof cascade: Số liệu + tên người thật + kết quả cụ thể = credibility stack
→ Loss aversion (2.5× stronger than gain): "Bạn đang MẤT X mỗi ngày vì không biết điều này"
→ Authority bias: Citation của nghiên cứu/chuyên gia (dù paraphrase) = instant credibility
→ Reciprocity trigger: Give extreme value first → viewer feels obligated to engage
→ Scarcity + exclusivity: "Thông tin này không được dạy ở đâu" / "Ít người biết điều này"
→ Pattern interrupt: Thay đổi hoàn toàn nhịp/tone/visual khi attention đang giảm

◆ BƯỚC 3 — DIALOGUE AUTHENTICITY CHECK:
Mỗi câu thoại phải pass:
1. "Một người thật có nói câu này trong conversation không?" — nếu không → rewrite
2. "Câu này chứa ít nhất 1 concrete detail (số, tên, tình huống cụ thể) không?" — nếu không → add detail
3. "Câu này có thể belong to topic khác không?" — nếu có → make it topic-specific

◆ BƯỚC 4 — CINEMATIC INTENT:
Direction không phải là "ghi chú thêm" — direction QUY ĐỊNH 40% emotional impact của scene.
→ Close-up: Intimacy, vulnerability, credibility
→ Wide shot: Scale, isolation, context establishment
→ Dutch angle (±15°): Psychological unease, something is "wrong"
→ Slow zoom in: Building tension, revelation approaching
→ Jump cut: Energy, urgency, TikTok native feel
→ Rack focus: Shift attention from problem to solution

◆ BƯỚC 5 — ALGORITHM CONTRIBUTION:
Scene này trigger signal gì cho thuật toán?
→ Re-watch trigger: Thông tin cực dense → người ta rewind để nghe lại (TikTok #1 signal)
→ Save trigger: Insight quá giá trị để nhớ hết 1 lần (Instagram/TikTok saves)
→ Comment trigger: Statement gây tranh cãi hoặc question dễ trả lời
→ Share trigger: "Tôi phải gửi cái này cho [specific person]" moment
→ Watch-time hold: Open loop không được đóng → người xem không thể bỏ đi

◆ BƯỚC 6 — CONTINUITY HOOK:
Scene KHÔNG được kết thúc "phẳng". Phải có 1 trong:
→ Open question: Câu hỏi chưa được trả lời
→ Teased revelation: "Nhưng cái tôi sắp nói tiếp mới là phần quan trọng nhất..."
→ Partial information: Đưa ra A, hứa B sẽ đến trong scene tiếp
→ Emotional tension: Cảm xúc chưa được giải quyết — não BẮT BUỘC phải tiếp tục

━━━ FORBIDDEN LIST ━━━
✗ "Xin chào", "Hôm nay mình", "Trong video này", "Welcome back", "Bắt đầu nào"
✗ Scenes không có psychological trigger cụ thể — mọi scene đều phải có mục đích tâm lý
✗ Direction vague: "nhìn vào camera" / "nói với năng lượng" — không đủ cụ thể
✗ Dialogue generic: câu nào có thể dùng cho topic khác → rewrite ngay
✗ Scene kết thúc "phẳng" không có continuity hook

━━━ SCRIPTA QUALITY GATE ━━━
Sau khi draft xong toàn bộ kịch bản, SCRIPTA tự evaluate:
□ Hook (scene 1): Scroll-stop power ≥ 8/10
□ Attention curve: Có "bom tò mò" mỗi 60-90s không?
□ Dialogue: 100% authentic, zero generic sentences
□ Direction: Đủ cụ thể để cameraman thực hiện ngay
□ Algorithm signals: ≥3 loại signal khác nhau được trigger
□ Overlay: Đọc chỉ overlay (không âm thanh) vẫn hiểu được 70% nội dung

Output: JSON hợp lệ có field "_scriptingStrategy" cho chain-of-thought reasoning.`;

// ── Platform-specific prompts ─────────────────────────────────────────────────

const buildYouTubePrompt = (topic, duration, style) => {
  const sceneCount = { '5 phút': 7, '10 phút': 10, '15 phút': 13 }[duration] || 7;
  const maxTokens  = { '5 phút': 4000, '10 phút': 4500, '15 phút': 5000 }[duration] || 4000;

  const styleGuide = {
    storytelling: `STORYTELLING MODE — Narrative Engineering:
    • Mở bằng cảnh in medias res (giữa chừng câu chuyện, đang xảy ra căng thẳng)
    • Xây dựng emotional stakes rõ ràng trong 60 giây đầu: tại sao người xem phải quan tâm?
    • Sử dụng "moment of vulnerability" để tạo connection sâu
    • Pattern: Hook Story → Stakes Setting → Journey Begin → Obstacles → Revelation → Resolution → Lesson + CTA
    • Mỗi act kết thúc bằng cliffhanger nhỏ giữ watch-time`,
    tutorial: `TUTORIAL MODE — Authority & Value Engineering:
    • Mở bằng result preview (cho xem kết quả cuối trước) → tạo dopamine anticipation
    • "Bằng chứng xác thực" trong 30 giây: con số cụ thể, kết quả thực tế, social proof
    • Cấu trúc: Problem agitation → Promise → Proof → Process (step-by-step) → Payoff
    • Mỗi step phải có micro-win: người xem cảm thấy có thể làm được ngay
    • Pattern interrupt mỗi 2 phút: câu hỏi bất ngờ, sự thật phản trực giác, case study shock`,
    listicle: `LISTICLE MODE — Curiosity Gap Engineering:
    • Announce số lượng items ngay đầu + tease item shock nhất (không phải item 1)
    • "Item #X sẽ làm bạn ngạc nhiên nhất" — tạo reason to watch till end
    • Mỗi item: Title → Shock stat/fact → Explanation → Ví dụ cụ thể → Mini-transition
    • Escalating value: item sau phải "giá trị hơn" hoặc "bất ngờ hơn" item trước
    • Cuối: "Bonus item" không được đề cập trước — reward cho người xem hết`,
    review: `REVIEW MODE — Verdict Engineering:
    • Mở bằng controversial verdict ngay (không build-up dài dòng)
    • Establish credibility cụ thể: "Tôi đã dùng X trong Y tháng / bỏ Z tiền mua"
    • Pattern: Verdict → Evidence → Counterargument → Final verdict với nuance
    • So sánh "before/after" hoặc "vs competitor" với data cụ thể
    • Cuối: recommendation rõ ràng cho từng loại người xem khác nhau`,
  }[style] || `Tutorial mode với value engineering và authority building`;

  return {
    prompt: `Tạo KỊCH BẢN VIDEO YOUTUBE ĐẲNG CẤP THẾ GIỚI cho chủ đề: "${topic}"
Thời lượng: ${duration} | Phong cách: ${styleGuide}

NHIỆM VỤ SCRIPTA:
Viết kịch bản với ${sceneCount} scenes, mỗi scene được engineering kỹ lưỡng để maximize watch-time retention.
Hook phải nằm trong TOP 5% nội dung viral YouTube — không chấp nhận hook trung bình.
Lời thoại phải tự nhiên như đang nói chuyện thật, không phải đọc bài.

CHI TIẾT BẮT BUỘC TRONG TỪNG SCENE:
- "psychTrigger": Tên cụ thể của cơ chế tâm lý (VD: "Curiosity Gap + FOMO", "Pattern Interrupt", "Social Proof Cascade")
- "retentionRole": Scene này giữ/lấy lại attention như thế nào?
- Script phải dài đủ (scene content tối thiểu 80-120 từ, hook tối thiểu 30-40 từ)
- Direction phải cụ thể đến mức cameraman không cần hỏi thêm

CHAIN-OF-THOUGHT JSON — điền "_scriptingStrategy" TRƯỚC, sau đó mới viết scenes:
{
  "_scriptingStrategy": {
    "narrativeEngine": "Cấu trúc narrative đang dùng (3-Act / Story Circle / Save the Cat beat) và lý do chọn",
    "attentionCurveMap": "Mô tả attention curve dự kiến và 'bom tò mò' được đặt ở đâu (giây nào)",
    "dominantTriggers": "2-3 psychological triggers chủ đạo xuyên suốt kịch bản và lý do",
    "algorithmStrategy": "Platform signals nào được engineer và qua scene nào cụ thể",
    "qualityGateScore": "Hook/Dialogue/Direction/Algorithm/Overlay = X/X/X/X/X tổng /50"
  },
  "title": "Tiêu đề YouTube 55-65 ký tự, trigger word bắt buộc (Sự thật / Bí mật / Cảnh báo / Tại sao / Đừng / X điều), VIẾT HOA từ quan trọng",
  "totalDuration": "${duration}",
  "scenes": [
    {
      "id": 1,
      "name": "TÊN CẢNH VIẾT HOA — mô tả chức năng tâm lý (VD: ZEIGARNIK HOOK / LOSS-AVERSION AGITATION / AUTHORITY BUILD / PATTERN INTERRUPT / DOPAMINE PAYOFF CTA)",
      "timestamp": "00:00 - 00:20",
      "duration": "20 giây",
      "type": "hook",
      "psychTrigger": "Trigger cụ thể: tên cơ chế tâm lý + lý do hiệu quả cho scene này",
      "retentionRole": "Scene giữ/rebuild attention bằng cơ chế cụ thể nào, bridge sang scene tiếp ra sao",
      "script": "Lời thoại đầy đủ, authentic, từng câu hoàn chỉnh. Tối thiểu 80-120 từ cho content scenes, 30-40 từ cho hook. Tiếng Việt tự nhiên colloquial — có thể nói ngay không cần chỉnh. KHÔNG có câu generic hay placeholder.",
      "direction": "Góc máy: [loại shot cụ thể + lý do emotional]. Ánh sáng: [setup cụ thể]. Movement: [static/pan/zoom + tempo]. Expression: [chính xác]. B-roll: [cảnh cut-away cụ thể nếu cần].",
      "overlay": "Text overlay chính xác + khi nào xuất hiện/biến mất + typography style (bold/color) + mục đích (cho người xem tắt tiếng)"
    }
  ],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "productionTips": [
    "Tip quay/dựng QUAN TRỌNG NHẤT để tối ưu YouTube watch-time algorithm cho video này",
    "Thumbnail engineering: màu sắc, expression, text overlay, curiosity gap cụ thể",
    "Posting strategy: timing + first-hour engagement seeding + community tab cross-promotion"
  ]
}`,
    maxTokens,
  };
};

const buildTikTokPrompt = (topic, duration, style) => {
  const sceneCount = { '30 giây': 5, '60 giây': 7, '90 giây': 9 }[duration] || 7;
  const maxTokens  = 3000;

  const styleGuide = {
    tutorial: `TUTORIAL MODE — TikTok Learn Formula:
    • Giây 0-2: Shock result / Unbelievable fact → "Không ai nói với bạn điều này về [topic]"
    • Giây 2-5: Promise cụ thể → "Làm theo đúng 3 bước này, kết quả trong 24h"
    • Mỗi step: 1 hành động = 1 shot = tối đa 3 giây
    • Phải có "Save this!" moment: thông tin quá dense, quá giá trị → buộc phải lưu
    • Cuối: Kết quả cụ thể + prompt để comment (controversy hoặc curiosity)`,
    story: `STORY MODE — POV Emotional Journey:
    • Giây 0-2: In medias res — đang ở giữa tình huống cao trào, không giải thích
    • Build tension qua micro-expressions và environment cues, không exposition dài
    • Phải có TWIST: không đoán được từ đầu, nhưng nhìn lại thấy hoàn toàn logic
    • Emotional payoff phải đủ mạnh để người xem PHẢI comment và tag bạn bè
    • POV framing: người xem = nhân vật, không phải observer`,
    trending: `TRENDING MODE — Algorithm Surfing:
    • Áp dụng sound viral hiện tại với lip-sync hoặc reaction timing chính xác
    • Trend format + original twist unique = viral recipe
    • Transition phải "satisfying" — trigger re-watch instinctively
    • Stitch/Duet bait: tạo nội dung người khác muốn react/respond
    • Comment bait cuối: câu hỏi chia đội, "Team A hay Team B?"`,
    skit: `SKIT MODE — Character Comedy Engineering:
    • Nhân vật phải có distinct personality trong 2 giây — không cần giới thiệu
    • Setup → Escalation → Subverted Expectation → Punch line phải hit trong 3 giây cuối
    • Relatable situation + absurd twist = share-worthy formula
    • Facial expression và body language = 70% của comedy — direction phải siêu cụ thể
    • Tag-bait ending: "Tag người bạn biết y hệt thế này"`,
  }[style] || `Tutorial mode với TikTok Learn formula`;

  return {
    prompt: `Tạo KỊCH BẢN TIKTOK TRIỆU VIEW cho chủ đề: "${topic}"
Thời lượng: ${duration} | Phong cách: ${styleGuide}

NHIỆM VỤ SCRIPTA:
${sceneCount} scenes, mỗi scene tối đa 2-4 giây — tốc độ TikTok không cho phép shot dài hơn.
Hook 0-2 giây phải nằm trong TOP 3% TikTok hook chất lượng.
40% người xem TikTok không bật âm → overlay text phải kể được câu chuyện đầy đủ.

CHI TIẾT BẮT BUỘC:
- "scrollStopper": Yếu tố cụ thể khiến ngón tay dừng lại trong scene này
- Transition giữa scenes phải "satisfying" — ghi rõ loại transition
- Script ngắn, mạnh — từng từ phải có tác dụng

Trả về JSON hợp lệ:
{
  "title": "Caption TikTok tối đa 100 ký tự: hook sentence + emoji + câu hỏi hoặc cliffhanger để tăng comment",
  "totalDuration": "${duration}",
  "scenes": [
    {
      "id": 1,
      "name": "TÊN CẢNH (SCROLL STOPPER HOOK / PROMISE / STEP 1 / SAVE-WORTHY MOMENT / PATTERN INTERRUPT / VIRAL TWIST / COMMENT BAIT CTA)",
      "timestamp": "0:00 - 0:03",
      "duration": "3 giây",
      "type": "hook",
      "scrollStopper": "Yếu tố cụ thể giữ/lấy lại attention trong scene này",
      "script": "Lời nói/hành động chính xác từng từ — ngắn, punch, không có từ thừa",
      "direction": "Góc máy [cụ thể] + Movement [cụ thể] + Transition vào/ra [cụ thể] + Expression [cụ thể]",
      "overlay": "Text overlay chính xác + emoji + xuất hiện lúc nào trong scene"
    }
  ],
  "hashtags": ["#xuhuong", "#viral", "#fyp", "#LearnOnTikTok", "#foryou", "#trending"],
  "productionTips": [
    "Tip về lighting/setup cụ thể nhất để tăng watch-time TikTok",
    "Tip về sound selection để maximize FYP distribution",
    "Tip về posting time và engagement strategy đầu 30 phút"
  ]
}`,
    maxTokens,
  };
};

const buildFacebookPrompt = (topic, duration, style) => {
  const maxTokens = { 'Bài viết': 2500, 'Reel 60 giây': 3000, 'Video 5 phút': 4000 }[duration] || 2500;

  const styleGuide = {
    storytelling: `STORYTELLING MODE — Facebook Emotional Cascade:
    • Dòng đầu tiên (trước "Xem thêm"): phải gây SHOCK hoặc tạo CURIOSITY GAP không thể cưỡng lại
    • 50 từ đầu tiên = make or break — phải chứa emotional hook và promise
    • Cấu trúc cảm xúc: Shock → Đồng cảm → Tension → Relief/Insight → Inspiration → Call to Action
    • "Twist moment" ở đoạn giữa: sự thật bất ngờ đảo lộn nhận thức
    • Câu hỏi cuối phải chia đội hoặc chạm vào điều ai cũng có ý kiến`,
    educational: `EDUCATIONAL MODE — Value Bomb Engineering:
    • Mở bằng counterintuitive insight: điều ngược với common knowledge
    • Structure: Myth Bust → True Insight → Proof → Application → Actionable Tip
    • Mỗi đoạn có 1 "quotable moment" — câu người ta muốn copy-paste chia sẻ
    • Data và con số cụ thể tạo authority — không dùng "nhiều", "ít", "thường"
    • Kết với câu hỏi kích thích debate: "Bạn nghĩ cách nào hiệu quả hơn?"`,
    motivational: `MOTIVATIONAL MODE — Transformation Story Engineering:
    • Mở bằng universal pain point: điều mà 80% người đọc đang cảm thấy ngay lúc này
    • Journey: Đau → Nhận ra → Thay đổi → Kết quả cụ thể (không mơ hồ)
    • Dùng "bạn" liên tục — tạo cảm giác đang nói riêng với từng người
    • Moment of raw honesty: chia sẻ thất bại thật → tạo credibility và connection
    • CTA không phải "like/share" mà là hành động cụ thể thay đổi được cuộc sống`,
  }[style] || `Storytelling mode với emotional cascade engineering`;

  return {
    prompt: `Tạo KỊCH BẢN/NỘI DUNG FACEBOOK VIRAL LEVEL cho chủ đề: "${topic}"
Định dạng: ${duration} | Phong cách: ${styleGuide}

NHIỆM VỤ SCRIPTA:
Facebook thuật toán 2024 reward: comment threads dài, shares với comment, time-on-page cao.
Nội dung phải engineering để trigger TẤT CẢ 3 signals này.
Dòng đầu tiên là TÀI SẢN QUAN TRỌNG NHẤT — viết như thể đây là câu duy nhất người ta đọc.

CHI TIẾT BẮT BUỘC:
- "emotionalBeat": Cảm xúc đang được kỹ thuật khai thác trong scene/đoạn này
- "algorithmSignal": Tín hiệu thuật toán Facebook nào đang được tối ưu
- Script phải viết được đăng lên Facebook ngay — không phải outline hay gợi ý

Trả về JSON hợp lệ:
{
  "title": "Dòng đầu tiên của bài — 1 câu, tối đa 15 từ, PHẢI gây shock hoặc curiosity gap cực mạnh, KHÔNG được bắt đầu bằng 'Xin chào' hay 'Hôm nay'",
  "totalDuration": "${duration}",
  "scenes": [
    {
      "id": 1,
      "name": "TÊN ĐOẠN (SCROLL-STOPPING HOOK / EMOTIONAL SETUP / TENSION BUILD / TWIST REVELATION / VALUE BOMB / DEBATE-TRIGGER CTA)",
      "timestamp": "Đoạn 1",
      "duration": "~60-80 từ",
      "type": "hook",
      "emotionalBeat": "Cảm xúc cụ thể đang được khai thác: Shock / Đồng cảm / Tò mò / Hứng khởi / Tức giận tích cực",
      "algorithmSignal": "Tín hiệu thuật toán: Comment trigger / Share trigger / Time-on-page / Emotional reaction",
      "script": "Nội dung đầy đủ của đoạn này — viết như bài thực sự đăng lên Facebook. Mỗi câu có mục đích. Ngôn ngữ tự nhiên, đời thường, chân thật. Tối thiểu 60 từ cho đoạn content chính.",
      "direction": "Ảnh/video kèm theo gợi ý: [mô tả cụ thể]. Emoji nên dùng: [cụ thể]. Format: [paragraph / bullet / mixed]",
      "overlay": "Caption ngắn nếu đăng kèm ảnh/video — tối đa 10 từ, punch line"
    }
  ],
  "hashtags": ["#cuocsong", "#kinhnghiem", "#succes", "#motivation", "#vietnam"],
  "productionTips": [
    "Tip về thời điểm đăng và cách seed engagement trong 1h đầu",
    "Tip về visual/thumbnail nếu là video/reel",
    "Tip về reply comment strategy để boost phân phối"
  ]
}`,
    maxTokens,
  };
};

// ── AI call — routes to Gemini (long YT) or Groq (everything else) ───────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const _isTPD = (err) => (err.message || '').includes('tokens per day') || (err.message || '').includes('TPD:');

const callGroq = async (prompt, maxTokens, attempt = 1, useSmallModel = false) => {
  const model = useSmallModel ? aiModelFallback : aiModel;
  try {
    const resp = await aiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SCRIPTA_SYSTEM },
        { role: 'user',   content: prompt },
      ],
      temperature:     0.88,
      max_tokens:      maxTokens,
      response_format: { type: 'json_object' },
    });
    return resp.choices[0].message.content;
  } catch (err) {
    const msg429 = (err.message || '').toLowerCase();
    const is429  = (err.status || err?.response?.status || err?.httpStatus) === 429
      || msg429.includes('[429') || msg429.includes('429 too many') || msg429.includes('resource_exhausted')
      || msg429.includes('quota exceeded') || msg429.includes('rate_limit') || msg429.includes('too many requests');
    // TPD on primary model — try 8b fallback (750K TPD)
    if (is429 && _isTPD(err) && !useSmallModel) {
      console.warn(`⚠️  SCRIPTA ${aiModel} TPD — trying ${aiModelFallback} (750K TPD)`);
      return callGroq(prompt, maxTokens, 1, true);
    }
    // RPM — retry with backoff
    if (is429 && !_isTPD(err) && attempt <= 2) {
      const wait = attempt * 8000;
      console.warn(`⚠️  SCRIPTA Groq RPM 429 — retry ${attempt}/2 sau ${wait / 1000}s`);
      await sleep(wait);
      return callGroq(prompt, maxTokens, attempt + 1, useSmallModel);
    }
    if (is429) {
      console.warn('⚠️  SCRIPTA Groq exhausted — Gemini fallback');
      return callGemini(SCRIPTA_SYSTEM, prompt, maxTokens, 0.88);
    }
    throw err;
  }
};

// Returns raw JSON string — provider-agnostic
const callAI = async (prompt, maxTokens, platform, duration) => {
  if (platform === 'YouTube' && GEMINI_DURATIONS.has(duration)) {
    // Gemini for long-form YouTube (10-15min) — needs large context + deep reasoning
    return callGemini(SCRIPTA_SYSTEM, prompt, maxTokens, 0.88);
  }
  // Groq for all short/medium scripts — faster generation (now returns raw string)
  return callGroq(prompt, maxTokens);
};

// ── Main generator ────────────────────────────────────────────────────────────

const generateScript = async (userId, topic, platform, duration, style) => {
  const user = await User.findById(userId);
  if (user.plan === 'free' && user.credits <= 0) {
    const err = new Error('Bạn đã hết lượt dùng miễn phí. Nâng cấp lên Pro để tiếp tục.');
    err.statusCode = 403;
    throw err;
  }

  const builders = { YouTube: buildYouTubePrompt, TikTok: buildTikTokPrompt, Facebook: buildFacebookPrompt };
  const builder  = builders[platform];
  if (!builder) {
    const err = new Error('Platform không hỗ trợ');
    err.statusCode = 400;
    throw err;
  }

  const { prompt, maxTokens } = builder(topic, duration, style);
  // callAI routes: YouTube 10/15min → Gemini, everything else → Groq
  const raw = await callAI(prompt, maxTokens, platform, duration);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = new Error('AI trả về dữ liệu không hợp lệ, thử lại.');
    err.statusCode = 502;
    throw err;
  }

  if (!parsed.title || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    const err = new Error('Kịch bản không đầy đủ, thử lại.');
    err.statusCode = 502;
    throw err;
  }

  if (!Array.isArray(parsed.hashtags))       parsed.hashtags       = [];
  if (!Array.isArray(parsed.productionTips)) parsed.productionTips = [];

  const script = await Script.create({
    userId,
    topic,
    platform,
    duration,
    style,
    output:     parsed,
    tokensUsed: 0,
  });

  if (user.plan === 'free') {
    await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } });
  }

  return script;
};

const getHistory = async (userId, page = 1, limit = 8, platform = null) => {
  const skip  = (page - 1) * limit;
  const query = { userId };
  if (platform) query.platform = platform;

  const [items, total] = await Promise.all([
    Script.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-tokensUsed'),
    Script.countDocuments(query),
  ]);

  return { items, pagination: { total, page, totalPages: Math.ceil(total / limit), hasNext: page * limit < total } };
};

const deleteOne = async (userId, scriptId) => {
  const script = await Script.findOne({ _id: scriptId, userId });
  if (!script) {
    const err = new Error('Không tìm thấy kịch bản');
    err.statusCode = 404;
    throw err;
  }
  await script.deleteOne();
};

const toggleFavorite = async (userId, scriptId) => {
  const script = await Script.findOne({ _id: scriptId, userId });
  if (!script) {
    const err = new Error('Không tìm thấy kịch bản');
    err.statusCode = 404;
    throw err;
  }
  script.isFavorite = !script.isFavorite;
  await script.save();
  return { isFavorite: script.isFavorite };
};

module.exports = { generateScript, getHistory, deleteOne, toggleFavorite };
