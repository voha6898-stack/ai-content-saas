'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Check, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';

const FREE_FEATURES = [
  '3 lượt tạo nội dung / ngày',
  '10 lượt dùng thử miễn phí',
  '3 nền tảng: YouTube, TikTok, Facebook',
  'Lịch sử 30 ngày gần nhất',
  'Tải nội dung về máy',
];

const PRO_FEATURES = [
  'Không giới hạn số lượt / ngày',
  '4 nền tảng: + Instagram Reels',
  'Prompts viral v2 — tối ưu chuyên sâu',
  'Lịch sử không giới hạn + yêu thích',
  'Ưu tiên tốc độ xử lý',
  'Hỗ trợ ưu tiên qua email',
  'Tính năng mới sớm nhất',
];

export default function PricingPage() {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Zap className="w-5 h-5 text-sky-400" />
            Content<span className="text-sky-400">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            {user
              ? <Link href="/dashboard" className="btn-secondary text-sm">Dashboard</Link>
              : <>
                  <Link href="/login"    className="text-sm text-slate-400 hover:text-white">Đăng nhập</Link>
                  <Link href="/register" className="btn-primary  text-sm">Đăng ký</Link>
                </>
            }
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-full px-4 py-1.5 text-sm text-sky-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Đơn giản. Minh bạch. Không phí ẩn.
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Chọn gói phù hợp
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Bắt đầu miễn phí, nâng cấp bất cứ khi nào bạn muốn tạo nội dung không giới hạn.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          {/* Free */}
          <div className="card border-slate-700">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Free</h2>
              <p className="text-slate-400 text-sm">Dùng thử không cần thẻ</p>
            </div>

            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-bold">0đ</span>
              <span className="text-slate-400 mb-2">/tháng</span>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-slate-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <Link
              href={user ? '/dashboard' : '/register'}
              className="btn-secondary w-full flex items-center justify-center"
            >
              {user ? 'Vào Dashboard' : 'Bắt đầu miễn phí'}
            </Link>
          </div>

          {/* Pro */}
          <div className="relative card border-sky-500/40 bg-sky-500/5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                PHỔ BIẾN NHẤT
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                Pro <Crown className="w-5 h-5 text-yellow-400" />
              </h2>
              <p className="text-slate-400 text-sm">Dành cho creator chuyên nghiệp</p>
            </div>

            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-bold">199.000đ</span>
              <span className="text-slate-400 mb-2">/tháng</span>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            {user?.plan === 'pro' ? (
              <div className="btn-secondary w-full flex items-center justify-center opacity-60 cursor-default">
                <Crown className="w-4 h-4 mr-1.5 text-yellow-400" /> Bạn đang dùng Pro
              </div>
            ) : (
              <button
                onClick={() => user ? setShowUpgrade(true) : window.location.href = '/register'}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" /> Nâng cấp Pro ngay
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Câu hỏi thường gặp</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Thanh toán như thế nào?',
                a: 'Chuyển khoản ngân hàng Vietcombank. Sau khi chuyển, bấm xác nhận và admin sẽ duyệt trong vòng 24 giờ. Tài khoản tự động lên Pro ngay khi được duyệt.',
              },
              {
                q: 'Gói Pro có hiệu lực bao lâu?',
                a: 'Gói Pro có hiệu lực 30 ngày kể từ ngày được duyệt. Bạn có thể gia hạn bất cứ lúc nào.',
              },
              {
                q: 'Nội dung AI tạo ra có bản quyền không?',
                a: 'Nội dung do AI tạo ra thuộc về bạn. Bạn có thể sử dụng cho mục đích cá nhân hoặc thương mại.',
              },
              {
                q: 'Gói Pro có hỗ trợ thêm nền tảng không?',
                a: 'Gói Pro hỗ trợ Instagram Reels ngoài YouTube, TikTok, Facebook. Chúng tôi sẽ tiếp tục thêm nền tảng mới.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-800 pb-6">
                <h3 className="font-semibold mb-2">{q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
