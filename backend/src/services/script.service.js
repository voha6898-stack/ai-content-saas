const { aiClient, aiModel } = require('./ai.service');
const Script = require('../models/Script.model');
const User   = require('../models/User.model');

// ── Prompts theo platform ─────────────────────────────────────────────────────

const buildYouTubePrompt = (topic, duration, style) => {
  const sceneCount = { '5 phút': 6, '10 phút': 9, '15 phút': 12 }[duration] || 6;
  const maxTokens  = { '5 phút': 3500, '10 phút': 4000, '15 phút': 4500 }[duration] || 3500;

  const styleGuide = {
    storytelling: 'Kể chuyện cá nhân — bắt đầu bằng trải nghiệm thực tế, dẫn dắt cảm xúc, kết thúc bằng bài học sâu sắc.',
    tutorial:     'Hướng dẫn từng bước — rõ ràng, có ví dụ thực tế, dễ làm theo, kèm mẹo nâng cao.',
    listicle:     'Top danh sách — đánh số từng điểm, mỗi điểm có tiêu đề hấp dẫn và ví dụ cụ thể.',
    review:       'Đánh giá/So sánh — trình bày ưu nhược điểm rõ ràng, dẫn chứng thực tế, kết luận mạnh.',
  }[style] || styleGuide.tutorial;

  return {
    prompt: `Bạn là biên kịch YouTube chuyên nghiệp Việt Nam với 10 năm kinh nghiệm tạo video triệu view.
Tạo KỊCH BẢN VIDEO YOUTUBE CHUYÊN SÂU cho chủ đề: "${topic}"
Thời lượng: ${duration} | Phong cách: ${styleGuide}

QUY TẮC BẮT BUỘC:
- Script là LỜI THOẠI THỰC TẾ — từng câu hoàn chỉnh, nói được ngay
- KHÔNG dùng "Xin chào mọi người" hay "Hôm nay mình sẽ"
- Hook 15 giây đầu phải gây shock hoặc tạo câu hỏi không thể không xem tiếp
- Mỗi scene có timestamp chính xác, tính liên tục
- Ngôn ngữ tự nhiên, tiếng Việt đời thường, gen Z friendly
- Có ${sceneCount} scenes với đủ các loại: hook, problem, tease, content (nhiều nhất), cta, outro

Trả về JSON ĐÚNG định dạng sau (không thêm text ngoài JSON):
{
  "title": "Tiêu đề video viral 55-65 ký tự, VIẾT HOA chữ đầu mỗi từ quan trọng",
  "totalDuration": "${duration}",
  "scenes": [
    {
      "id": 1,
      "name": "TÊN CẢNH (vd: HOOK, VẤN ĐỀ, HỨA HẸN, ĐIỂM 1, ĐIỂM 2, CAO TRÀO, CTA, OUTRO)",
      "timestamp": "00:00 - 00:15",
      "duration": "15 giây",
      "type": "hook",
      "script": "Lời thoại đầy đủ từng câu, dài ít nhất 3-5 câu cho mỗi scene content",
      "direction": "Ghi chú cách quay/diễn xuất/góc máy/ánh sáng",
      "overlay": "Text hiển thị trên màn hình hoặc đồ họa cần thêm"
    }
  ],
  "hashtags": ["#tag1", "#tag2"],
  "productionTips": ["Mẹo quay/dựng video thực tế tip 1", "Tip 2", "Tip 3"]
}`,
    maxTokens,
  };
};

const buildTikTokPrompt = (topic, duration, style) => {
  const sceneCount = { '30 giây': 4, '60 giây': 6, '90 giây': 8 }[duration] || 6;
  const maxTokens  = 2500;

  const styleGuide = {
    tutorial:     'Hướng dẫn nhanh — mỗi bước cực ngắn, có visual rõ ràng, info-dense.',
    story:        'Câu chuyện/POV — relatable, twist bất ngờ, kết thúc gây cảm xúc mạnh.',
    trending:     'Theo trend — áp dụng trend TikTok hiện tại, sound viral, transition mượt.',
    skit:         'Kịch ngắn hài hước — nhân vật rõ ràng, tình huống buồn cười, punch line cuối.',
  }[style] || styleGuide.tutorial;

  return {
    prompt: `Bạn là TikToker Việt Nam chuyên nghiệp với 5 triệu followers.
Tạo KỊCH BẢN TIKTOK PHÂN CẢNH CHI TIẾT cho chủ đề: "${topic}"
Thời lượng: ${duration} | Phong cách: ${styleGuide}

QUY TẮC BẮT BUỘC:
- Mỗi dòng script = 1 hành động/câu nói (tối đa 2-3 giây mỗi shot)
- Giây 0-2: HOOK TUYỆT ĐỐI — không được bắt đầu bằng "Xin chào" hay giới thiệu
- Phải có "save-worthy moment" — thông tin quá giá trị khiến người xem muốn lưu lại
- Ngôn ngữ gen Z, slang tự nhiên, emoji trong overlay
- Có ${sceneCount} scenes, thời gian cộng dồn đúng với ${duration}

Trả về JSON ĐÚNG định dạng sau:
{
  "title": "Caption TikTok viral tối đa 100 ký tự, có emoji, kết bằng câu hỏi hoặc cliffhanger",
  "totalDuration": "${duration}",
  "scenes": [
    {
      "id": 1,
      "name": "TÊN CẢNH (HOOK / SETUP / ĐIỂM 1 / SAVE-WORTHY / TWIST / CTA)",
      "timestamp": "0:00 - 0:03",
      "duration": "3 giây",
      "type": "hook",
      "script": "Lời nói/hành động chính xác từng từ",
      "direction": "Camera: góc quay, movement, transition effect nên dùng",
      "overlay": "Text overlay + emoji hiển thị trên màn hình"
    }
  ],
  "hashtags": ["#xuhuong", "#viral", "#fyp", "#LearnOnTikTok"],
  "productionTips": ["Tip quay TikTok 1", "Tip 2", "Tip 3"]
}`,
    maxTokens,
  };
};

const buildFacebookPrompt = (topic, duration, style) => {
  const maxTokens = { 'Bài viết': 2000, 'Reel 60 giây': 2500, 'Video 5 phút': 3500 }[duration] || 2500;

  const styleGuide = {
    storytelling: 'Kể chuyện cá nhân — mở đầu bằng "hook story", dẫn cảm xúc, bài học sâu sắc.',
    educational:  'Giáo dục/Chia sẻ — thông tin hữu ích, dẫn chứng, actionable tips.',
    motivational: 'Truyền cảm hứng — cảm xúc mạnh, relatable, thúc đẩy hành động.',
  }[style] || styleGuide.storytelling;

  return {
    prompt: `Bạn là chuyên gia content Facebook Marketing Việt Nam với 10 năm kinh nghiệm, đã có hàng trăm bài đạt 10.000+ share.
Tạo KỊCH BẢN FACEBOOK PHÂN ĐOẠN CHI TIẾT cho chủ đề: "${topic}"
Định dạng: ${duration} | Phong cách: ${styleGuide}

QUY TẮC BẮT BUỘC:
- Dòng đầu tiên (trước "Xem thêm") phải kéo người đọc KHÔNG THỂ bỏ qua
- KHÔNG bắt đầu bằng "Xin chào mọi người" hay "Hôm nay mình muốn chia sẻ"
- Ngôn ngữ đời thường, chân thật, không marketing rõ ràng
- Mỗi đoạn (scene) có mục tiêu cảm xúc rõ ràng: gây tò mò → đồng cảm → thuyết phục → hành động
- Có câu hỏi kích comment ở cuối

Trả về JSON ĐÚNG định dạng sau:
{
  "title": "Dòng đầu tiên của bài — phải gây shock hoặc tạo tò mò ngay lập tức",
  "totalDuration": "${duration}",
  "scenes": [
    {
      "id": 1,
      "name": "TÊN ĐOẠN (HOOK / CÂU CHUYỆN / VẤN ĐỀ / GIẢI PHÁP / KÊU GỌI HÀNH ĐỘNG)",
      "timestamp": "Đoạn 1",
      "duration": "~50 từ",
      "type": "hook",
      "script": "Nội dung đầy đủ của đoạn này — viết như bài thực sự đăng lên Facebook",
      "direction": "Gợi ý: ảnh/video kèm theo, emoji nên dùng ở đây",
      "overlay": "Caption ngắn nếu đăng kèm ảnh/video"
    }
  ],
  "hashtags": ["#cuocsong", "#kinhnghiem"],
  "productionTips": ["Tip đăng bài hiệu quả 1", "Tip 2", "Tip 3"]
}`,
    maxTokens,
  };
};

// ── Main generator ────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callAI = async (prompt, maxTokens, attempt = 1) => {
  try {
    const resp = await aiClient.chat.completions.create({
      model:           aiModel,
      messages: [
        { role: 'system', content: 'Bạn là chuyên gia biên kịch nội dung viral Việt Nam. Luôn trả lời bằng JSON hợp lệ, kịch bản chất lượng cao, chi tiết, có tính viral thực sự.' },
        { role: 'user', content: prompt },
      ],
      temperature:     0.85,
      max_tokens:      maxTokens,
      response_format: { type: 'json_object' },
    });
    return resp;
  } catch (err) {
    const status = err.status || err.response?.status;
    if (status === 429 && attempt <= 3) {
      const wait = Math.pow(2, attempt) * 5000;
      console.warn(`⚠️  Script AI 429 — retry ${attempt}/3 sau ${wait / 1000}s`);
      await sleep(wait);
      return callAI(prompt, maxTokens, attempt + 1);
    }
    if (status === 429) {
      const e = new Error('AI đang bận, vui lòng thử lại sau 30 giây.');
      e.statusCode = 503;
      throw e;
    }
    throw err;
  }
};

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
  const resp = await callAI(prompt, maxTokens);
  const raw  = resp.choices[0].message.content;

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
    tokensUsed: resp.usage?.total_tokens || 0,
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
