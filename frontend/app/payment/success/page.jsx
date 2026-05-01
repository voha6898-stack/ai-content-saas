'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function PaymentSuccessPage() {
  const { refreshUser } = useAuth();

  // Refresh user info để cập nhật plan = 'pro'
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-yellow-400" />
          <h1 className="text-2xl font-bold">Nâng cấp thành công!</h1>
        </div>

        <p className="text-slate-400 mb-8">
          Chào mừng bạn đến với <strong className="text-white">ContentAI Pro</strong>.
          Tài khoản của bạn đã được kích hoạt và bạn có thể tạo nội dung không giới hạn ngay bây giờ.
        </p>

        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 mb-8 text-left space-y-2.5">
          {[
            'Tạo nội dung không giới hạn mỗi ngày',
            '4 nền tảng bao gồm Instagram Reels',
            'Prompts viral v2 tối ưu nhất',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-sky-300">
              <CheckCircle className="w-4 h-4 shrink-0" /> {f}
            </div>
          ))}
        </div>

        <Link href="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" /> Bắt đầu tạo nội dung
        </Link>
      </div>
    </div>
  );
}
