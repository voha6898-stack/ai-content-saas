'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  GitBranch, Plus, Trash2, Loader2,
  CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { pipelineAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const NICHES = [
  'technology', 'finance', 'lifestyle', 'food', 'travel',
  'fitness', 'education', 'entertainment', 'business', 'gaming', 'other',
];
const PLATFORMS = ['all', 'YouTube', 'TikTok', 'Facebook', 'Instagram'];

const STATUS_STYLE = {
  pending:   'bg-slate-700/30  text-slate-400  border-slate-600',
  running:   'bg-sky-500/10    text-sky-400    border-sky-500/30',
  completed: 'bg-green-500/10  text-green-400  border-green-500/30',
  failed:    'bg-red-500/10    text-red-400    border-red-500/30',
  paused:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

const ITEM_STATUS_ICON = {
  pending:    <Clock        className="w-3.5 h-3.5 text-slate-500"  />,
  generating: <Loader2      className="w-3.5 h-3.5 text-sky-400 animate-spin" />,
  completed:  <CheckCircle  className="w-3.5 h-3.5 text-green-400" />,
  failed:     <XCircle      className="w-3.5 h-3.5 text-red-400"   />,
};

export default function PipelinePage() {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  // Form
  const [form, setForm] = useState({ name: '', niche: 'technology', platform: 'all', topicsText: '' });
  const [creating, setCreating]   = useState(false);
  const [formMsg, setFormMsg]     = useState('');

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const { data } = await pipelineAPI.getAll({ limit: 20 });
      setPipelines(data.items);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPipelines(); }, []);

  // Auto-refresh running pipelines
  useEffect(() => {
    const hasRunning = pipelines.some((p) => p.status === 'running');
    if (!hasRunning) return;
    const t = setInterval(fetchPipelines, 5000);
    return () => clearInterval(t);
  }, [pipelines]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const topics = form.topicsText.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!topics.length) { setFormMsg('Nhập ít nhất 1 topic'); return; }
    if (topics.length > 50) { setFormMsg('Tối đa 50 topics'); return; }
    setCreating(true); setFormMsg('');
    try {
      await pipelineAPI.create({ ...form, topics });
      setFormMsg('✅ Pipeline đã tạo và đang chạy!');
      setForm({ name: '', niche: 'technology', platform: 'all', topicsText: '' });
      fetchPipelines();
    } catch (err) {
      setFormMsg(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xoá pipeline này?')) return;
    try {
      await pipelineAPI.delete(id);
      setPipelines((prev) => prev.filter((p) => p._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!expandedItems[id]) {
      try {
        const { data } = await pipelineAPI.getStatus(id);
        setExpandedItems((prev) => ({ ...prev, [id]: data.items }));
      } catch {}
    }
  };

  if (user?.plan !== 'pro') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Pipeline chỉ dành cho Pro</h2>
        <p className="text-slate-400 mb-6">Nâng cấp để tạo nội dung hàng loạt, tự động.</p>
        <Link href="/pricing" className="btn-primary inline-flex items-center gap-2">Xem gói Pro</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Content Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">Generate nội dung hàng loạt theo niche</p>
        </div>
        <button onClick={fetchPipelines} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Create form ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">Tạo Pipeline mới</h2>
          </div>

          {formMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm mb-4 border ${formMsg.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
              {formMsg}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên Pipeline</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Tài chính cá nhân tháng 6" required className="input-field" maxLength={100} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Niche</label>
                <select value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))} className="input-field text-sm">
                  {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Platform</label>
                <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} className="input-field text-sm">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Topics <span className="text-slate-500">(mỗi dòng 1 topic, tối đa 50)</span>
              </label>
              <textarea value={form.topicsText}
                onChange={(e) => setForm((f) => ({ ...f, topicsText: e.target.value }))}
                placeholder={"5 cách kiếm tiền online\nĐầu tư chứng khoán cho người mới\nBudgeting với lương 10 triệu"}
                rows={6} required className="input-field resize-none text-sm" />
              <p className="text-xs text-slate-600 mt-1">
                {form.topicsText.split('\n').filter((t) => t.trim()).length} topics
              </p>
            </div>

            <button type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</> : <><GitBranch className="w-4 h-4" /> Chạy Pipeline</>}
            </button>
          </form>
        </div>

        {/* ── Pipeline list ── */}
        <div className="xl:col-span-2 space-y-4">
          {loading && pipelines.length === 0 ? (
            <div className="card flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : pipelines.length === 0 ? (
            <div className="card text-center py-12">
              <GitBranch className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Chưa có pipeline nào. Tạo pipeline đầu tiên!</p>
            </div>
          ) : pipelines.map((pl) => {
            const pct = pl.stats.total > 0 ? Math.round((pl.stats.completed / pl.stats.total) * 100) : 0;
            return (
              <div key={pl._id} className="card">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{pl.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border shrink-0 ${STATUS_STYLE[pl.status]}`}>
                        {pl.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {pl.niche} · {pl.platform} · {pl.topics.length} topics · {new Date(pl.createdAt).toLocaleDateString('vi-VN')}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${pl.status === 'failed' ? 'bg-red-500' : 'bg-sky-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {pl.stats.completed}/{pl.stats.total}
                        {pl.stats.failed > 0 && <span className="text-red-400"> ({pl.stats.failed} lỗi)</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleExpand(pl._id)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
                      {expanded === pl._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(pl._id)} className="p-2 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded items */}
                {expanded === pl._id && expandedItems[pl._id] && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 max-h-64 overflow-y-auto">
                    {expandedItems[pl._id].map((item) => (
                      <div key={item._id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-800/50">
                        {ITEM_STATUS_ICON[item.status]}
                        <span className="text-xs text-slate-500 w-20 shrink-0">{item.platform}</span>
                        <span className="text-sm truncate flex-1">
                          {item.contentId?.output?.title || item.topic}
                        </span>
                        {item.error && <span className="text-xs text-red-400 truncate max-w-[120px]">{item.error}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
