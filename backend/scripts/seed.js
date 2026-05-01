/**
 * Demo Seed Script
 * Chạy: node scripts/seed.js
 * Tạo tài khoản demo + dữ liệu mẫu để test giao diện
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User            = require('../src/models/User.model');
const Content         = require('../src/models/Content.model');
const DistributionJob = require('../src/models/DistributionJob.model');

const DEMO_USERS = [
  { name: 'Demo Admin',   email: 'admin@demo.com',   password: 'demo123', plan: 'pro'  },
  { name: 'Demo Free',    email: 'free@demo.com',    password: 'demo123', plan: 'free' },
  { name: 'Nguyễn Văn A', email: 'user1@demo.com',  password: 'demo123', plan: 'pro'  },
  { name: 'Trần Thị B',   email: 'user2@demo.com',  password: 'demo123', plan: 'free' },
];

const SAMPLE_TOPICS = [
  { topic: 'Top 10 công cụ AI giúp bạn kiếm tiền online năm 2025', platform: 'YouTube' },
  { topic: 'Cách đầu tư chứng khoán an toàn cho người mới bắt đầu', platform: 'YouTube' },
  { topic: '5 thói quen buổi sáng của người thành công', platform: 'TikTok'  },
  { topic: 'Review iPhone 16 Pro sau 3 tháng dùng thực tế', platform: 'TikTok'  },
  { topic: 'Công thức nấu phở bò chuẩn vị Hà Nội', platform: 'Facebook' },
  { topic: 'Du lịch Đà Nẵng 3 ngày 2 đêm tự túc chi phí dưới 3 triệu', platform: 'Facebook' },
  { topic: 'Bài tập gym tại nhà không cần dụng cụ cho người bận rộn', platform: 'Instagram'},
  { topic: 'ChatGPT vs Claude vs Gemini — so sánh chi tiết 2025', platform: 'YouTube' },
  { topic: '10 mistake khi học lập trình bạn cần tránh', platform: 'TikTok'  },
  { topic: 'Cách tăng thu nhập thụ động với affiliate marketing', platform: 'YouTube' },
];

const SAMPLE_OUTPUT = (topic, platform) => ({
  title:   topic,
  script:  `[HOOK] ${topic}\n\n[NỘI DUNG] Đây là nội dung mẫu được tạo bởi AI...\n\n[CTA] Nhấn subscribe để không bỏ lỡ video tiếp theo!`,
  caption: `${topic} #viral #trending #contentai`,
  hashtags: ['#viral', '#trending', '#contentai', '#vietnam'],
  thumbnail: `Thumbnail gợi ý: Màu nền xanh đậm, chữ trắng bold "${topic.substring(0,30)}..."`,
  platforms: [platform],
});

async function seed() {
  console.log('🔗 Kết nối MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Đã kết nối\n');

  // Xoá dữ liệu demo cũ
  const demoEmails = DEMO_USERS.map(u => u.email);
  const oldUsers   = await User.find({ email: { $in: demoEmails } });
  const oldUserIds = oldUsers.map(u => u._id);
  await Content.deleteMany({ userId: { $in: oldUserIds } });
  await DistributionJob.deleteMany({ userId: { $in: oldUserIds } });
  await User.deleteMany({ email: { $in: demoEmails } });
  console.log('🗑️  Đã xoá dữ liệu demo cũ\n');

  // Tạo users
  console.log('👥 Tạo tài khoản demo...');
  const createdUsers = [];
  for (const u of DEMO_USERS) {
    const user = await User.create({
      name:     u.name,
      email:    u.email,
      password: u.password,   // User.pre('save') sẽ hash
      plan:     u.plan,
      credits:  u.plan === 'pro' ? 9999 : 10,
    });
    createdUsers.push(user);
    console.log(`   ✓ ${u.email} (${u.plan})`);
  }

  // Tạo content mẫu
  console.log('\n📝 Tạo nội dung mẫu...');
  const adminUser = createdUsers[0];
  const proUser   = createdUsers[2];

  for (const item of SAMPLE_TOPICS) {
    const owner = Math.random() > 0.4 ? adminUser : proUser;
    await Content.create({
      userId:   owner._id,
      topic:    item.topic,
      platform: item.platform,
      output:   SAMPLE_OUTPUT(item.topic, item.platform),
      isFavorite: Math.random() > 0.7,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // random 7 ngày gần đây
    });
  }
  console.log(`   ✓ ${SAMPLE_TOPICS.length} bài nội dung`);

  // Tạo distribution jobs mẫu
  console.log('\n📤 Tạo lịch đăng mẫu...');
  const statuses = ['completed', 'completed', 'completed', 'queued', 'failed'];
  const platforms = ['YouTube', 'TikTok', 'Facebook'];
  for (let i = 0; i < 8; i++) {
    await DistributionJob.create({
      userId:     adminUser._id,
      contentId:  new mongoose.Types.ObjectId(),
      platform:   platforms[i % 3],
      status:     statuses[i % statuses.length],
      scheduledAt: new Date(Date.now() + (i - 4) * 24 * 60 * 60 * 1000),
      createdAt:  new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
    });
  }
  console.log('   ✓ 8 distribution jobs');

  console.log('\n✅ Seed thành công!\n');
  console.log('═══════════════════════════════════════');
  console.log('  TÀI KHOẢN DEMO:');
  console.log('  📧 admin@demo.com   / demo123  (Pro)');
  console.log('  📧 free@demo.com    / demo123  (Free)');
  console.log('  📧 user1@demo.com   / demo123  (Pro)');
  console.log('  📧 user2@demo.com   / demo123  (Free)');
  console.log('═══════════════════════════════════════\n');
  console.log('  👉 Mở http://localhost:3000/login để đăng nhập\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed thất bại:', err.message);
  process.exit(1);
});
