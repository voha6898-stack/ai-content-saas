'use client';

import { useState } from 'react';
import { channelAnalysisAPI } from '@/lib/api';
import {
  BarChart2, Zap, ChevronDown, ChevronUp, RefreshCw, History,
  CheckCircle, AlertTriangle, XCircle, Star, Copy, Check,
  Wand2, TrendingUp, Shield, Target, DollarSign, Layers, Eye,
  ArrowRight, Clock, ChevronRight, Sparkles, ScanSearch,
} from 'lucide-react';

/* ─── constants ─────────────────────────────────────────────────────────────── */
const PLATFORMS = ['YouTube', 'TikTok', 'Facebook', 'Instagram'];
const PLATFORM_ICONS = { YouTube: '▶', TikTok: '♪', Facebook: 'f', Instagram: '◎' };
const GOALS = ['Tăng Subscribers', 'Tăng Engagement', 'Monetize kênh', 'Xây dựng thương hiệu', 'Tăng doanh số'];

const GRADE = {
  Elite:      { color: 'text-emerald-400', ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', dot: 'bg-emerald-400' },
  Strong:     { color: 'text-sky-400',     ring: 'ring-sky-500/40',     bg: 'bg-sky-500/10',     bar: 'bg-sky-500',     dot: 'bg-sky-400'     },
  Developing: { color: 'text-yellow-400',  ring: 'ring-yellow-500/40',  bg: 'bg-yellow-500/10',  bar: 'bg-yellow-500',  dot: 'bg-yellow-400'  },
  Average:    { color: 'text-orange-400',  ring: 'ring-orange-500/40',  bg: 'bg-orange-500/10',  bar: 'bg-orange-500',  dot: 'bg-orange-400'  },
  Critical:   { color: 'text-red-400',     ring: 'ring-red-500/40',     bg: 'bg-red-500/10',     bar: 'bg-red-500',     dot: 'bg-red-400'     },
};
const gradeOf = (score) =>
  score >= 90 ? 'Elite' : score >= 75 ? 'Strong' : score >= 60 ? 'Developing' : score >= 45 ? 'Average' : 'Critical';

const DIM_META = {
  'Hook Effectiveness':              { icon: Zap,       short: 'Hook'      },
  'Algorithm Alignment':             { icon: BarChart2, short: 'Algorithm' },
  'Content Strategy Coherence':      { icon: Layers,    short: 'Strategy'  },
  'Audience Retention Architecture': { icon: Eye,       short: 'Retention' },
  'Viral Coefficient':               { icon: TrendingUp,short: 'Viral'     },
  'Monetization Readiness':          { icon: DollarSign,short: 'Monetize'  },
  'Competitive Positioning':         { icon: Shield,    short: 'Position'  },
  'Brand Consistency':               { icon: Target,    short: 'Brand'     },
};

/* ─── small helpers ─────────────────────────────────────────────────────────── */
function CopyBtn({ text, size = 'sm' }) {
  const [ok, setOk] = useState(false);
  const go = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };
  return (
    <button onClick={go}
      className={`shrink-0 rounded-lg transition-all ${size === 'xs' ? 'p-1' : 'p-1.5'} ${ok ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-sky-400 hover:bg-sky-500/10'}`}>
      {ok ? <Check className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> : <Copy className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
    </button>
  );
}

function Badge({ label, color = 'slate' }) {
  const map = {
    High: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Low:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${map[label] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {label}
    </span>
  );
}

/* ─── ScoreHero ──────────────────────────────────────────────────────────────── */
function ScoreHero({ analysis, platform, handle, niche, mode }) {
  const g = gradeOf(analysis.overallScore);
  const meta = GRADE[g];
  const scoreColor = analysis.overallScore >= 75 ? '#10b981' : analysis.overallScore >= 60 ? '#facc15' : analysis.overallScore >= 45 ? '#fb923c' : '#f87171';
  const r = 48, circ = 2 * Math.PI * r, dash = (analysis.overallScore / 100) * circ;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900 to-slate-800/60 p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circle */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r={r} fill="none" stroke="#1e293b" strokeWidth="9" />
            <circle cx="56" cy="56" r={r} fill="none" stroke={scoreColor} strokeWidth="9"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black leading-none" style={{ color: scoreColor }}>{analysis.overallScore}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ring-1 ${meta.bg} ${meta.color} ${meta.ring}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {g}
            </span>
            <span className="text-xs text-slate-500">
              {platform} · {handle || niche} · {mode === 'deep' ? '🔬 Deep Analysis' : '⚡ Quick Scan'}
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{analysis.overallInsight}</p>
          {analysis._reasoning?.compoundingWeakness && (
            <div className="flex items-start gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Vấn đề cốt lõi</span>
                <p className="text-xs text-slate-300 mt-0.5">{analysis._reasoning.compoundingWeakness}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DimensionGrid ──────────────────────────────────────────────────────────── */
function DimensionGrid({ dimensions }) {
  const [active, setActive] = useState(null);
  const dim = dimensions.find(d => d.name === active);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {dimensions.map(d => {
          const g = gradeOf(d.score);
          const meta = GRADE[g];
          const Icon = DIM_META[d.name]?.icon || BarChart2;
          const isActive = active === d.name;
          return (
            <button key={d.name} onClick={() => setActive(isActive ? null : d.name)}
              className={`flex flex-col items-start gap-2 p-3 rounded-xl border transition-all text-left
                ${isActive ? `${meta.bg} border-current ${meta.color}` : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'}`}>
              <div className="flex items-center justify-between w-full">
                <Icon className={`w-3.5 h-3.5 ${isActive ? meta.color : 'text-slate-500'}`} />
                <span className={`text-xs font-black ${meta.color}`}>{d.score}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-300 leading-tight">{DIM_META[d.name]?.short || d.name}</span>
              <div className="w-full bg-slate-700 rounded-full h-1">
                <div className={`h-1 rounded-full ${meta.bar}`} style={{ width: `${d.score}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {dim && (
        <div className={`rounded-xl border p-4 space-y-3 ${GRADE[gradeOf(dim.score)].bg} border-slate-700/60`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${GRADE[gradeOf(dim.score)].color}`}>{dim.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${GRADE[gradeOf(dim.score)].bg} ${GRADE[gradeOf(dim.score)].color} ring-1 ${GRADE[gradeOf(dim.score)].ring}`}>{dim.grade || gradeOf(dim.score)}</span>
            </div>
            <button onClick={() => setActive(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{dim.insight}</p>
          {dim.recommendation && (
            <div className="flex items-start gap-2.5 bg-slate-800/80 rounded-lg p-3">
              <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <p className="text-sm text-sky-300 leading-relaxed">{dim.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── SWOT row ───────────────────────────────────────────────────────────────── */
function SwotRow({ strengths, weaknesses }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Điểm mạnh</span>
        </div>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-snug">
              <span className="text-emerald-500 shrink-0 font-bold mt-0.5 text-xs">{i + 1}</span>{s}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-red-400">Cần cải thiện</span>
        </div>
        <ul className="space-y-2">
          {weaknesses.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-snug">
              <span className="text-red-500 shrink-0 font-bold mt-0.5 text-xs">{i + 1}</span>{w}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── Priority Actions ───────────────────────────────────────────────────────── */
function PriorityActions({ actions }) {
  return (
    <div className="space-y-2">
      {actions.map((a, i) => (
        <div key={i} className="flex gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5
            ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-sky-500/20 text-sky-400' : i === 2 ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
            {a.rank || i + 1}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-sm font-semibold text-white leading-snug">{a.action}</p>
            {a.roi && <p className="text-xs text-slate-400 leading-relaxed">{a.roi}</p>}
            <div className="flex items-center gap-1.5 flex-wrap">
              {a.impact   && <><span className="text-[10px] text-slate-500">Impact</span><Badge label={a.impact} /></>}
              {a.effort   && <><span className="text-[10px] text-slate-500 ml-1">Effort</span><Badge label={a.effort} /></>}
              {a.timeline && <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-400 ml-1">{a.timeline}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Roadmap ────────────────────────────────────────────────────────────────── */
function Roadmap({ weeks }) {
  const colors = ['border-sky-500 text-sky-400 bg-sky-500/10', 'border-purple-500 text-purple-400 bg-purple-500/10', 'border-yellow-500 text-yellow-400 bg-yellow-500/10', 'border-emerald-500 text-emerald-400 bg-emerald-500/10'];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {weeks.map((w, i) => (
        <div key={i} className={`rounded-xl border-l-4 bg-slate-800/40 p-4 space-y-2.5 ${colors[i % 4].split(' ')[0]}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors[i % 4]}`}>Tuần {w.week}</span>
            <span className="text-sm font-semibold text-white truncate">{w.focus}</span>
          </div>
          <ul className="space-y-1.5">
            {(w.actions || []).map((a, j) => (
              <li key={j} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />{a}
              </li>
            ))}
          </ul>
          {w.successMetric && (
            <div className="flex items-start gap-1.5 pt-2 border-t border-slate-700">
              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-400 leading-relaxed">{w.successMetric}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── RewritePanel ───────────────────────────────────────────────────────────── */
function RewritePanel({ rewrite }) {
  const sections = [
    { id: 'bio',      label: '📝 Bio & Mô tả',        icon: '📝' },
    { id: 'titles',   label: '🎯 Tiêu đề',            icon: '🎯' },
    { id: 'hooks',    label: '⚡ Hook Templates',      icon: '⚡' },
    { id: 'ctas',     label: '📣 CTA Scripts',         icon: '📣' },
    { id: 'hashtags', label: '# Hashtag Strategy',    icon: '#'  },
    { id: 'pillars',  label: '🏛 Content Pillars',     icon: '🏛' },
    { id: 'posting',  label: '📅 Lịch đăng',           icon: '📅' },
  ];
  const [open, setOpen] = useState({ bio: true });
  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }));

  return (
    <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-b from-purple-500/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-purple-500/20">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Rewrite Hoàn Chỉnh</h2>
          <p className="text-xs text-slate-400">7 thành phần đã được viết lại theo chuẩn kênh</p>
        </div>
      </div>

      {rewrite._rewriteStrategy && (
        <div className="px-5 py-3 bg-purple-500/8 border-b border-purple-500/15">
          <p className="text-xs text-purple-300 leading-relaxed">{rewrite._rewriteStrategy}</p>
        </div>
      )}

      <div className="divide-y divide-slate-800/60">

        {/* Bio & Description */}
        <AccSection id="bio" label="Bio & Mô tả kênh" open={open.bio} toggle={() => toggle('bio')}>
          <div className="space-y-3">
            <ContentBox label="Channel Bio" text={rewrite.channelBio} />
            <ContentBox label="Full Description" text={rewrite.channelDescription} />
          </div>
        </AccSection>

        {/* Titles */}
        <AccSection id="titles" label={`Tiêu đề mẫu (${(rewrite.titleTemplates||[]).length})`} open={open.titles} toggle={() => toggle('titles')}>
          <div className="space-y-2">
            {(rewrite.titleTemplates || []).map((t, i) => (
              <div key={i} className="group rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 p-3 space-y-1.5 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white leading-snug flex-1">{t.template}</p>
                  <CopyBtn text={t.template} size="xs" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {t.psychTrigger && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25">⚡ {t.psychTrigger}</span>}
                  {t.example && <span className="text-[10px] text-slate-400 italic">→ {t.example}</span>}
                </div>
              </div>
            ))}
          </div>
        </AccSection>

        {/* Hooks */}
        <AccSection id="hooks" label={`Hook Templates (${(rewrite.hookTemplates||[]).length})`} open={open.hooks} toggle={() => toggle('hooks')}>
          <div className="space-y-2">
            {(rewrite.hookTemplates || []).map((h, i) => (
              <div key={i} className="rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 p-3 space-y-1.5 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white leading-snug flex-1 font-medium">"{h.hook}"</p>
                  <CopyBtn text={h.hook} size="xs" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {h.mechanism && <span className="text-[10px] text-sky-400">🧠 {h.mechanism}</span>}
                  {h.variant && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">{h.variant}</span>}
                </div>
              </div>
            ))}
          </div>
        </AccSection>

        {/* CTAs */}
        <AccSection id="ctas" label={`CTA Scripts (${(rewrite.ctaScripts||[]).length})`} open={open.ctas} toggle={() => toggle('ctas')}>
          <div className="space-y-2">
            {(rewrite.ctaScripts || []).map((c, i) => (
              <div key={i} className="rounded-xl bg-slate-800/50 border border-slate-700/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest">{c.placement}</span>
                  <CopyBtn text={c.script} size="xs" />
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">"{c.script}"</p>
                {c.goal && <p className="text-[11px] text-slate-500">→ {c.goal}</p>}
              </div>
            ))}
          </div>
        </AccSection>

        {/* Hashtags */}
        <AccSection id="hashtags" label="Hashtag Strategy" open={open.hashtags} toggle={() => toggle('hashtags')}>
          <div className="space-y-3">
            {[
              { key: 'tier1',   label: 'Tier 1 — Broad (1M+)',     color: 'text-sky-400 bg-sky-500/10 border-sky-500/25'         },
              { key: 'tier2',   label: 'Tier 2 — Mid (100K-1M)',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
              { key: 'tier3',   label: 'Tier 3 — Niche (<100K)',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/25' },
              { key: 'branded', label: 'Branded — Của kênh',       color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
            ].map(({ key, label, color }) => {
              const tags = rewrite.hashtagStrategy?.[key] || [];
              return tags.length ? (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
                    <CopyBtn text={tags.join(' ')} size="xs" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:border-slate-500 cursor-pointer transition-colors"
                        onClick={() => navigator.clipboard.writeText(tag)}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </AccSection>

        {/* Pillars */}
        <AccSection id="pillars" label="Content Pillars" open={open.pillars} toggle={() => toggle('pillars')}>
          <div className="space-y-2">
            {(rewrite.contentPillarsRewrite || []).map((p, i) => {
              const pct = p.percentage || 0;
              const barColors = ['bg-sky-500', 'bg-purple-500', 'bg-emerald-500', 'bg-yellow-500'];
              return (
                <div key={i} className="rounded-xl bg-slate-800/50 border border-slate-700/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{p.pillar}</span>
                    <span className="text-sm font-black text-slate-300">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${barColors[i % 4]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{p.why}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.formatExample && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400">📌 {p.formatExample}</span>}
                    {p.algorithmSignal && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🔔 {p.algorithmSignal}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </AccSection>

        {/* Posting strategy */}
        {rewrite.postingStrategy && (
          <AccSection id="posting" label="Chiến lược đăng bài" open={open.posting} toggle={() => toggle('posting')}>
            <div className="space-y-2">
              {[
                { label: '⏰ Tần suất', key: 'frequency' },
                { label: '📍 Thời điểm tốt nhất', key: 'optimalTimes' },
                { label: '🎬 Format Mix', key: 'formatMix' },
                { label: '📆 Kế hoạch tuần đầu', key: 'firstWeekPlan' },
              ].map(({ label, key }) => rewrite.postingStrategy[key] ? (
                <div key={key} className="rounded-xl bg-slate-800/50 border border-slate-700/60 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">{label}</span>
                    <CopyBtn text={rewrite.postingStrategy[key]} size="xs" />
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{rewrite.postingStrategy[key]}</p>
                </div>
              ) : null)}
            </div>
          </AccSection>
        )}
      </div>
    </div>
  );
}

function AccSection({ label, open, toggle, children }) {
  return (
    <div>
      <button onClick={toggle} className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-slate-800/30 transition-colors text-left">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function ContentBox({ label, text }) {
  return text ? (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
        <CopyBtn text={text} size="xs" />
      </div>
      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  ) : null;
}

/* ─── History Drawer ─────────────────────────────────────────────────────────── */
function HistoryDrawer({ items, total, page, onLoadMore, onSelect, onClose }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">Lịch sử phân tích</span>
          <span className="text-xs text-slate-500">({total})</span>
        </div>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors">Đóng ✕</button>
      </div>
      <div className="divide-y divide-slate-800/60">
        {items.map(h => {
          const g = gradeOf(h.analysis?.overallScore ?? 50);
          const meta = GRADE[h.analysis?.overallGrade || g];
          return (
            <button key={h._id} onClick={() => onSelect(h._id)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/50 transition-colors text-left">
              <div className={`text-2xl font-black w-12 text-center shrink-0 ${meta.color}`}>
                {h.analysis?.overallScore ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{h.handle || h.niche}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-500">{h.platform}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-slate-500">{h.mode === 'deep' ? '🔬 Deep' : '⚡ Quick'}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.ring} ring-1`}>
                  {h.analysis?.overallGrade || g}
                </span>
                {h.rewrite && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25">✨ Rewritten</span>}
              </div>
            </button>
          );
        })}
      </div>
      {page * 6 < total && (
        <div className="px-5 py-3 border-t border-slate-800">
          <button onClick={() => onLoadMore(page + 1)} className="w-full text-xs text-slate-400 hover:text-white py-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            Xem thêm →
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function ChannelAnalysisPage() {
  const [form, setForm] = useState({
    platform: 'YouTube', handle: '', niche: '', goal: GOALS[0], mode: 'deep',
    metrics: { subscribers: '', avgViews: '', engagementRate: '', postFrequency: '' },
    sampleContent: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'rewrite'
  const [history,   setHistory]   = useState([]);
  const [histPage,  setHistPage]  = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [showHist,  setShowHist]  = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setMetric = (k, v) => setForm(f => ({ ...f, metrics: { ...f.metrics, [k]: v } }));

  const handleAnalyze = async () => {
    if (!form.niche.trim()) return setError('Vui lòng nhập niche / topic của kênh.');
    setError(''); setLoading(true); setResult(null); setActiveTab('analysis');
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
      setActiveTab('rewrite');
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi rewrite, thử lại.');
    } finally { setRewriting(false); }
  };

  const loadHistory = async (page = 1) => {
    try {
      const { data } = await channelAnalysisAPI.getHistory(page);
      setHistory(p => page === 1 ? (data.items || []) : [...p, ...(data.items || [])]);
      setHistTotal(data.pagination?.total || 0);
      setHistPage(page);
      setShowHist(true);
    } catch {}
  };

  const loadOne = async (id) => {
    try {
      const { data } = await channelAnalysisAPI.getOne(id);
      setResult(data.data);
      setShowHist(false);
      setActiveTab('analysis');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const analysis = result?.analysis;
  const rewrite  = result?.rewrite;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ScanSearch className="w-6 h-6 text-sky-400" />
            Channel Audit AI
          </h1>
          <p className="text-sm text-slate-400 mt-1">Phân tích chiều sâu + Rewrite toàn bộ kênh theo chuẩn thuật toán</p>
        </div>
        <button onClick={() => loadHistory(1)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-600 transition-all">
          <History className="w-3.5 h-3.5" /> Lịch sử
        </button>
      </div>

      {/* ── Form card ── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80">
          <h2 className="text-sm font-semibold text-white">Thông tin kênh cần phân tích</h2>
        </div>
        <div className="p-5 space-y-5">

          {/* Platform */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Platform</label>
            <div className="flex gap-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => set('platform', p)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all
                    ${form.platform === p ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm' : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}>
                  <span className="block text-base leading-none mb-0.5">{PLATFORM_ICONS[p]}</span>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Mode phân tích</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'quick', label: '⚡ Quick Scan',    desc: 'Groq · ~15 giây · Tổng quan nhanh' },
                { id: 'deep',  label: '🔬 Deep Analysis', desc: 'Gemini · ~35 giây · Chẩn đoán toàn diện' },
              ].map(m => (
                <button key={m.id} onClick={() => set('mode', m.id)}
                  className={`p-3 rounded-xl border text-left transition-all
                    ${form.mode === m.id ? 'bg-sky-500/10 border-sky-500/40 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  <p className={`text-sm font-semibold ${form.mode === m.id ? 'text-sky-300' : ''}`}>{m.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Niche + Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Niche / Topic *</label>
              <input className="input" placeholder="vd: tài chính, fitness, công nghệ..." value={form.niche} onChange={e => set('niche', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Handle kênh</label>
              <input className="input" placeholder="@tencuaban (tuỳ chọn)" value={form.handle} onChange={e => set('handle', e.target.value)} />
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Mục tiêu</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button key={g} onClick={() => set('goal', g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${form.goal === g ? 'bg-purple-500/15 text-purple-300 border-purple-500/40' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced toggle */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAdvanced ? 'Ẩn' : 'Thêm'} thông số chi tiết (giúp AI chính xác hơn)
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'subscribers',    ph: 'Subscribers (5K)' },
                  { key: 'avgViews',       ph: 'Avg Views (800)' },
                  { key: 'engagementRate', ph: 'ER% (3.5%)' },
                  { key: 'postFrequency',  ph: 'Tần suất (3/tuần)' },
                ].map(({ key, ph }) => (
                  <input key={key} className="input text-xs" placeholder={ph} value={form.metrics[key]} onChange={e => setMetric(key, e.target.value)} />
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Nội dung mẫu</label>
                <textarea className="input min-h-[80px] text-sm resize-none"
                  placeholder="Paste 1-3 tiêu đề video, caption, hoặc mô tả kênh hiện tại..."
                  value={form.sampleContent} onChange={e => set('sampleContent', e.target.value)} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-60">
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" />{form.mode === 'quick' ? 'Đang scan...' : 'Đang phân tích sâu...'}</>
              : <><ScanSearch className="w-4 h-4" />Phân tích kênh ngay</>
            }
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {analysis && (
        <div className="space-y-4">

          {/* Score hero */}
          <ScoreHero analysis={analysis} platform={result.platform} handle={result.handle} niche={result.niche} mode={result.mode} />

          {/* Tabs: Analysis | Rewrite */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <button onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'analysis' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
              📊 Phân tích
            </button>
            <button onClick={() => rewrite ? setActiveTab('rewrite') : handleRewrite()}
              disabled={rewriting}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5
                ${activeTab === 'rewrite' && rewrite ? 'bg-purple-600/80 text-white shadow-sm' : rewrite ? 'text-purple-400 hover:text-white hover:bg-purple-600/30' : 'text-slate-500 hover:text-slate-300'}
                disabled:opacity-50`}>
              {rewriting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Đang viết lại...</> : <><Sparkles className="w-3.5 h-3.5" />Rewrite kênh</>}
            </button>
          </div>

          {activeTab === 'analysis' && (
            <div className="space-y-4">

              {/* 8 Dimensions */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">8 Chiều Đánh Giá <span className="text-slate-500 font-normal text-xs ml-1">— nhấn để xem chi tiết</span></h3>
                <DimensionGrid dimensions={analysis.dimensions || []} />
              </div>

              {/* Strengths + Weaknesses */}
              <SwotRow strengths={analysis.strengths || []} weaknesses={analysis.weaknesses || []} />

              {/* Priority Actions */}
              {(analysis.priorityActions || []).length > 0 && (
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white">🎯 Ưu tiên hành động <span className="text-slate-500 font-normal text-xs ml-1">— xếp theo ROI</span></h3>
                  <PriorityActions actions={analysis.priorityActions} />
                </div>
              )}

              {/* 30-day Roadmap */}
              {(analysis.thirtyDayRoadmap || []).length > 0 && (
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white">📅 30-Day Roadmap</h3>
                  <Roadmap weeks={analysis.thirtyDayRoadmap} />
                </div>
              )}

              {/* Rewrite CTA (if not yet done) */}
              {!rewrite && (
                <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/8 to-sky-500/8 p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-base font-bold text-white">Rewrite toàn bộ kênh</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Gemini viết lại bio, tiêu đề, hook, CTA, hashtag, pillars theo đúng chuẩn phân tích vừa có.</p>
                    </div>
                    <button onClick={handleRewrite} disabled={rewriting}
                      className="btn-primary flex items-center gap-2 whitespace-nowrap shrink-0 text-sm px-5 py-2.5">
                      {rewriting ? <><RefreshCw className="w-4 h-4 animate-spin" />Đang viết...</> : <><Sparkles className="w-4 h-4" />Rewrite ngay</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewrite' && rewrite && <RewritePanel rewrite={rewrite} />}
        </div>
      )}

      {/* ── History ── */}
      {showHist && (
        <HistoryDrawer
          items={history} total={histTotal} page={histPage}
          onLoadMore={loadHistory} onSelect={loadOne}
          onClose={() => setShowHist(false)}
        />
      )}
    </div>
  );
}
