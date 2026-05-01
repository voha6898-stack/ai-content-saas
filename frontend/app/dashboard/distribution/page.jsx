'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Send, Clock, CheckCircle, XCircle, Loader2,
  Youtube, Music2, Facebook, Calendar, Trash2, RefreshCw,
} from 'lucide-react';
import { distributionAPI, contentAPI } from '@/lib/api';

const PLATFORMS = ['YouTube', 'TikTok', 'Facebook'];

const STATUS_STYLE = {
  queued:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  processing: 'bg-sky-500/10    text-sky-400    border-sky-500/30',
  completed:  'bg-green-500/10  text-green-400  border-green-500/30',
  failed:     'bg-red-500/10    text-red-400    border-red-500/30',
  cancelled:  'bg-slate-500/10  text-slate-400  border-slate-500/30',
  pending:    'bg-slate-700/30  text-slate-400  border-slate-600/30',
};

const PLATFORM_ICON = {
  YouTube:  <Youtube  className="w-4 h-4 text-red-400"  />,
  TikTok:   <Music2   className="w-4 h-4 text-pink-400" />,
  Facebook: <Facebook className="w-4 h-4 text-blue-400" />,
};

export default function DistributionPage() {
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [total, setTotal]       = useState(0);

  // Form state
  const [recentContent, setRecentContent] = useState([]);
  const [form, setForm] = useState({ contentId: '', platform: 'YouTube', scheduledAt: '' });
  const [scheduling, setScheduling] = useState(false);
  const [formMsg, setFormMsg]       = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await distributionAPI.getJobs({ limit: 20 });
      setJobs(data.items);
      setTotal(data.pagination.total);
    } catch {} finally { setLoading(false); }
  };

  const fetchRecentContent = async () => {
    try {
      const { data } = await contentAPI.getHistory(1, 20);
      setRecentContent(data.items);
    } catch {}
  };

  useEffect(() => { fetchJobs(); fetchRecentContent(); }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.contentId) { setFormMsg('Chọn nội dung trước'); return; }
    setScheduling(true); setFormMsg('');
    try {
      await distributionAPI.schedule({
        contentId:   form.contentId,
        platform:    form.platform,
        scheduledAt: form.scheduledAt || null,
      });
      setFormMsg('✅ Đã thêm vào queue!');
      setForm((f) => ({ ...f, contentId: '', scheduledAt: '' }));
      fetchJobs();
    } catch (err) {
      setFormMsg(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setScheduling(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Huỷ lịch đăng này?')) return;
    try {
      await distributionAPI.cancelJob(id);
      setJobs((prev) => prev.map((j) => j._id === id ? { ...j, status: 'cancelled' } : j));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể huỷ');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Auto Distribution</h1>
          <p className="text-slate-400 text-sm mt-1">Lên lịch đăng tự động lên YouTube, TikTok, Facebook</p>
        </div>
        <button onClick={fetchJobs} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Form ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Send className="w-5 h-5 text-sky-400" />
            <h2 className="font-semibold">Lên lịch đăng</h2>
          </div>

          {formMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm mb-4 border ${formMsg.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
              {formMsg}
            </div>
          )}

          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Chọn nội dung</label>
              <select
                value={form.contentId}
                onChange={(e) => setForm((f) => ({ ...f, contentId: e.target.value }))}
                className="input-field"
              >
                <option value="">-- Chọn nội dung --</option>
                {recentContent.map((c) => (
                  <option key={c._id} value={c._id}>
                    [{c.platform}] {c.output?.title?.substring(0, 50)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nền tảng</label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} type="button"
                    onClick={() => setForm((f) => ({ ...f, platform: p }))}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all
                      ${form.platform === p ? 'border-sky-500/60 bg-sky-500/10 text-sky-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                    {PLATFORM_ICON[p]} {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Thời gian đăng <span className="text-slate-500">(để trống = đăng ngay)</span>
              </label>
              <input type="datetime-local" value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className="input-field" min={new Date().toISOString().slice(0, 16)} />
            </div>

            <button type="submit" disabled={scheduling} className="btn-primary w-full flex items-center justify-center gap-2">
              {scheduling ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><Calendar className="w-4 h-4" /> {form.scheduledAt ? 'Lên lịch' : 'Đăng ngay'}</>}
            </button>
          </form>
        </div>

        {/* ── Queue list ── */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Queue ({total} jobs)</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : jobs.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">Chưa có job nào. Hãy lên lịch đăng đầu tiên!</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="shrink-0">{PLATFORM_ICON[job.platform]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.contentId?.output?.title || job.contentId?.topic || '—'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {job.scheduledAt ? `Lên lịch: ${new Date(job.scheduledAt).toLocaleString('vi-VN')}` : 'Đăng ngay'}
                      {job.result?.postedAt && ` · Đã đăng: ${new Date(job.result.postedAt).toLocaleString('vi-VN')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[job.status] || STATUS_STYLE.pending}`}>
                      {job.status}
                    </span>
                    {job.result?.postUrl && (
                      <a href={job.result.postUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                        <ArrowLeft className="w-3.5 h-3.5 rotate-[135deg]" />
                      </a>
                    )}
                    {['queued', 'pending'].includes(job.status) && (
                      <button onClick={() => handleCancel(job._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
