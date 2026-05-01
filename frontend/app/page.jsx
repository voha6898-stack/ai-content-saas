import Link from 'next/link';
import { Zap, Youtube, Music2, Facebook, CheckCircle, ArrowRight } from 'lucide-react';

const features = [
  { icon: '🎯', title: 'Tiêu đề viral', desc: 'AI phân tích xu hướng, tạo tiêu đề thu hút click ngay.' },
  { icon: '📝', title: 'Kịch bản hoàn chỉnh', desc: 'Script video có hook mạnh, dễ quay, dễ đọc.' },
  { icon: '✍️', title: 'Caption & Hashtag', desc: 'Caption tối ưu từng nền tảng + hashtag trending.' },
  { icon: '⚡', title: 'Tạo trong 10 giây', desc: 'GPT-4o tạo nội dung nhanh hơn bạn uống cà phê.' },
];

const platforms = [
  { icon: <Youtube className="w-6 h-6" />, name: 'YouTube', color: 'text-red-400' },
  { icon: <Music2 className="w-6 h-6" />, name: 'TikTok',  color: 'text-pink-400' },
  { icon: <Facebook className="w-6 h-6" />, name: 'Facebook', color: 'text-blue-400' },
];

const plans = [
  {
    name: 'Free',
    price: '0đ',
    desc: 'Dùng thử ngay',
    features: ['10 lượt tạo nội dung', '3 nền tảng', 'Lưu lịch sử'],
    cta: 'Bắt đầu miễn phí',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '199.000đ',
    period: '/tháng',
    desc: 'Dành cho creator nghiêm túc',
    features: ['Không giới hạn lượt', '3 nền tảng', 'Lưu lịch sử', 'Ưu tiên tốc độ', 'Hỗ trợ 24/7'],
    cta: 'Nâng cấp Pro',
    href: '/register',
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ── Navbar ───────────────────────────────── */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Zap className="w-6 h-6 text-sky-400" />
            <span>Content<span className="text-sky-400">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">Đăng nhập</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">Dùng miễn phí</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-sky-400 text-sm mb-8">
          <Zap className="w-4 h-4" /> Powered by GPT-4o
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
          Tạo nội dung viral<br />bằng AI trong 10 giây
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
          Nhập chủ đề → AI tạo ngay tiêu đề, kịch bản, caption, hashtag
          tối ưu cho YouTube, TikTok và Facebook.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 justify-center">
            Bắt đầu miễn phí <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3.5 text-center">
            Đăng nhập
          </Link>
        </div>

        {/* Platform badges */}
        <div className="flex justify-center gap-6 mt-14">
          {platforms.map((p) => (
            <div key={p.name} className={`flex items-center gap-2 ${p.color} bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm font-medium`}>
              {p.icon} {p.name}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Tất cả những gì bạn cần</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:border-sky-500/40 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Bảng giá đơn giản</h2>
        <p className="text-slate-400 text-center mb-12">Bắt đầu miễn phí, nâng cấp khi cần</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`card flex flex-col ${plan.highlight ? 'border-sky-500 ring-1 ring-sky-500/40' : ''}`}>
              {plan.highlight && (
                <div className="text-xs font-bold text-sky-400 bg-sky-500/10 rounded-full px-3 py-1 w-fit mb-4">
                  PHỔ BIẾN NHẤT
                </div>
              )}
              <div className="font-bold text-2xl">{plan.name}</div>
              <div className="mt-2 mb-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
              </div>
              <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={plan.highlight ? 'btn-primary text-center' : 'btn-secondary text-center'}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        © 2026 ContentAI. Tất cả quyền được bảo lưu.
      </footer>
    </div>
  );
}
