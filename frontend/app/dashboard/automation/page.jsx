'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot, Plus, Play, Pause, Trash2, Loader2,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Clock,
  Zap, TrendingUp, FileText, Send, RefreshCw, Settings, Crown,
} from 'lucide-react';
import { automationAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const NICHES = ['technology', 'finance', 'lifestyle', 'food', 'travel', 'fitness', 'education', 'entertainment', 'business', 'gaming'];
const SOURCES = [
  { value: 'google_trends',    label: 'Google Trends'   },
  { value: 'youtube_trending', label: 'YouTube Trending' },
  { value: 'rss_vnexpress',    label: 'VnExpress'        },
  { value: 'rss_tuoitre',      label: 'Tuổi Trẻ'         },
  { value: 'rss_dantri',       label: 'Dân Trí'           },
];
const PLATFORMS = ['YouTube', 'TikTok', 'Facebook', 'Instagram'];

const STATUS_STYLE = {
  running:   'bg-sky-500/10    text-sky-400    border-sky-500/30',
  completed: 'bg-green-500/10  text-green-400  border-green-500/30',
  failed:    'bg-red-500/10    text-red-400    border-red-500/30',
  partial:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

const STEP_LABELS = {
  fetchTrends:     'Lấy trends',
  analyzeTrends:   'Phân tích AI',
  generateContent: 'Tạo content',
  monetize:        'Monetize',
  distribute:      'Đăng bài',
};

function RuleCard({ rule, onUpdate, onDelete, onTrigger }) {
  const [expanded,   setExpanded]   = useState(false);
  const [toggling,   setToggling]   = useState(false);
  const [triggering, setTriggering] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const { data } = await automationAPI.updateRule(rule._id, { isActive: !rule.isActive });
      onUpdate(data.rule);
    } catch {} finally { setToggling(false); }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await automationAPI.triggerRun(rule._id);
      onTrigger();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi chạy rule');
    } finally { setTriggering(false); }
  };

  return (
    <div className={`card border transition-colors ${rule.isActive ? 'border-sky-500/30 bg-sky-500/5' : 'border-slate-700'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rule.isActive ? 'bg-sky-500/20' : 'bg-slate-800'}`}>
          <Bot className={`w-5 h-5 ${rule.isActive ? 'text-sky-400' : 'text-slate-500'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold">{rule.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              rule.isActive
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
              {rule.isActive ? '● Đang chạy' : '○ Tắt'}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
            <span>Mỗi {rule.runEveryHours}h</span>
            <span>·</span>
            <span>Min score: {rule.minOverallScore}</span>
            <span>·</span>
            <span>{rule.maxTrendsPerRun} trends/lần</span>
            <span>·</span>
            <span className="text-slate-400">{rule.platforms.join(', ')}</span>
            {rule.autoDistribute && <span className="text-green-400">· Auto-post ON</span>}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { label: 'Runs',    value: rule.stats?.totalRuns            ?? 0 },
              { label: 'Content', value: rule.stats?.totalContentCreated  ?? 0 },
              { label: 'Posts',   value: rule.stats?.totalPostsPublished  ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/50 rounded-lg px-2.5 py-1.5 text-center">
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {rule.nextRunAt && (
            <p className="text-xs text-slate-600">
              Lần chạy tiếp: {new Date(rule.nextRunAt).toLocaleString('vi-VN')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleTrigger} disabled={triggering} title="Chạy ngay"
            className="p-2 rounded-xl hover:bg-sky-500/10 text-slate-400 hover:text-sky-400 transition-colors">
            {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={handleToggle} disabled={toggling}
            title={rule.isActive ? 'Tắt' : 'Bật'}
            className={`p-2 rounded-xl transition-colors ${
              rule.isActive
                ? 'hover:bg-red-500/10 text-green-400 hover:text-red-400'
                : 'hover:bg-green-500/10 text-slate-400 hover:text-green-400'}`}>
            {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> :
             rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(rule._id)}
            className="p-2 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div><span className="text-slate-500">Nguồn: </span>{rule.trendSources?.join(', ')}</div>
          <div><span className="text-slate-500">Niche: </span>{rule.niches?.join(', ')}</div>
          <div><span className="text-slate-500">Auto distribute: </span>{rule.autoDistribute ? 'Có' : 'Không'}</div>
          <div><span className="text-slate-500">Auto monetize: </span>{rule.autoMonetize ? 'Có' : 'Không'}</div>
          <div><span className="text-slate-500">Max posts/ngày: </span>{rule.maxDailyPosts}</div>
          <div><span className="text-slate-500">Content/trend: </span>{rule.contentPerTrend} platforms</div>
        </div>
      )}
    </div>
  );
}

function RunCard({ run }) {
  const steps = Object.entries(run.steps || {});

  return (
    <div className="card border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[run.status] || STATUS_STYLE.running}`}>
          {run.status}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(run.startedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
          {run.duration ? ` · ${(run.duration / 1000).toFixed(1)}s` : ''}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {steps.map(([key, step]) => (
          <div key={key} className="text-center">
            <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center mb-1
              ${step.status === 'done'    ? 'bg-green-500/20 text-green-400' :
                step.status === 'error'   ? 'bg-red-500/20 text-red-400' :
                step.status === 'running' ? 'bg-sky-500/20 text-sky-400' :
                step.status === 'skipped' ? 'bg-slate-700 text-slate-500' :
                                            'bg-slate-800 text-slate-600'}`}>
              {step.status === 'done'    ? <CheckCircle className="w-3.5 h-3.5" /> :
               step.status === 'error'   ? <XCircle className="w-3.5 h-3.5" /> :
               step.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                           <Clock className="w-3.5 h-3.5" />}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">{STEP_LABELS[key]}</p>
            {(step.count ?? step.created ?? step.selected) !== undefined && (
              <p className="text-xs font-medium text-slate-300">
                {step.count ?? step.created ?? step.selected}
              </p>
            )}
          </div>
        ))}
      </div>

      {run.error && (
        <p className="text-xs text-red-400 mt-2 bg-red-500/10 rounded-lg px-2 py-1">{run.error}</p>
      )}
    </div>
  );
}

export default function AutomationPage() {
  const { user } = useAuth();
  const [rules,    setRules]    = useState([]);
  const [runs,     setRuns]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    isActive: true,
    trendSources:   ['google_trends', 'youtube_trending', 'rss_vnexpress'],
    niches:         ['technology', 'finance'],
    platforms:      ['TikTok', 'YouTube'],
    minOverallScore: 50,
    maxTrendsPerRun: 5,
    contentPerTrend: 2,
    runEveryHours:   12,
    autoDistribute:  false,
    autoMonetize:    true,
    maxDailyPosts:   10,
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, ru] = await Promise.all([
        automationAPI.getRules(),
        automationAPI.getRuns(),
      ]);
      setRules(r.data.rules || []);
      setRuns(ru.data.runs  || []);
    } catch (err) {
      // 403 = free user, không làm gì — banner đã hiện
      if (err.response?.status !== 403) console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!runs.some((r) => r.status === 'running')) return;
    const t = setInterval(fetchAll, 5000);
    return () => clearInterval(t);
  }, [runs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await automationAPI.createRule(form);
      setRules((prev) => [data.rule, ...prev]);
      setShowForm(false);
      setForm((f) => ({ ...f, name: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo rule');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xoá automation rule này?')) return;
    try {
      await automationAPI.deleteRule(id);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch {}
  };

  const toggle = (field, val) => setForm((f) => ({
    ...f,
    [field]: f[field].includes(val)
      ? f[field].filter((v) => v !== val)
      : [...f[field], val],
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-sky-400" /> Automation
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tự động: lấy trend → AI phân tích → tạo content → đăng bài → kiếm tiền
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo Rule
          </button>
        </div>
      </div>

      {/* Pro gate for free users */}
      {user?.plan === 'free' && (
        <div className="bg-gradient-to-br from-violet-500/10 via-sky-500/5 to-violet-500/10 border border-violet-500/30 rounded-2xl p-8 text-center mb-6">
          <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Automation chỉ dành cho Pro</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Nâng cấp để tự động lấy trend, tạo content và đăng bài 24/7 không cần làm thủ công.
          </p>
          <Link href="/pricing" className="btn-primary inline-flex items-center gap-2">
            <Crown className="w-4 h-4" /> Nâng cấp Pro — 199.000đ/tháng
          </Link>
        </div>
      )}

      {/* Pipeline flow */}
      <div className="card border-sky-500/20 bg-sky-500/5 mb-6">
        <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Pipeline tự động</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          {[
            { icon: TrendingUp, label: 'Fetch Trends', sub: 'Google · YouTube · RSS', color: 'text-orange-400' },
            { icon: Bot,        label: 'AI Analyze',   sub: 'Score viral + CPM',      color: 'text-sky-400'    },
            { icon: FileText,   label: 'Generate',     sub: 'Viral content',          color: 'text-green-400'  },
            { icon: Zap,        label: 'Monetize',     sub: 'Affiliate + CTA',        color: 'text-yellow-400' },
            { icon: Send,       label: 'Auto Post',    sub: 'YT · TikTok · FB',       color: 'text-red-400'    },
          ].map(({ icon: Icon, label, sub, color }, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="text-slate-700 text-lg hidden sm:block">→</div>}
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-1">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left: Rules + Create form ── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Create form */}
          {showForm && (
            <div className="card border-sky-500/30">
              <h2 className="font-semibold mb-5 flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-400" /> Tạo Automation Rule mới
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên rule *</label>
                  <input value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Tech Trends - TikTok & YouTube"
                    required className="input-field" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nguồn lấy trend</label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCES.map(({ value, label }) => (
                      <button key={value} type="button" onClick={() => toggle('trendSources', value)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                          ${form.trendSources.includes(value)
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Niche</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map((n) => (
                      <button key={n} type="button" onClick={() => toggle('niches', n)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all
                          ${form.niches.includes(n)
                            ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                            : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Platform tạo content</label>
                  <div className="flex gap-2 flex-wrap">
                    {PLATFORMS.map((p) => (
                      <button key={p} type="button" onClick={() => toggle('platforms', p)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                          ${form.platforms.includes(p)
                            ? 'bg-green-500/20 border-green-500/40 text-green-300'
                            : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Min score: <span className="text-sky-400 font-bold">{form.minOverallScore}</span>
                    </label>
                    <input type="range" min="20" max="90" value={form.minOverallScore}
                      onChange={(e) => setForm((f) => ({ ...f, minOverallScore: parseInt(e.target.value) }))}
                      className="w-full accent-sky-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Max trends/lần: <span className="text-sky-400 font-bold">{form.maxTrendsPerRun}</span>
                    </label>
                    <input type="range" min="1" max="15" value={form.maxTrendsPerRun}
                      onChange={(e) => setForm((f) => ({ ...f, maxTrendsPerRun: parseInt(e.target.value) }))}
                      className="w-full accent-sky-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Chạy mỗi</label>
                    <select value={form.runEveryHours}
                      onChange={(e) => setForm((f) => ({ ...f, runEveryHours: parseInt(e.target.value) }))}
                      className="input-field text-sm py-2">
                      {[3, 6, 12, 24, 48].map((h) => <option key={h} value={h}>{h} giờ</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Max posts/ngày</label>
                    <input type="number" min="1" max="50" value={form.maxDailyPosts}
                      onChange={(e) => setForm((f) => ({ ...f, maxDailyPosts: parseInt(e.target.value) }))}
                      className="input-field text-sm py-2" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  {[
                    { key: 'autoDistribute', label: 'Tự động đăng bài' },
                    { key: 'autoMonetize',   label: 'Tự động monetize' },
                    { key: 'isActive',       label: 'Bật ngay sau khi tạo' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded accent-sky-500" />
                      <span className="text-sm text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    disabled={creating || !form.name || !form.trendSources.length || !form.platforms.length}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {creating
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                      : <><Bot className="w-4 h-4" /> Tạo Rule</>}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">
                    Huỷ
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rules list */}
          {loading && rules.length === 0 ? (
            <div className="card flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : rules.length === 0 && !showForm ? (
            <div className="card text-center py-14">
              <Bot className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-300 mb-1">Chưa có automation rule nào</h3>
              <p className="text-slate-500 text-sm mb-5">
                Tạo rule để hệ thống tự động lấy trend, tạo content và đăng bài theo lịch.
              </p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-1.5 inline" /> Tạo rule đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <RuleCard key={rule._id} rule={rule}
                  onUpdate={(updated) =>
                    setRules((prev) => prev.map((r) => r._id === rule._id ? updated : r))}
                  onDelete={handleDelete}
                  onTrigger={fetchAll}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Run history ── */}
        <div className="xl:col-span-2">
          <div className="card sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" /> Lịch sử chạy
              </h2>
              {runs.some((r) => r.status === 'running') && (
                <span className="flex items-center gap-1.5 text-xs text-sky-400 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                  Đang chạy
                </span>
              )}
            </div>

            {runs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">
                Chưa có lần chạy nào.<br />
                <span className="text-xs">Bấm ▶ trên rule để chạy thử.</span>
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {runs.slice(0, 15).map((run) => <RunCard key={run._id} run={run} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
