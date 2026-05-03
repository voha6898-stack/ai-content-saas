'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Crown, Loader2, RefreshCw, Users, FileText, BarChart2,
  Download, CheckCircle, XCircle, Clock, AlertCircle,
  Search, Shield, Trash2, ChevronLeft, ChevronRight,
  CreditCard, Star, UserX, Settings, BarChart3, Zap, LifeBuoy, Send,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api, { adminPaymentAPI, adminAPI, adminSupportAPI } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'text-sky-400', icon: Icon }) {
  return (
    <div className="card flex items-center gap-4">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      )}
      <div className="min-w-0">
        <div className={`text-2xl font-bold ${color}`}>{value ?? '—'}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Payment Card ──────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/10  text-green-400  border-green-500/30',
  rejected: 'bg-red-500/10   text-red-400    border-red-500/30',
};

function PaymentCard({ req, onApprove, onReject }) {
  const [loading, setLoading] = useState('');
  const [note, setNote]       = useState('');
  const [showReject, setShowReject] = useState(false);

  const approve = async () => {
    if (!confirm(`Nâng cấp "${req.userId?.name}" lên Pro?`)) return;
    setLoading('approve');
    try { await onApprove(req._id); } finally { setLoading(''); }
  };
  const reject = async () => {
    setLoading('reject');
    try { await onReject(req._id, note); setShowReject(false); } finally { setLoading(''); }
  };

  return (
    <div className="card border-slate-700 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold">{req.userId?.name || '—'}</span>
            <span className="text-xs text-slate-500">{req.userId?.email}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[req.status]}`}>
              {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span>💳 {fmt(req.amount)} VNĐ</span>
            <span>🏦 {req.bankName}</span>
            <span className="font-mono text-sky-400">Mã: {req.transferCode}</span>
            <span>🕐 {fmtDateTime(req.createdAt)}</span>
          </div>
          {req.status === 'approved' && <p className="text-xs text-green-400 mt-1">Duyệt bởi {req.approvedBy} lúc {fmtDateTime(req.approvedAt)}</p>}
          {req.status === 'rejected' && req.note && <p className="text-xs text-red-400 mt-1">Lý do: {req.note}</p>}
        </div>
        {req.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <button onClick={approve} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/20 disabled:opacity-50">
              {loading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Duyệt
            </button>
            <button onClick={() => setShowReject(!showReject)} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 disabled:opacity-50">
              <XCircle className="w-3.5 h-3.5" /> Từ chối
            </button>
          </div>
        )}
      </div>
      {showReject && (
        <div className="mt-3 flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do từ chối (tuỳ chọn)" className="input-field text-sm flex-1 py-2" />
          <button onClick={reject} disabled={!!loading} className="btn-secondary text-xs px-4 text-red-400 border-red-500/30 hover:bg-red-500/10">
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────

function UserRow({ u, adminEmail, onUpdate, onDelete }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState('');
  const [credits, setCredits] = useState('');
  const isAdmin = u.email === adminEmail;

  const upgradePro = async () => {
    if (!confirm(`Nâng cấp "${u.name}" lên Pro 30 ngày?`)) return;
    setLoading('pro');
    try { await adminAPI.updateUser(u._id, { plan: 'pro' }); onUpdate(); }
    catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setLoading(''); }
  };

  const downgradeFree = async () => {
    if (!confirm(`Hạ "${u.name}" xuống Free?`)) return;
    setLoading('free');
    try { await adminAPI.updateUser(u._id, { plan: 'free' }); onUpdate(); }
    catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setLoading(''); }
  };

  const addCr = async () => {
    const n = parseInt(credits);
    if (!n || isNaN(n)) return;
    setLoading('cr');
    try { await adminAPI.updateUser(u._id, { addCredits: n }); setCredits(''); onUpdate(); }
    catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setLoading(''); }
  };

  const del = async () => {
    if (!confirm(`Xoá tài khoản "${u.name}"? Không thể hoàn tác!`)) return;
    setLoading('del');
    try { await adminAPI.deleteUser(u._id); onDelete(u._id); }
    catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setLoading(''); }
  };

  return (
    <>
      <tr className={`border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors ${isAdmin ? 'bg-yellow-500/5' : ''}`}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-sm font-bold text-slate-300">
              {u.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium flex items-center gap-1.5">
                {u.name}
                {isAdmin && <Crown className="w-3 h-3 text-yellow-400 shrink-0" title="Admin" />}
              </div>
              <div className="text-xs text-slate-500 truncate">{u.email}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border
            ${u.plan === 'pro'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {u.plan === 'pro' ? '⭐ Pro' : 'Free'}
          </span>
        </td>
        <td className="px-3 py-3 text-sm text-center">
          <span className={u.credits > 100000 ? 'text-yellow-400 font-bold' : 'text-slate-300'}>
            {u.credits > 100000 ? '∞' : u.credits}
          </span>
        </td>
        <td className="px-3 py-3 text-sm text-slate-400 text-center">{u.contentCount || 0}</td>
        <td className="px-3 py-3 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
        <td className="px-3 py-3 text-xs text-slate-500">
          {u.planExpiresAt ? fmtDate(u.planExpiresAt) : '—'}
        </td>
        <td className="px-3 py-3">
          <button onClick={() => setOpen((v) => !v)} className="text-xs text-slate-500 hover:text-sky-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors">
            {open ? '▲ Đóng' : '▼ Quản lý'}
          </button>
        </td>
      </tr>

      {open && (
        <tr className="border-b border-slate-800">
          <td colSpan={7} className="px-4 pb-3 pt-1">
            <div className="bg-slate-900/60 rounded-xl p-3 flex flex-wrap items-center gap-2.5">
              {/* Plan actions */}
              {u.plan !== 'pro' ? (
                <button onClick={upgradePro} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg hover:bg-yellow-500/20 transition-colors disabled:opacity-50">
                  {loading === 'pro' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />} Nâng lên Pro
                </button>
              ) : !isAdmin && (
                <button onClick={downgradeFree} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
                  {loading === 'free' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />} Hạ về Free
                </button>
              )}

              {/* Add credits */}
              <div className="flex items-center gap-1.5">
                <input
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  placeholder="Số credits"
                  type="number" min="1" max="9999"
                  className="input-field text-xs py-1.5 w-28"
                />
                <button onClick={addCr} disabled={!!loading || !credits} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs rounded-lg hover:bg-sky-500/20 transition-colors disabled:opacity-50">
                  {loading === 'cr' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Cộng credits
                </button>
              </div>

              {/* Delete */}
              {!isAdmin && (
                <button onClick={del} disabled={!!loading} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50">
                  {loading === 'del' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Xoá tài khoản
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Admin Support Tab ─────────────────────────────────────────────────────────

const TICKET_STATUS_META = {
  open:        { label: 'Mở',           color: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
  in_progress: { label: 'Đang xử lý',   color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  resolved:    { label: 'Đã xử lý',     color: 'bg-green-500/10 border-green-500/30 text-green-400' },
  closed:      { label: 'Đã đóng',      color: 'bg-slate-700 border-slate-600 text-slate-400' },
};

const TICKET_PRIORITY_COLOR = {
  low:    'text-slate-400',
  normal: 'text-slate-300',
  high:   'text-yellow-400',
  urgent: 'text-red-400',
};

const PRIORITY_LABEL = { low: 'Thấp', normal: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' };

function AdminSupportPanel() {
  const [tickets,       setTickets]       = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [loading,       setLoading]       = useState(true);
  const [statusCounts,  setStatusCounts]  = useState({});
  const [selectedId,    setSelectedId]    = useState(null);
  const [detail,        setDetail]        = useState(null);
  const [detailLoad,    setDetailLoad]    = useState(false);
  const [replyMsg,      setReplyMsg]      = useState('');
  const [replyStatus,   setReplyStatus]   = useState('in_progress');
  const [sending,       setSending]       = useState(false);

  const load = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const { data } = await adminSupportAPI.getAll({ page: p, limit: 15, ...(s && { status: s }) });
      setTickets(data.data.tickets);
      setTotal(data.data.total);
      setStatusCounts(data.data.statusCounts || {});
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, statusFilter); }, [page, statusFilter]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetailLoad(true);
    try {
      const { data } = await adminSupportAPI.getOne(id);
      setDetail(data.data);
      setReplyStatus(data.data.status === 'open' ? 'in_progress' : data.data.status);
    } catch {} finally { setDetailLoad(false); }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyMsg.trim()) return;
    setSending(true);
    try {
      await adminSupportAPI.reply(selectedId, { message: replyMsg.trim(), status: replyStatus });
      setReplyMsg('');
      const { data } = await adminSupportAPI.getOne(selectedId);
      setDetail(data.data);
      load(page, statusFilter);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
    finally { setSending(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminSupportAPI.updateStatus(id, { status });
      if (selectedId === id) {
        const { data } = await adminSupportAPI.getOne(id);
        setDetail(data.data);
      }
      load(page, statusFilter);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  const pages = Math.ceil(total / 15);

  if (selectedId) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedId(null); setDetail(null); }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
        </button>

        {detailLoad || !detail ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            <div className="card space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold">{detail.subject}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {detail.userId?.name} ({detail.userId?.email}) · {detail.userId?.plan}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${TICKET_STATUS_META[detail.status]?.color}`}>
                  {TICKET_STATUS_META[detail.status]?.label}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                  <button key={s} onClick={() => updateStatus(detail._id, s)} disabled={detail.status === s}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-colors disabled:opacity-40
                      ${TICKET_STATUS_META[s]?.color}`}>
                    {TICKET_STATUS_META[s]?.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {detail.replies.map((r, i) => (
                <div key={i}
                  className={`card ${r.senderRole === 'admin' ? 'border-sky-500/20 bg-sky-500/5' : 'border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${r.senderRole === 'admin' ? 'text-sky-400' : 'text-slate-300'}`}>
                      {r.senderRole === 'admin' ? '🛡️ Admin' : '👤 ' + r.senderName}
                    </span>
                    <span className="text-[11px] text-slate-600">{fmtDateTime(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            {detail.status !== 'closed' && (
              <form onSubmit={sendReply} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 shrink-0">Phản hồi:</label>
                  <select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}
                    className="input-field text-xs py-1.5 flex-1">
                    {Object.entries(TICKET_STATUS_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <textarea value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)}
                  placeholder="Nhập nội dung phản hồi..." rows={4}
                  className="input-field w-full resize-none" />
                <button type="submit" disabled={sending || !replyMsg.trim()}
                  className="btn-primary flex items-center gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Gửi phản hồi
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {[['', `Tất cả (${total})`], ['open', `Mở (${statusCounts.open || 0})`],
          ['in_progress', `Đang xử lý (${statusCounts.in_progress || 0})`],
          ['resolved', `Đã xử lý (${statusCounts.resolved || 0})`],
          ['closed', `Đã đóng (${statusCounts.closed || 0})`],
        ].map(([s, label]) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
              ${statusFilter === s
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
      ) : tickets.length === 0 ? (
        <div className="card text-center py-14">
          <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Chưa có ticket nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t._id} onClick={() => openDetail(t._id)}
              className="card w-full text-left border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{t.subject}</p>
                    {t.hasUnreadReply && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-full">Mới</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.userId?.name} · {t.userId?.email} ·{' '}
                    <span className={TICKET_PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</span>
                    {' · '}{fmtDateTime(t.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${TICKET_STATUS_META[t.status]?.color}`}>
                  {TICKET_STATUS_META[t.status]?.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Trang {page}/{pages} · {total} tickets</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page === pages} onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, refreshUser } = useAuth();
  const adminEmail = user?.email || '';

  const [tab,       setTab]       = useState('stats');
  const [stats,     setStats]     = useState(null);
  const [statsLoad, setStatsLoad] = useState(true);
  const [dlLoad,    setDlLoad]    = useState('');

  // Payments
  const [payReqs,     setPayReqs]     = useState([]);
  const [pendingCount,setPendingCount]= useState(0);
  const [payLoad,     setPayLoad]     = useState(false);

  // Users
  const [users,     setUsers]     = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage,  setUserPage]  = useState(1);
  const [userSearch,setUserSearch]= useState('');
  const [planFilter,setPlanFilter]= useState('');
  const [usersLoad, setUsersLoad] = useState(false);

  // Admin setup
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupDone,    setSetupDone]    = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoad(true);
    try { const { data } = await adminAPI.getStats(); setStats(data); }
    catch (e) { if (e.response?.status !== 403) console.error(e); }
    finally { setStatsLoad(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setPayLoad(true);
    try {
      const { data } = await adminPaymentAPI.getRequests();
      setPayReqs(data.requests || []);
      setPendingCount(data.pendingCount || 0);
    } catch {} finally { setPayLoad(false); }
  }, []);

  const loadUsers = useCallback(async (page = 1, search = '', plan = '') => {
    setUsersLoad(true);
    try {
      const { data } = await adminAPI.getUsers({ page, limit: 20, search, plan });
      setUsers(data.users || []);
      setUserTotal(data.pagination?.total || 0);
    } catch {} finally { setUsersLoad(false); }
  }, []);

  useEffect(() => { loadStats(); loadPayments(); loadUsers(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { loadUsers(1, userSearch, planFilter); setUserPage(1); }, 400);
    return () => clearTimeout(t);
  }, [userSearch, planFilter]);

  const handleApprove = async (id) => { await adminPaymentAPI.approve(id); await loadPayments(); await loadStats(); };
  const handleReject  = async (id, note) => { await adminPaymentAPI.reject(id, note); await loadPayments(); };

  const handleSetupAdmin = async () => {
    setSetupLoading(true);
    try {
      await adminAPI.setupSelf();
      setSetupDone(true);
      await refreshUser();
      await loadStats();
    } catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setSetupLoading(false); }
  };

  const download = async (type, label) => {
    setDlLoad(type);
    try {
      const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a'); a.href = url;
      a.download = `contentai_${type}_${Date.now()}.xlsx`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert(e.response?.data?.message || `Lỗi tải ${label}`); }
    finally { setDlLoad(''); }
  };

  if (!statsLoad && !stats) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h1 className="text-xl font-bold mb-2">Chỉ Admin mới có quyền truy cập</h1>
    </div>
  );

  const s = stats?.stats;
  const totalPages = Math.ceil(userTotal / 20);

  const TABS = [
    { id: 'stats',    label: 'Thống kê',      icon: BarChart3 },
    { id: 'users',    label: `Users (${userTotal})`, icon: Users },
    { id: 'payments', label: 'Thanh toán',    icon: CreditCard, badge: pendingCount },
    { id: 'support',  label: 'Hỗ trợ',        icon: LifeBuoy },
    { id: 'export',   label: 'Xuất Excel',    icon: Download },
    { id: 'settings', label: 'Cài đặt Admin', icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" /> Admin Panel
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Quản lý toàn bộ hệ thống · {adminEmail}</p>
        </div>
        <button onClick={() => { loadStats(); loadPayments(); loadUsers(userPage, userSearch, planFilter); }}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-slate-800 mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === t.id
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── STATS ── */}
      {tab === 'stats' && (
        statsLoad ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Tổng users"    value={s?.users?.total}   color="text-sky-400"    icon={Users}    />
              <StatCard label="Pro users"      value={s?.users?.pro}     color="text-yellow-400" icon={Star}
                sub={`Conversion: ${s?.conversionRate}`} />
              <StatCard label="Tổng nội dung" value={s?.content?.total} color="text-purple-400" icon={FileText}
                sub={`Hôm nay: +${s?.content?.today}`} />
              <StatCard label="Distribution"  value={s?.jobs?.total}    color="text-green-400"  icon={Zap} />
            </div>

            {stats?.topUsers?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-sky-400" /> Top người dùng tích cực nhất
                </h2>
                <div className="space-y-2">
                  {stats.topUsers.map((u, i) => (
                    <div key={u._id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                      <span className="text-slate-600 text-sm w-5 text-center font-bold">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{u.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{u.email}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border
                        ${u.plan === 'pro' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {u.plan}
                      </span>
                      <span className="text-sm font-bold text-sky-400 w-16 text-right">{u.count} bài</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Tìm tên hoặc email..." className="input-field pl-9 text-sm py-2" />
            </div>
            <div className="flex gap-2">
              {['', 'pro', 'free'].map((p) => (
                <button key={p} onClick={() => setPlanFilter(p)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all
                    ${planFilter === p
                      ? p === 'pro' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        : p === 'free' ? 'bg-slate-700 border-slate-600 text-slate-200'
                        : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}>
                  {p === '' ? `Tất cả (${userTotal})` : p === 'pro' ? '⭐ Pro' : 'Free'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {usersLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Người dùng</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-slate-500">Plan</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-slate-500">Credits</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-slate-500">Nội dung</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-slate-500">Đăng ký</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-slate-500">Pro hết hạn</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">Không tìm thấy người dùng</td></tr>
                    ) : users.map((u) => (
                      <UserRow key={u._id} u={u} adminEmail={adminEmail}
                        onUpdate={() => loadUsers(userPage, userSearch, planFilter)}
                        onDelete={(id) => setUsers((prev) => prev.filter((x) => x._id !== id))} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{userTotal} users · Trang {userPage}/{totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={userPage === 1}
                      onClick={() => { setUserPage(userPage - 1); loadUsers(userPage - 1, userSearch, planFilter); }}
                      className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-40 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={userPage === totalPages}
                      onClick={() => { setUserPage(userPage + 1); loadUsers(userPage + 1, userSearch, planFilter); }}
                      className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-40 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              Kiểm tra giao dịch ngân hàng khớp mã <span className="text-sky-400 font-mono">CONTENTAI XXXXXX</span>, sau đó bấm <strong>Duyệt</strong> để tự động nâng cấp Pro.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-slate-500">
            <span>Tổng: {payReqs.length} yêu cầu</span>
            <span>·</span>
            <span className="text-yellow-400">Chờ duyệt: {pendingCount}</span>
          </div>
          {payLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : payReqs.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Chưa có yêu cầu thanh toán nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...payReqs].sort((a, b) => a.status === 'pending' ? -1 : 1).map((req) => (
                <PaymentCard key={req._id} req={req} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUPPORT ── */}
      {tab === 'support' && <AdminSupportPanel />}

      {/* ── EXPORT ── */}
      {tab === 'export' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { type: 'users',   label: 'Danh sách users',    desc: 'Tên, email, plan, credits + thống kê', icon: Users,    color: 'text-sky-400'    },
            { type: 'content', label: 'Nội dung đã tạo',    desc: 'Toàn bộ AI content theo platform',     icon: FileText, color: 'text-purple-400' },
            { type: 'full',    label: 'Full Report (4 sheet)', desc: 'Users + Content + Jobs + Tổng hợp', icon: BarChart2,color: 'text-green-400'  },
          ].map(({ type, label, desc, icon: Icon, color }) => (
            <button key={type} onClick={() => download(type, label)} disabled={!!dlLoad}
              className="card border-slate-700 hover:border-slate-600 text-left transition-colors disabled:opacity-60">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
                {dlLoad === type ? <Loader2 className={`w-5 h-5 animate-spin ${color}`} /> : <Icon className={`w-5 h-5 ${color}`} />}
              </div>
              <div className="font-medium text-sm mb-1">{label}</div>
              <div className="text-xs text-slate-500 mb-3">{desc}</div>
              <div className={`text-xs font-medium flex items-center gap-1 ${color}`}>
                <Download className="w-3 h-3" />
                {dlLoad === type ? 'Đang tạo file...' : 'Tải về .xlsx'}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-4">
          <div className="card border-yellow-500/20">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-400">Kích hoạt Admin Full Access</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nâng tài khoản admin lên Pro không giới hạn (credits = ∞, plan = Pro, hết hạn sau 10 năm).
                  Giúp dùng tất cả tính năng để kiểm tra và quản lý hệ thống.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-3 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-300 font-mono">{adminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan hiện tại</span>
                <span className={user?.plan === 'pro' ? 'text-yellow-400 font-bold' : 'text-slate-400'}>{user?.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Credits hiện tại</span>
                <span className={user?.credits > 100000 ? 'text-yellow-400 font-bold' : 'text-slate-300'}>
                  {user?.credits > 100000 ? '∞ Unlimited' : user?.credits}
                </span>
              </div>
            </div>

            {setupDone || (user?.plan === 'pro' && user?.credits > 100000) ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Admin đã có Full Access — Pro unlimited ✓
              </div>
            ) : (
              <button onClick={handleSetupAdmin} disabled={setupLoading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {setupLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang kích hoạt...</>
                  : <><Shield className="w-4 h-4" /> Kích hoạt Full Access</>
                }
              </button>
            )}
          </div>

          <div className="card text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-400 mb-2">Thông tin Admin</p>
            <p>• Email admin được đặt qua biến môi trường <span className="font-mono text-slate-400">ADMIN_EMAIL</span></p>
            <p>• Admin luôn bypass kiểm tra Pro (requirePro middleware)</p>
            <p>• Admin không thể bị xoá từ panel</p>
            <p>• Sau khi kích hoạt, dùng tất cả tính năng Pro để test</p>
          </div>
        </div>
      )}
    </div>
  );
}
