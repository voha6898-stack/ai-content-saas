'use client';

import Link from 'next/link';
import { XCircle, Crown, ArrowLeft } from 'lucide-react';
import { paymentAPI } from '@/lib/api';
import { useState } from 'react';

export default function PaymentCancelPage() {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const { data } = await paymentAPI.createCheckout();
      window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold mb-3">Thanh toán bị huỷ</h1>
        <p className="text-slate-400 mb-8">
          Bạn đã huỷ quá trình thanh toán. Tài khoản của bạn vẫn ở gói Free.
          Bạn có thể thử lại bất cứ lúc nào.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            {loading ? 'Đang xử lý...' : 'Thử lại — Nâng cấp Pro'}
          </button>

          <Link
            href="/dashboard"
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay về Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
