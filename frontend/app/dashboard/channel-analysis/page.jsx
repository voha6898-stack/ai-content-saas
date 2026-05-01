'use client';

import { useState } from 'react';
import { channelAnalysisAPI } from '@/lib/api';
import {
  BarChart2, Zap, ChevronDown, ChevronUp, Trash2, RefreshCw,
  CheckCircle, AlertTriangle, XCircle, Star, Copy, Check,
  Wand2, TrendingUp, Shield, Target, DollarSign, Users, Layers, Eye,
} from 'lucide-react';

const PLATFORMS  = ['YouTube', 'TikTok', 'Facebook', 'Instagram'];
const GOALS      = ['Tăng Subscribers/Followers', 'Tăng Engagement', 'Monetize kênh', 'Xây dựng thương hiệu', 'Tăng doanh số'];
const GRADE_META = {
  'Elite':      { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: Star },
  'Strong':     { color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',         icon: TrendingUp },
  'Developing': { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',   icon: AlertTriangle },
  'Average':    { color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30',   icon: AlertTriangle },
  'Critical':   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         icon: XCircle },
};
const DIM_ICONS = {
  'Hook Effectiveness':           Zap,
  'Algorithm Alignment':          BarChart2,
  'Content Strategy Coherence':   Layers,
  'Audience Retention Architecture': Eye,
  'Viral Coefficient':            TrendingUp,
  'Monetization Readiness':       DollarSign,
  'Competitive Positioning':      Shield,
  'Brand Consistency':            Target,
};

function ScoreCircle({ score, grade }) {
  const meta  = GRADE_META[grade] || GRADE_META['Developing'];
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#38bdf8' : score >= 60 ? '#facc15' : score >= 45 ? '#fb923c' : '#f87171';
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${meta.bg} ${meta.color}`}>{grade}</span>
    </div>
  );
}

function DimensionCard({ dim }) {
  const [open, setOpen] = useState(false);
  const Icon = DIM_ICONS[dim.name] || BarChart2;
  const meta = GRADE_META[dim.grade] || GRADE_META['Developing'];
  const barColor = dim.score >= 75 ? 'bg-emerald-500' : dim.score >= 60 ? 'bg-sky-500' : dim.score >= 45 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className={`border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-all ${meta.bg}`}
      onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${meta.color}`} />
          <span className="text-sm font-medium truncate">{dim.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold ${meta.color}`}>{dim.score}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>{dim.grade}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>
      <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${dim.score}%` }} />
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t border-slate-700/50 pt-3">
          <p className="text-xs text-slate-300 leading-relaxed">{dim.insight}</p>
          <div className="flex items-start gap-2 bg-slate-800/60 rounded-lg p-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300 leading-relaxed">{dim.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="p-1.5 text-slate-500 hover:text-sky-400 transition-colors rounded-lg hover:bg-sky-500/10">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function RewriteSection({ rewrite }) {
  const [tab, setTab] = useState('bio');
  const tabs = [
    { id: 'bio',      label: 'Bio & Mô tả' },
    { id: 'titles',   label: 'Tiêu đề' },
    { id: 'hooks',    label: 'Hook' },
    { id: 'ctas',     label: 'CTA' },
    { id: 'hashtags', label: 'Hashtag' },
    { id: 'pillars',  label: 'Content Pillars' },
    { id: 'posting',  label: 'Lịch đăng' },
  ];
  return (
    <div className="card mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Rewrite Hoàn Chỉnh</h2>
      </div>
      {rewrite._rewriteStrategy && (
        <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <p className="text-sm text-purple-300 leading-relaxed">{rewrite._rewriteStrategy}</p>
        </div>
      )}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bio' && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Channel Bio</span>
              <CopyBtn text={rewrite.channelBio || ''} />
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{rewrite.channelBio}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Channel Description</span>
              <CopyBtn text={rewrite.channelDescription || ''} />
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{rewrite.channelDescription}</p>
          </div>
        </div>
      )}

      {tab === 'titles' && (
        <div className="space-y-3">
          {(rewrite.titleTemplates || []).map((t, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white leading-snug">{t.template}</p>
                <CopyBtn text={t.template} />
              </div>
              <p className="text-xs text-purple-400">⚡ {t.psychTrigger}</p>
              {t.example && <p className="text-xs text-slate-400 italic">→ {t.example}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'hooks' && (
        <div className="space-y-3">
          {(rewrite.hookTemplates || []).map((h, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white leading-snug">"{h.hook}"</p>
                <CopyBtn text={h.hook} />
              </div>
              <p className="text-xs text-sky-400">🧠 {h.mechanism}</p>
              {h.variant && <span className="text-[10px] px-2 py-0.5 bg-slate-700 rounded-full text-slate-400">{h.variant}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'ctas' && (
        <div className="space-y-3">
          {(rewrite.ctaScripts || []).map((c, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">{c.placement}</span>
                <CopyBtn text={c.script} />
              </div>
              <p className="text-sm text-white leading-relaxed">"{c.script}"</p>
              {c.goal && <p className="text-xs text-slate-400">→ Goal: {c.goal}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'hashtags' && (
        <div className="space-y-4">
          {[
            { key: 'tier1', label: 'Tier 1 — Broad (1M+ posts)', color: 'text-sky-400' },
            { key: 'tier2', label: 'Tier 2 — Mid-tier (100K-1M)', color: 'text-emerald-400' },
            { key: 'tier3', label: 'Tier 3 — Niche (<100K)', color: 'text-purple-400' },
            { key: 'branded', label: 'Branded — Của kênh', color: 'text-yellow-400' },
          ].map(({ key, label, color }) => (
            <div key={key} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</span>
                <CopyBtn text={(rewrite.hashtagStrategy?.[key] || []).join(' ')} />
              </div>
              <div className="flex flex-wrap gap-2">
                {(rewrite.hashtagStrategy?.[key] || []).map((h, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-slate-700 rounded-full text-slate-300">{h}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pillars' && (
        <div className="space-y-3">
          {(rewrite.contentPillarsRewrite || []).map((p, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{p.pillar}</span>
                <span className="text-sm font-bold text-purple-400">{p.percentage}%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{p.why}</p>
              <p className="text-xs text-sky-400">📌 {p.formatExample}</p>
              {p.algorithmSignal && <p className="text-xs text-emerald-400">🔔 Signal: {p.algorithmSignal}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'posting' && rewrite.postingStrategy && (
        <div className="space-y-3">
          {[
            { label: 'Tần suất đăng', value: rewrite.postingStrategy.frequency },
            { label: 'Thời điểm tốt nhất', value: rewrite.postingStrategy.optimalTimes },
            { label: 'Format Mix', value: rewrite.postingStrategy.formatMix },
            { label: 'Kế hoạch Tuần 1', value: rewrite.postingStrategy.firstWeekPlan },
          ].map(({ label, value }) => value ? (
            <div key={label} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                <CopyBtn text={value} />
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{value}</p>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

export default function ChannelAnalysisPage() {
  const [form, setForm] = useState({
    platform: 'YouTube', handle: '', niche: '', goal: GOALS[0],
    mode: 'deep',
    metrics: { subscribers: '', avgViews: '', engagementRate: '', postFrequency: '' },
    sampleContent: '',
  });
  const [loading,   setLoading]   = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [history,   setHistory]   = useState([]);
  const [histPage,  setHistPage]  = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setMetric = (k, v) => setForm(f => ({ ...f, metrics: { ...f.metrics, [k]: v } }));

  const handleAnalyze = async () => {
    if (!form.niche.trim()) return setError('Vui lòng nhập niche/topic của kênh.');
    setError(''); setLoading(true); setResult(null);
    try {
      const { data } = await channelAnalysisAPI.analyze(form);
      setResult(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi phân tích, thử lại.');
    } finally { setLoading(false); }
  };

  const handleRewrite = async () => {
    if (!result) return;
    setRewriting(true);
    try {
      const { data } = await channelAnalysisAPI.rewrite(result._id);
      setResult(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi rewrite, thử lại.');
    } finally { setRewriting(false); }
  };

  const loadHistory = async (page = 1) => {
    try {
      const { data } = await channelAnalysisAPI.getHistory(page);
      setHistory(data.items || []);
      setHistTotal(data.pagination?.total || 0);
      setHistPage(page);
      setShowHistory(true);
    } catch {}
  };

  const loadOne = async (id) => {
    try {
      const { data } = await channelAnalysisAPI.getOne(id);
      setResult(data.data);
      setShowHistory(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const analysis = result?.analysis;
  const rewrite  = result?.rewrite;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-sky-400" />
            Channel Audit AI
          </h1>
          <p className="text-sm text-slate-400 mt-1">Phân tích chiều sâu + Rewrite toàn bộ kênh theo chuẩn thuật toán</p>
        </div>
        <button onClick={() => loadHistory(1)} className="btn-secondary text-xs px-3 py-2">
          Lịch sử
        </button>
      </div>

      {/* Form */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-white">Thông tin kênh</h2>

        {/* Platform + Mode */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Platform</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => set('platform', p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.platform === p ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Mode phân tích</label>
            <div className="flex gap-2">
              {[
                { id: 'quick', label: '⚡ Quick', sub: 'Groq ~15s' },
                { id: 'deep',  label: '🔬 Deep',  sub: 'Gemini ~35s' },
              ].map(m => (
                <button key={m.id} onClick={() => set('mode', m.id)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${form.mode === m.id ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  {m.label}<br /><span className="opacity-60">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Handle + Niche */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Channel Handle (tuỳ chọn)</label>
            <input className="input" placeholder="@tencuaban hoặc tên kênh" value={form.handle} onChange={e => set('handle', e.target.value)} />
          </div>
          <div>
            <label className="label">Niche / Topic kênh *</label>
            <input className="input" placeholder="vd: tài chính cá nhân, fitness, du lịch, crypto..." value={form.niche} onChange={e => set('niche', e.target.value)} />
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="label">Mục tiêu hiện tại</label>
          <div className="flex gap-2 flex-wrap">
            {GOALS.map(g => (
              <button key={g} onClick={() => set('goal', g)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${form.goal === g ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div>
          <label className="label">Thông số kênh (tuỳ chọn — AI sẽ chuẩn hơn nếu có)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'subscribers',    ph: 'Subscribers (vd: 5K)' },
              { key: 'avgViews',       ph: 'Avg Views (vd: 800)' },
              { key: 'engagementRate', ph: 'ER% (vd: 3.5%)' },
              { key: 'postFrequency',  ph: 'Tần suất (vd: 3/tuần)' },
            ].map(({ key, ph }) => (
              <input key={key} className="input text-xs" placeholder={ph} value={form.metrics[key]} onChange={e => setMetric(key, e.target.value)} />
            ))}
          </div>
        </div>

        {/* Sample content */}
        <div>
          <label className="label">Nội dung mẫu (tuỳ chọn — paste 1-3 tiêu đề / caption để AI phân tích chính xác hơn)</label>
          <textarea className="input min-h-[90px] text-xs" placeholder="Dán tiêu đề video, caption bài đăng, hoặc mô tả kênh hiện tại..."
            value={form.sampleContent} onChange={e => set('sampleContent', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button onClick={handleAnalyze} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />{form.mode === 'quick' ? 'Đang scan nhanh...' : 'Đang phân tích sâu...'}</> : <><BarChart2 className="w-4 h-4" />Phân tích kênh</>}
        </button>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in duration-500">

          {/* Score + Overall */}
          <div className="card">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle score={analysis.overallScore} grade={analysis.overallGrade} />
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Overall Diagnosis</p>
                  <p className="text-slate-200 leading-relaxed">{analysis.overallInsight}</p>
                </div>
                {analysis._reasoning?.compoundingWeakness && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-400 font-semibold mb-0.5">⚠️ Compounding Weakness</p>
                    <p className="text-xs text-slate-300">{analysis._reasoning.compoundingWeakness}</p>
                  </div>
                )}
                {analysis.competitorBenchmark && (
                  <p className="text-xs text-slate-400 italic">{analysis.competitorBenchmark}</p>
                )}
              </div>
            </div>
          </div>

          {/* 8 Dimensions */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4">8 Chiều Đánh Giá</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(analysis.dimensions || []).map((d, i) => <DimensionCard key={i} dim={d} />)}
            </div>
          </div>

          {/* Strengths + Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4" /> Điểm mạnh
              </h3>
              <ul className="space-y-2">
                {(analysis.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4" /> Điểm yếu cần sửa
              </h3>
              <ul className="space-y-2">
                {(analysis.weaknesses || []).map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-red-400 shrink-0 mt-0.5">✗</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Priority Actions */}
          {(analysis.priorityActions || []).length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">🎯 Priority Actions — Xếp theo ROI</h2>
              <div className="space-y-3">
                {(analysis.priorityActions || []).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-700 text-slate-400'}`}>
                      {a.rank || i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{a.action}</p>
                      {a.roi && <p className="text-xs text-slate-400 mt-0.5">{a.roi}</p>}
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {a.impact && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${a.impact === 'High' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>Impact: {a.impact}</span>}
                        {a.effort && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${a.effort === 'Low' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>Effort: {a.effort}</span>}
                        {a.timeline && <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">{a.timeline}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 30-day roadmap */}
          {(analysis.thirtyDayRoadmap || []).length > 0 && (
            <div className="card">
              <button className="flex items-center justify-between w-full" onClick={() => setRoadmapOpen(!roadmapOpen)}>
                <h2 className="font-semibold text-white">📅 30-Day Roadmap</h2>
                {roadmapOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {roadmapOpen && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(analysis.thirtyDayRoadmap || []).map((w, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">{w.week}</span>
                        <span className="text-sm font-semibold text-white">{w.focus}</span>
                      </div>
                      <ul className="space-y-1">
                        {(w.actions || []).map((a, j) => (
                          <li key={j} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <span className="text-sky-500 shrink-0">•</span>{a}
                          </li>
                        ))}
                      </ul>
                      {w.successMetric && (
                        <p className="text-[10px] text-emerald-400 border-t border-slate-700 pt-2">✓ {w.successMetric}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rewrite CTA */}
          {!rewrite && (
            <div className="card bg-gradient-to-r from-purple-500/10 to-sky-500/10 border-purple-500/20">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <h2 className="font-bold text-white text-lg">✨ Rewrite Toàn Bộ Kênh</h2>
                  <p className="text-sm text-slate-300 mt-1">Gemini sẽ viết lại bio, tiêu đề, hook, CTA, hashtag, content pillars — tất cả theo đúng chuẩn kênh của bạn.</p>
                </div>
                <button onClick={handleRewrite} disabled={rewriting}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap shrink-0">
                  {rewriting ? <><RefreshCw className="w-4 h-4 animate-spin" />Đang viết lại...</> : <><Wand2 className="w-4 h-4" />Rewrite Everything</>}
                </button>
              </div>
            </div>
          )}

          {/* Rewrite results */}
          {rewrite && <RewriteSection rewrite={rewrite} />}
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Lịch sử phân tích ({histTotal})</h2>
            <button onClick={() => setShowHistory(false)} className="text-xs text-slate-500 hover:text-slate-300">Đóng</button>
          </div>
          <div className="space-y-2">
            {history.map(h => {
              const meta = GRADE_META[h.analysis?.overallGrade] || GRADE_META['Developing'];
              return (
                <div key={h._id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => loadOne(h._id)}>
                  <div className={`text-lg font-black w-10 text-center shrink-0 ${meta.color}`}>{h.analysis?.overallScore ?? '—'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{h.handle || h.niche}</p>
                    <p className="text-xs text-slate-400">{h.platform} · {h.mode === 'deep' ? '🔬 Deep' : '⚡ Quick'} · {new Date(h.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>{h.analysis?.overallGrade}</span>
                    {h.rewrite && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Rewritten</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {histTotal > 6 && (
            <div className="flex gap-2 mt-4 justify-center">
              <button disabled={histPage <= 1} onClick={() => loadHistory(histPage - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Trước</button>
              <button disabled={histPage * 6 >= histTotal} onClick={() => loadHistory(histPage + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Tiếp →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
