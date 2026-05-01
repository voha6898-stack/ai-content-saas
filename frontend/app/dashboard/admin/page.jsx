'use client';

import { useState, useEffect } from 'react';
import {
  Download, Users, FileText, BarChart2, Loader2, Crown,
  RefreshCw, CheckCircle, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api, { adminPaymentAPI } from '@/lib/api';

function StatCard({ label, value, sub, color = 'text-sky-400' }) {
  return (
    <div className="card text-center">
      <div className={`text-3xl font-bold ${color}`}>{value ?? '—'}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

const STATUS_STYLE = {
  pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/10  text-green-400  border-green-500/30',
  rejected: 'bg-red-500/10   text-red-400    border-red-500/30',
};
const STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };

function PaymentRequestCard({ req, onApprove, onReject }) {
  const [loading,  setLoading]  = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`Nâng cấp "${req.userId?.name}" lên Pro?`)) return;
    setLoading('approve');
    try { await onApprove(req._id); }
    finally { setLoading(''); }
  };

  const handleReject = async () => {
    setLoading('reject');
    try { await onReject(req._id, rejectNote); setShowReject(false); }
    finally { setLoading(''); }
  };

  return (
    <div className="card border-slate-700 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold">{req.userId?.name || '—'}</span>
            <span className="text-xs text-slate-500">{req.userId?.email}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[req.status]}`}>
              {STATUS_LABEL[req.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span>💳 {new Intl.NumberFormat('vi-VN').format(req.amount)} VNĐ</span>
            <span>🏦 {req.bankName}</span>
            <span className="font-mono text-sky-400">Mã: {req.transferCode}</span>
            <span>🕐 {new Date(req.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          {req.status === 'approved' && req.approvedAt && (
            <p className="text-xs text-green-400 mt-1">
              Đã duyệt bởi {req.approvedBy} lúc {new Date(req.approvedAt).toLocaleString('vi-VN')}
            </p>
          )}
          {req.status === 'rejected' && req.note && (
            <p className="text-xs text-red-400 mt-1">Lý do từ chối: {req.note}</p>
          )}
        </div>

        {req.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <button onClick={handleApprove} disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50">
              {loading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Duyệt
            </button>
            <button onClick={() => setShowReject(!showReject)} disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
              <XCircle className="w-3.5 h-3.5" /> Từ chối
            </button>
          </div>
        )}
      </div>

      {showReject && (
        <div className="mt-3 flex gap-2">
          <input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Lý do từ chối (không bắt buộc)"
            className="input-field text-sm flex-1 py-2" />
          <button onClick={handleReject} disabled={!!loading}
            className="btn-secondary text-xs px-4 text-red-400 border-red-500/30 hover:bg-red-500/10">
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận từ chối'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user }  = useAuth();
  const [tab, setTab] = useState('stats');   // stats | payments
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [dlLoading, setDlLoading] = useState('');

  const [payRequests,   setPayRequests]   = useState([]);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [payLoading,    setPayLoading]    = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      if (err.response?.status !== 403) console.error(err);
    } finally { setLoading(false); }
  };

  const loadPayments = async () => {
    setPayLoading(true);
    try {
      const { data } = await adminPaymentAPI.getRequests();
      setPayRequests(data.requests || []);
      setPendingCount(data.pendingCount || 0);
    } catch {} finally { setPayLoading(false); }
  };

  useEffect(() => {
    loadStats();
    loadPayments();
  }, []);

  const handleApprove = async (id) => {
    await adminPaymentAPI.approve(id);
    await loadPayments();
    await loadStats();
  };

  const handleReject = async (id, note) => {
    await adminPaymentAPI.reject(id, note);
    await loadPayments();
  };

  const download = async (type, label) => {
    setDlLoading(type);
    try {
      const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `contentai_${type}_${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || `Lỗi khi tải ${label}`);
    } finally { setDlLoading(''); }
  };

  if (!loading && !stats) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Chỉ Admin mới có quyền truy cập</h1>
        <p className="text-slate-400 text-sm">Tài khoản của bạn không có quyền Admin.</p>
      </div>
    );
  }

  const s = stats?.stats;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" /> Admin Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý hệ thống, duyệt thanh toán và xuất dữ liệu</p>
        </div>
        <button onClick={() => { loadStats(); loadPayments(); }}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800">
        <button onClick={() => setTab('stats')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
            ${tab === 'stats'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
          📊 Thống kê & Xuất Excel
        </button>
        <button onClick={() => setTab('payments')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2
            ${tab === 'payments'
              ? 'border-yellow-400 text-yellow-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
          💳 Duyệt Thanh Toán
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Stats Tab ── */}
      {tab === 'stats' && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <StatCard label="Tổng người dùng"  value={s?.users?.total}   color="text-sky-400" />
                <StatCard label="Người dùng Pro"    value={s?.users?.pro}     color="text-yellow-400"
                  sub={`Tỷ lệ: ${s?.conversionRate}`} />
                <StatCard label="Tổng nội dung"     value={s?.content?.total} color="text-purple-400"
                  sub={`Hôm nay: +${s?.content?.today}`} />
                <StatCard label="Distribution Jobs" value={s?.jobs?.total}    color="text-green-400" />
              </div>

              {stats?.topUsers?.length > 0 && (
                <div className="card mb-8">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" /> Top người dùng tích cực
                  </h2>
                  <div className="space-y-2">
                    {stats.topUsers.map((u, i) => (
                      <div key={u._id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                        <span className="text-slate-500 text-sm w-5">{i + 1}</span>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{u.name}</span>
                          <span className="text-xs text-slate-500 ml-2">{u.email}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          u.plan === 'pro'
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {u.plan}
                        </span>
                        <span className="text-sm font-bold text-sky-400">{u.count} bài</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Export buttons */}
          <div className="card">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" /> Xuất dữ liệu Excel
            </h2>
            <p className="text-xs text-slate-500 mb-5">Tải file .xlsx — dữ liệu thời gian thực từ database</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { type: 'users',   label: 'Danh sách người dùng',     desc: 'Tên, email, plan, credits + sheet thống kê', icon: Users,    color: 'text-sky-400'    },
                { type: 'content', label: 'Nội dung đã tạo',           desc: 'Toàn bộ nội dung AI theo platform',          icon: FileText, color: 'text-purple-400' },
                { type: 'full',    label: 'Xuất toàn bộ (Full Report)', desc: 'Users + Content + Jobs + Tổng hợp, 4 sheet', icon: BarChart2,color: 'text-green-400'  },
              ].map(({ type, label, desc, icon: Icon, color }) => (
                <button key={type} onClick={() => download(type, label)} disabled={!!dlLoading}
                  className="card border-slate-700 hover:border-slate-600 text-left transition-colors disabled:opacity-60">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 mb-3">
                    {dlLoading === type
                      ? <Loader2 className={`w-5 h-5 animate-spin ${color}`} />
                      : <Icon className={`w-5 h-5 ${color}`} />}
                  </div>
                  <div className="font-medium text-sm mb-1">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                  <div className={`text-xs font-medium mt-3 flex items-center gap-1 ${color}`}>
                    <Download className="w-3 h-3" />
                    {dlLoading === type ? 'Đang tạo file...' : 'Tải về .xlsx'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Payments Tab ── */}
      {tab === 'payments' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-medium mb-1">Hướng dẫn duyệt thanh toán</p>
              <p className="text-slate-400 text-xs">
                Kiểm tra giao dịch ngân hàng khớp với mã chuyển khoản <span className="text-sky-400 font-mono">CONTENTAI XXXXXX</span>,
                sau đó bấm <strong>Duyệt</strong> để tự động nâng cấp tài khoản người dùng lên Pro.
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 text-sm">
            <span className="text-slate-500 self-center text-xs">Tất cả yêu cầu ({payRequests.length}) ·</span>
            <span className="text-yellow-400 text-xs self-center">Chờ duyệt: {pendingCount}</span>
          </div>

          {payLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : payRequests.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Chưa có yêu cầu thanh toán nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending first */}
              {payRequests.filter((r) => r.status === 'pending').map((req) => (
                <PaymentRequestCard key={req._id} req={req}
                  onApprove={handleApprove} onReject={handleReject} />
              ))}
              {/* Then others */}
              {payRequests.filter((r) => r.status !== 'pending').map((req) => (
                <PaymentRequestCard key={req._id} req={req}
                  onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
