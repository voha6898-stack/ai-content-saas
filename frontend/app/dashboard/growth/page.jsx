'use client';

import { useState } from 'react';
import {
  Rocket, Loader2, Youtube, Music2, Facebook, Target,
  Users, Zap, Hash, TrendingUp, Copy, Check, Trash2,
  ChevronDown, ChevronUp, Calendar, Search, Flame, Star,
  BarChart3, BookOpen, Lightbulb,
} from 'lucide-react';
import { growthAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ── Config ────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'YouTube',  label: 'YouTube',  icon: <Youtube  className="w-4 h-4" />, color: 'border-red-500/60  bg-red-500/10  text-red-400'  },
  { value: 'TikTok',   label: 'TikTok',   icon: <Music2   className="w-4 h-4" />, color: 'border-pink-500/60 bg-pink-500/10 text-pink-400' },
  { value: 'Facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" />, color: 'border-blue-500/60 bg-blue-500/10 text-blue-400' },
];

const GOALS = [
  'Reach 1K followers in 30 days',
  'Reach 10K followers in 30 days',
  'Get first viral video (100K+ views)',
  'Start monetization (YouTube Partner)',
  'Build a brand & community',
  'Drive traffic to business/product',
];

const FORMAT_COLOR = {
  Short:  'bg-pink-500/20   text-pink-300',
  Long:   'bg-blue-500/20   text-blue-300',
  Story:  'bg-purple-500/20 text-purple-300',
  Live:   'bg-red-500/20    text-red-300',
  Collab: 'bg-green-500/20  text-green-300',
};

// ── Copy hook ─────────────────────────────────────────────────────────────────

function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState(null);
  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), timeout);
    });
  };
  return { copied, copy };
}

// ── Week block for 30-day table ───────────────────────────────────────────────

function WeekBlock({ week, days, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-semibold text-sm text-slate-300">
          Week {week} — Day {days[0].day} to {days[days.length - 1].day}
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{days.length} posts</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-slate-800/60">
          {days.map((d) => {
            const fmtColor = FORMAT_COLOR[d.format] || 'bg-slate-500/20 text-slate-300';
            return (
              <div key={d.day} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-slate-400">{d.day}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${fmtColor}`}>
                        {d.format}
                      </span>
                      <p className="text-sm font-medium text-slate-200 leading-snug">{d.idea}</p>
                    </div>
                    <p className="text-xs text-orange-300 italic leading-relaxed">
                      <span className="text-slate-500 not-italic mr-1">Hook:</span>"{d.hook}"
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="text-green-500 mr-1">CTA:</span>{d.cta}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Growth Plan Result ────────────────────────────────────────────────────────

function GrowthPlanResult({ plan, onDelete }) {
  const { copy, copied } = useCopy();
  const [deleted, setDeleted] = useState(false);
  const [section, setSection] = useState('overview');
  const o = plan.output;

  const handleDelete = async () => {
    if (!confirm('Xoá kế hoạch này?')) return;
    try { await growthAPI.delete(plan._id); setDeleted(true); onDelete(plan._id); } catch {}
  };

  if (deleted) return null;

  // Split 30 days into weeks
  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const slice = (o.thirtyDayPlan || []).slice(w * 7, w * 7 + (w === 3 ? 9 : 7));
    if (slice.length) weeks.push(slice);
  }

  const TABS = [
    { id: 'overview', label: 'Overview',   icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'plan',     label: '30-Day Plan', icon: <Calendar  className="w-3.5 h-3.5" /> },
    { id: 'seo',      label: 'SEO',         icon: <Search    className="w-3.5 h-3.5" /> },
    { id: 'viral',    label: 'Viral Formula',icon: <Flame    className="w-3.5 h-3.5" /> },
  ];

  const allKeywords = o.seoStrategy?.keywords?.join(', ') || '';

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-bold text-lg">30-Day Growth Plan</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
              ${plan.platform === 'YouTube' ? 'bg-red-500/20 text-red-400' :
                plan.platform === 'TikTok'  ? 'bg-pink-500/20 text-pink-400' :
                                              'bg-blue-500/20 text-blue-400'}`}>
              {plan.platform}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-1"><span className="text-slate-500">Topic:</span> {plan.topic}</p>
          <p className="text-xs text-slate-500"><span className="text-slate-600">Goal:</span> {plan.goal}</p>
        </div>
        <button onClick={handleDelete} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 rounded-xl p-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center
              ${section === t.id ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {section === 'overview' && (
        <div className="space-y-4">
          {/* Channel Positioning */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
              <Target className="w-4 h-4" /> Channel Positioning
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-200 leading-relaxed">{o.channelPositioning?.description}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Target Audience</p>
                <p className="text-sm text-slate-200 leading-relaxed">{o.channelPositioning?.targetAudience}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Unique Differentiator</p>
                <p className="text-sm text-slate-200 leading-relaxed">{o.channelPositioning?.uniquePoint}</p>
              </div>
            </div>
          </div>

          {/* Content Pillars */}
          <div>
            <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4" /> Content Pillars
            </h3>
            <div className="space-y-2.5">
              {(o.contentPillars || []).map((pillar, i) => {
                const colors = ['bg-orange-500', 'bg-sky-500', 'bg-green-500'];
                const textColors = ['text-orange-400', 'text-sky-400', 'text-green-400'];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${textColors[i] || 'text-slate-400'}`}>{pillar.name}</span>
                      <span className={`text-xs font-bold ${textColors[i] || 'text-slate-400'}`}>{pillar.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-1">
                      <div className={`h-2 rounded-full ${colors[i] || 'bg-slate-500'}`} style={{ width: `${pillar.percentage}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">{pillar.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 30-DAY PLAN ── */}
      {section === 'plan' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              {o.thirtyDayPlan?.length || 0} ngày · {weeks.length} tuần
            </h3>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(FORMAT_COLOR).map(([fmt, cls]) => (
                <span key={fmt} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{fmt}</span>
              ))}
            </div>
          </div>
          {weeks.map((days, wi) => (
            <WeekBlock key={wi} week={wi + 1} days={days} defaultOpen={wi === 0} />
          ))}
        </div>
      )}

      {/* ── SEO ── */}
      {section === 'seo' && (
        <div className="space-y-4">
          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                <Search className="w-4 h-4" /> 10 Keywords
              </h3>
              <button onClick={() => copy(allKeywords, 'kw')} className="text-xs text-slate-500 hover:text-sky-400 flex items-center gap-1">
                {copied === 'kw' ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy all</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(o.seoStrategy?.keywords || []).map((kw, i) => (
                <span key={i} className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-300">{kw}</span>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                <Hash className="w-4 h-4" /> 10 Hashtags
              </h3>
              <button onClick={() => copy((o.seoStrategy?.hashtags || []).join(' '), 'ht')} className="text-xs text-slate-500 hover:text-sky-400 flex items-center gap-1">
                {copied === 'ht' ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy all</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(o.seoStrategy?.hashtags || []).map((tag, i) => (
                <span key={i} className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-300">{tag}</span>
              ))}
            </div>
          </div>

          {/* Title Templates */}
          <div>
            <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" /> 5 Viral Title Templates
            </h3>
            <div className="space-y-2">
              {(o.seoStrategy?.titleTemplates || []).map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-slate-900/50 rounded-xl px-3 py-2.5 border border-slate-800">
                  <span className="text-xs font-bold text-yellow-500 mt-0.5 shrink-0">#{i + 1}</span>
                  <p className="text-sm text-slate-200 leading-snug">{t}</p>
                  <button onClick={() => copy(t, `title-${i}`)} className="ml-auto shrink-0 p-1 text-slate-600 hover:text-sky-400">
                    {copied === `title-${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── VIRAL FORMULA ── */}
      {section === 'viral' && (
        <div className="space-y-4">
          {/* Hook Templates */}
          <div>
            <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4" /> 5 Hook Templates
            </h3>
            <div className="space-y-2">
              {(o.viralFormula?.hookTemplates || []).map((hook, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2.5">
                  <span className="text-xs font-bold text-orange-500 mt-0.5 shrink-0">{i + 1}</span>
                  <p className="text-sm text-slate-200 leading-snug italic">"{hook}"</p>
                  <button onClick={() => copy(hook, `hook-${i}`)} className="ml-auto shrink-0 p-1 text-slate-600 hover:text-orange-400">
                    {copied === `hook-${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div>
            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4" /> 3 Viral Content Formats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(o.viralFormula?.contentTypes || []).map((ct, i) => (
                <div key={i} className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm font-bold text-purple-400">{i + 1}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{ct}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GrowthPage() {
  const { user } = useAuth();

  const [platform, setPlatform] = useState('YouTube');
  const [goal,     setGoal]     = useState(GOALS[0]);
  const [topic,    setTopic]    = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [useCustomGoal, setUseCustomGoal] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [plan,     setPlan]     = useState(null);
  const [history,  setHistory]  = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    const finalGoal = useCustomGoal ? customGoal.trim() : goal;
    if (!topic.trim() || !finalGoal) return;
    setError(''); setLoading(true); setPlan(null);
    try {
      const { data } = await growthAPI.generate({ topic: topic.trim(), platform, goal: finalGoal });
      setPlan(data.plan);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Có lỗi xảy ra, thử lại.');
    } finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    setHistory((prev) => prev.filter((p) => p._id !== id));
    if (plan?._id === id) setPlan(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Rocket className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold">30-Day Growth Plan</h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            Miễn phí
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          AI Growth Strategist tạo kế hoạch tăng trưởng viral + SEO 30 ngày cho YouTube · TikTok · Facebook
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── FORM ── */}
        <div className="xl:col-span-2">
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" /> Tạo kế hoạch mới
            </h2>

            {user?.plan === 'free' && user?.credits !== undefined && user.credits <= 2 && (
              <div className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs">
                Còn {user.credits} lượt dùng miễn phí
              </div>
            )}

            {error && (
              <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Nền tảng</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setPlatform(p.value)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all
                        ${platform === p.value ? p.color : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Chủ đề kênh</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    platform === 'YouTube' ? 'VD: Personal finance for millennials, crypto investing, passive income strategies'
                    : platform === 'TikTok' ? 'VD: Day trading tips, money mindset, side hustle ideas for Gen Z'
                    : 'VD: Entrepreneurship stories, business growth hacks, startup advice'
                  }
                  rows={3} required maxLength={300}
                  className="input-field resize-none text-sm"
                />
                <p className="text-[11px] text-slate-600 mt-1 text-right">{topic.length}/300</p>
              </div>

              {/* Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Mục tiêu</label>
                  <button type="button" onClick={() => setUseCustomGoal((v) => !v)}
                    className="text-[11px] text-sky-400 hover:underline">
                    {useCustomGoal ? 'Chọn có sẵn' : 'Tự nhập'}
                  </button>
                </div>
                {useCustomGoal ? (
                  <input value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="VD: Get 50K views on first video, build email list..." maxLength={200}
                    className="input-field text-sm" required />
                ) : (
                  <div className="space-y-1.5">
                    {GOALS.map((g) => (
                      <button key={g} type="button" onClick={() => setGoal(g)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all
                          ${goal === g
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'}`}>
                        <Target className="w-3 h-3 inline mr-1.5 opacity-60" />{g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit"
                disabled={loading || !topic.trim() || (user?.plan === 'free' && user?.credits <= 0)}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xây kế hoạch...</>
                  : <><Rocket className="w-4 h-4" /> Tạo 30-Day Growth Plan</>
                }
              </button>

              {user?.plan === 'free' && user?.credits <= 0 && (
                <p className="text-center text-xs text-slate-500">
                  Hết lượt miễn phí — <a href="/pricing" className="text-sky-400 hover:underline">Nâng cấp Pro</a>
                </p>
              )}
            </form>
          </div>
        </div>

        {/* ── RESULT ── */}
        <div className="xl:col-span-3 space-y-5">
          {loading && (
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                <div>
                  <p className="font-medium text-sm">Đang xây dựng kế hoạch 30 ngày...</p>
                  <p className="text-xs text-slate-500 mt-0.5">AI đang phân tích niche, tạo 30 content ideas và chiến lược SEO</p>
                </div>
              </div>
              <div className="space-y-2">
                {['Channel Positioning...', 'Content Pillars...', '30 ngày content ideas...', 'SEO Keywords & Hashtags...', 'Viral Formula...'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && plan && <GrowthPlanResult plan={plan} onDelete={handleDelete} />}

          {!loading && !plan && (
            <div className="card text-center py-16">
              <Rocket className="w-14 h-14 text-slate-800 mx-auto mb-4" />
              <p className="font-semibold text-slate-400 mb-1">Chưa có Growth Plan</p>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Nhập chủ đề kênh + chọn mục tiêu để AI tạo kế hoạch 30 ngày đầy đủ bao gồm content ideas, hook, SEO và viral formula
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
