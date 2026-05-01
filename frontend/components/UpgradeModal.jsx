'use client';

import { useState, useEffect } from 'react';
import { X, Crown, Copy, CheckCircle, Loader2, Clock, AlertCircle, QrCode } from 'lucide-react';
import { paymentAPI } from '@/lib/api';

function copyText(text, setCopied) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-700">
        <span className="flex-1 text-sm font-mono text-slate-100 select-all">{value}</span>
        <button onClick={() => copyText(value, setCopied)}
          className="shrink-0 text-slate-400 hover:text-sky-400 transition-colors p-1">
          {copied
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function UpgradeModal({ onClose }) {
  const [step, setStep]         = useState('loading'); // loading | bank | confirm | pending | success
  const [bankInfo, setBankInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showQR, setShowQR]     = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Kiểm tra xem user đã gửi yêu cầu chưa
        const [statusRes, bankRes] = await Promise.all([
          paymentAPI.getManualStatus(),
          paymentAPI.getBankInfo(),
        ]);

        setBankInfo(bankRes.data.bankInfo);

        if (statusRes.data.status === 'pending') {
          setExistingRequest(statusRes.data);
          setStep('pending');
        } else if (statusRes.data.status === 'approved') {
          setStep('success');
        } else {
          setStep('bank');
        }
      } catch {
        setStep('bank');
      }
    };
    init();
  }, []);

  const handleConfirmPaid = async () => {
    setSubmitting(true);
    try {
      await paymentAPI.submitManual();
      setStep('pending');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('đã gửi')) {
        setStep('pending');
      } else {
        alert(msg || 'Có lỗi xảy ra. Thử lại sau.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const amountFormatted = bankInfo?.amount
    ? new Intl.NumberFormat('vi-VN').format(bankInfo.amount) + ' VNĐ'
    : '—';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h2 className="font-bold text-lg">Nâng cấp lên Pro</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          )}

          {/* Bank transfer info */}
          {step === 'bank' && bankInfo && (
            <div className="space-y-4">
              {/* Price highlight */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-sky-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{amountFormatted}</p>
                <p className="text-sm text-slate-400 mt-1">Gói Pro — {process.env.NEXT_PUBLIC_PRO_DAYS || 30} ngày</p>
              </div>

              {/* Pro benefits */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Tạo nội dung không giới hạn',
                  'Automation tự động 24/7',
                  'Pipeline đầy đủ tính năng',
                  'Phân phối & Monetization',
                ].map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    {b}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <p className="text-sm font-medium text-slate-300">Chuyển khoản đến tài khoản:</p>

                <CopyField label="Ngân hàng"       value={bankInfo.bankName} />
                <CopyField label="Số tài khoản"    value={bankInfo.accountNumber} />
                <CopyField label="Chủ tài khoản"   value={bankInfo.accountName} />
                <CopyField label="Số tiền"         value={amountFormatted} />
                <CopyField label="Nội dung chuyển khoản (BẮT BUỘC)" value={bankInfo.transferCode} />
              </div>

              {/* QR Code toggle */}
              <button onClick={() => setShowQR(!showQR)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-700 rounded-xl text-sm text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-colors">
                <QrCode className="w-4 h-4" />
                {showQR ? 'Ẩn QR Code' : 'Hiển thị QR Code (quét bằng app ngân hàng)'}
              </button>

              {showQR && bankInfo.qrUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bankInfo.qrUrl} alt="VietQR" className="rounded-xl border border-slate-700 max-w-[220px]"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Nhập đúng nội dung chuyển khoản <strong>{bankInfo.transferCode}</strong> để admin xác nhận nhanh hơn.
                </p>
              </div>

              <button onClick={() => setStep('confirm')} className="btn-primary w-full flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Tôi đã chuyển khoản xong
              </button>
            </div>
          )}

          {/* Confirm step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Xác nhận thanh toán</h3>
                <p className="text-slate-400 text-sm">
                  Bạn đã chuyển khoản <strong className="text-white">{amountFormatted}</strong> với nội dung
                  <strong className="text-sky-400 ml-1">{bankInfo?.transferCode}</strong>?
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 text-xs text-slate-400 space-y-1">
                <p>✅ Admin sẽ kiểm tra giao dịch và duyệt trong vòng <strong className="text-white">24 giờ</strong></p>
                <p>✅ Tài khoản sẽ tự động nâng lên <strong className="text-yellow-400">Pro {process.env.NEXT_PUBLIC_PRO_DAYS || 30} ngày</strong> sau khi duyệt</p>
                <p>✅ Bạn sẽ thấy thay đổi khi đăng nhập lại</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('bank')} className="btn-secondary flex-1">
                  Quay lại
                </button>
                <button onClick={handleConfirmPaid} disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                    : <><Crown className="w-4 h-4" /> Xác nhận đã thanh toán</>}
                </button>
              </div>
            </div>
          )}

          {/* Pending step */}
          {step === 'pending' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto border border-yellow-500/20">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Đang chờ xác nhận</h3>
                <p className="text-slate-400 text-sm">
                  Yêu cầu của bạn đã được ghi nhận. Admin sẽ kiểm tra và duyệt trong vòng 24h.
                </p>
              </div>
              {existingRequest?.createdAt && (
                <p className="text-xs text-slate-500">
                  Đã gửi lúc: {new Date(existingRequest.createdAt).toLocaleString('vi-VN')}
                </p>
              )}
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-300 text-left">
                <p>💡 Nếu đã chờ quá 24h, liên hệ admin qua email với mã giao dịch của bạn.</p>
              </div>
              <button onClick={onClose} className="btn-secondary w-full">
                Đóng và tiếp tục sử dụng
              </button>
            </div>
          )}

          {/* Success (already approved) */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Tài khoản đã là Pro! ⭐</h3>
                <p className="text-slate-400 text-sm">Bạn đang dùng gói Pro. Hãy reload lại trang để cập nhật.</p>
              </div>
              <button onClick={() => window.location.reload()} className="btn-primary w-full">
                Reload trang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
