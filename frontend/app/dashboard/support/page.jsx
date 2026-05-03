'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy, Plus, ChevronLeft, Loader2, Send,
  Clock, CheckCircle, AlertCircle, XCircle, MessageSquare,
} from 'lucide-react';
import { supportAPI } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META = {
  open:        { label: 'Mở',          color: 'bg-sky-500/10 border-sky-500/30 text-sky-400',    icon: Clock        },
  in_progress: { label: 'Đang xử lý',  color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: AlertCircle },
  resolved:    { label: 'Đã giải quyết',color: 'bg-green-500/10 border-green-500/30 text-green-400',  icon: CheckCircle },
  closed:      { label: 'Đã đóng',     color: 'bg-slate-700 border-slate-600 text-slate-400',    icon: XCircle      },
};

const CATEGORIES = {
  technical: 'Lỗi kỹ thuật',
  billing:   'Thanh toán',
  feature:   'Yêu cầu tính năng',
  other:     'Khác',
};

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '';

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.open;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${m.color}`}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

// ── Create Form ───────────────────────────────────────────────────────────────

function CreateForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ subject: '', category: 'technical', description: '', priority: 'normal' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await supportAPI.create(form);
      onCreated();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map((e) => e.msg).join(', ') : (err.response?.data?.message || 'Lỗi gửi yêu cầu'));
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 max-w-2xl">
      <h2 className="font-semibold text-base flex items-center gap-2">
        <LifeBuoy className="w-4 h-4 text-sky-400" /> Gửi yêu cầu hỗ trợ
      </h2>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Tiêu đề *</label>
        <input value={form.subject} onChange={(e) => set('subject', e.target.value)}
          placeholder="Mô tả ngắn vấn đề của bạn" maxLength={200}
          className="input-field w-full" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Danh mục *</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}
            className="input-field w-full">
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Mức độ ưu tiên</label>
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
            className="input-field w-full">
            <option value="low">Thấp</option>
            <option value="normal">Bình thường</option>
            <option value="high">Cao</option>
            <option value="urgent">Khẩn cấp</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Mô tả chi tiết *</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
          placeholder="Mô tả đầy đủ vấn đề, các bước tái hiện lỗi (nếu có)..."
          rows={5} maxLength={3000}
          className="input-field w-full resize-none" required />
        <p className="text-[11px] text-slate-600 mt-1 text-right">{form.description.length}/3000</p>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Gửi yêu cầu
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Huỷ
        </button>
      </div>
    </form>
  );
}

// ── Ticket Detail ─────────────────────────────────────────────────────────────

function TicketDetail({ ticketId, onBack }) {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply,   setReply]   = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await supportAPI.getOne(ticketId);
      setTicket(data.data);
    } catch {} finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await supportAPI.addReply(ticketId, reply.trim());
      setReply('');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gửi phản hồi');
    } finally { setSending(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>;
  if (!ticket) return <div className="text-center py-16 text-slate-500">Không tìm thấy ticket.</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-base">{ticket.subject}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {CATEGORIES[ticket.category]} · {fmtDateTime(ticket.createdAt)}
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Thread */}
      <div className="space-y-3">
        {ticket.replies.map((r, i) => (
          <div key={i}
            className={`card ${r.senderRole === 'admin'
              ? 'border-sky-500/20 bg-sky-500/5'
              : 'border-slate-700'}`}>
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

      {/* Reply box */}
      {ticket.status !== 'closed' && (
        <form onSubmit={sendReply} className="card space-y-3">
          <label className="text-xs text-slate-400">Phản hồi thêm</label>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)}
            placeholder="Nhập nội dung phản hồi..." rows={3}
            className="input-field w-full resize-none" />
          <button type="submit" disabled={sending || !reply.trim()}
            className="btn-primary flex items-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gửi
          </button>
        </form>
      )}

      {ticket.status === 'closed' && (
        <div className="text-center text-sm text-slate-500 py-4">Ticket đã đóng.</div>
      )}
    </div>
  );
}

// ── Ticket List ───────────────────────────────────────────────────────────────

function TicketList({ onSelect, refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const { data } = await supportAPI.getList({ page: p, limit: 10, ...(s && { status: s }) });
      setTickets(data.data.tickets);
      setTotal(data.data.total);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, status); }, [page, status, refreshKey]);

  const pages = Math.ceil(total / 10);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
              ${status === s
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
            {s === '' ? `Tất cả (${total})` : STATUS_META[s]?.label}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-14">
          <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Chưa có yêu cầu hỗ trợ nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t._id} onClick={() => onSelect(t._id)}
              className="card w-full text-left border-slate-700 hover:border-slate-600 transition-colors relative">
              {t.hasUnreadReply && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sky-400" title="Có phản hồi mới" />
              )}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate pr-4">{t.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {CATEGORIES[t.category]} · {fmtDateTime(t.createdAt)}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Trang {page}/{pages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Trước</button>
            <button disabled={page === pages} onClick={() => setPage(page + 1)}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Sau →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [view,       setView]       = useState('list'); // 'list' | 'create' | 'detail'
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const goList = () => { setView('list'); setSelectedId(null); };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      {view !== 'detail' && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-sky-400" /> Hỗ trợ
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Gửi yêu cầu để được hỗ trợ bởi đội ngũ ContentAI</p>
          </div>
          {view === 'list' && (
            <button onClick={() => setView('create')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Tạo yêu cầu
            </button>
          )}
        </div>
      )}

      {view === 'list' && (
        <TicketList
          refreshKey={refreshKey}
          onSelect={(id) => { setSelectedId(id); setView('detail'); }} />
      )}

      {view === 'create' && (
        <CreateForm
          onCreated={() => { setRefreshKey((k) => k + 1); goList(); }}
          onCancel={goList} />
      )}

      {view === 'detail' && selectedId && (
        <TicketDetail ticketId={selectedId} onBack={goList} />
      )}
    </div>
  );
}
