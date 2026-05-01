'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, RefreshCw, Loader2, ExternalLink,
  Zap, DollarSign, Target, FileText, Star, Filter,
} from 'lucide-react';
import { automationAPI, contentAPI } from '@/lib/api';

const NICHES = ['', 'technology', 'finance', 'lifestyle', 'food', 'travel', 'fitness', 'education', 'entertainment', 'business', 'gaming', 'news'];
const SOURCES = [
  { value: '', label: 'Tất cả nguồn' },
  { value: 'google_trends',    label: 'Google Trends' },
  { value: 'youtube_trending', label: 'YouTube'        },
  { value: 'rss_vnexpress',    label: 'VnExpress'      },
  { value: 'rss_tuoitre',      label: 'Tuổi Trẻ'       },
  { value: 'rss_dantri',       label: 'Dân Trí'         },
];

const NICHE_COLOR = {
  technology:    'bg-blue-500/10    text-blue-400    border-blue-500/30',
  finance:       'bg-green-500/10   text-green-400   border-green-500/30',
  lifestyle:     'bg-pink-500/10    text-pink-400    border-pink-500/30',
  food:          'bg-orange-500/10  text-orange-400  border-orange-500/30',
  travel:        'bg-cyan-500/10    text-cyan-400    border-cyan-500/30',
  fitness:       'bg-red-500/10     text-red-400     border-red-500/30',
  education:     'bg-purple-500/10  text-purple-400  border-purple-500/30',
  entertainment: 'bg-yellow-500/10  text-yellow-400  border-yellow-500/30',
  business:      'bg-teal-500/10    text-teal-400    border-teal-500/30',
  gaming:        'bg-indigo-500/10  text-indigo-400  border-indigo-500/30',
  news:          'bg-slate-500/10   text-slate-400   border-slate-500/30',
  other:         'bg-slate-700      text-slate-400   border-slate-600',
};

const scoreColor = (score) =>
  score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

function TrendCard({ trend, onGenerate }) {
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform]     = useState(trend.aiAnalysis?.bestPlatforms?.[0] || 'TikTok');
  const [success, setSuccess]       = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const angle = trend.aiAnalysis?.contentAngles?.[0] || trend.keyword;
      const topic = `${trend.keyword} — ${angle}`.substring(0, 200);
      await contentAPI.generate({ topic, platform });
      setSuccess(true);
      onGenerate(trend.keyword);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo content');
    } finally {
      setGenerating(false);
    }
  };

  const overallColor =
    trend.scores.overall >= 70 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
    trend.scores.overall >= 50 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                  'bg-slate-800 border-slate-700 text-slate-400';

  return (
    <div className="card border-slate-700 hover:border-slate-600 transition-colors flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${NICHE_COLOR[trend.niche] || NICHE_COLOR.other}`}>
              {trend.niche}
            </span>
            <span className="text-xs text-slate-600">{trend.source.replace(/_/g, ' ')}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{trend.keyword}</h3>
        </div>

        <div className={`shrink-0 w-13 h-13 w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${overallColor}`}>
          <span className="text-base font-bold leading-none">{trend.scores.overall}</span>
          <span className="text-[10px] opacity-70">score</span>
        </div>
      </div>

      {trend.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{trend.description}</p>
      )}

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { icon: Zap,        label: 'Viral',       score: trend.scores.viral        },
          { icon: DollarSign, label: 'CPM',          score: trend.scores.monetization },
          { icon: Target,     label: 'Cạnh tranh',  score: trend.scores.competition  },
        ].map(({ icon: Icon, label, score }) => (
          <div key={label} className="bg-slate-800/50 rounded-lg px-2 py-2 text-center">
            <Icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${scoreColor(score)}`} />
            <div className={`text-sm font-bold ${scoreColor(score)}`}>{score}</div>
            <div className="text-[10px] text-slate-600 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* AI why viral */}
      {trend.aiAnalysis?.whyViral && (
        <p className="text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2 mb-3 italic line-clamp-2">
          "{trend.aiAnalysis.whyViral}"
        </p>
      )}

      {/* Content angles */}
      {trend.aiAnalysis?.contentAngles?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1.5 font-medium">Góc tiếp cận:</p>
          <div className="space-y-1">
            {trend.aiAnalysis.contentAngles.slice(0, 2).map((angle, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                <Star className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{angle}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platforms + CPM */}
      {(trend.aiAnalysis?.bestPlatforms?.length > 0 || trend.aiAnalysis?.estimatedCPM) && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(trend.aiAnalysis?.bestPlatforms || []).map((p) => (
            <span key={p} className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{p}</span>
          ))}
          {trend.aiAnalysis?.estimatedCPM && (
            <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full ml-auto">
              CPM {trend.aiAnalysis.estimatedCPM}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-800 mt-auto">
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}
          className="input-field text-xs flex-1 py-1.5 px-2">
          {(trend.aiAnalysis?.bestPlatforms?.length
            ? trend.aiAnalysis.bestPlatforms
            : ['YouTube', 'TikTok', 'Facebook']
          ).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <button onClick={handleGenerate} disabled={generating || success}
          className={`text-xs flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl font-semibold transition-all
            ${success
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'btn-primary py-1.5'}`}>
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
           success    ? '✓ Đã tạo' :
           <><FileText className="w-3.5 h-3.5" /> Tạo</>}
        </button>

        {trend.url && (
          <a href={trend.url} target="_blank" rel="noopener noreferrer"
            className="btn-secondary p-1.5 flex items-center justify-center">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const [trends, setTrends]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetching, setFetching]     = useState(false);
  const [filters, setFilters]       = useState({ niche: '', source: '', minScore: 40 });
  const [toast, setToast]           = useState('');
  const [lastFetch, setLastFetch]   = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadTrends = async () => {
    setLoading(true);
    try {
      const params = { limit: 40 };
      if (filters.niche)    params.niche    = filters.niche;
      if (filters.source)   params.source   = filters.source;
      if (filters.minScore) params.minScore = filters.minScore;
      const { data } = await automationAPI.getTrends(params);
      setTrends(data.trends || []);
      if (data.trends?.length > 0) {
        const latest = data.trends.reduce((a, b) =>
          new Date(a.fetchedAt) > new Date(b.fetchedAt) ? a : b
        );
        setLastFetch(new Date(latest.fetchedAt));
      }
    } catch {} finally { setLoading(false); }
  };

  const handleFetchNow = async () => {
    setFetching(true);
    try {
      const { data } = await automationAPI.fetchTrends({
        sources:  ['google_trends', 'youtube_trending', 'rss_vnexpress'],
        niches:   filters.niche ? [filters.niche] : [],
        minScore: filters.minScore,
      });
      showToast(`✅ ${data.message || 'Đã lấy trends mới!'}`);
      await loadTrends();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Lỗi khi lấy trends'));
    } finally { setFetching(false); }
  };

  useEffect(() => { loadTrends(); }, [filters]);

  // Stats
  const avgScore    = trends.length ? Math.round(trends.reduce((s, t) => s + t.scores.overall, 0) / trends.length) : 0;
  const topNiches   = Object.entries(
    trends.reduce((acc, t) => { acc[t.niche] = (acc[t.niche] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-400" /> Trending Topics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Xu hướng được AI phân tích · Score cao nhất trên đầu
            {lastFetch && (
              <span className="ml-2 text-slate-600">
                · Cập nhật {lastFetch.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadTrends} disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button onClick={handleFetchNow} disabled={fetching}
            className="btn-primary flex items-center gap-2">
            {fetching
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lấy...</>
              : <><TrendingUp className="w-4 h-4" /> Lấy trends ngay</>}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`border rounded-xl px-4 py-3 text-sm mb-4 ${
          toast.startsWith('❌')
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-green-500/10 border-green-500/30 text-green-300'}`}>
          {toast}
        </div>
      )}

      {/* Stats bar */}
      {trends.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tổng trends', value: trends.length, color: 'text-orange-400' },
            { label: 'Score trung bình', value: avgScore, color: avgScore >= 60 ? 'text-green-400' : 'text-yellow-400' },
            { label: 'Top niche', value: topNiches[0]?.[0] || '—', color: 'text-blue-400' },
            { label: 'Nguồn',
              value: [...new Set(trends.map((t) => t.source.replace('rss_', '').replace('_trending', '')))].length,
              color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card py-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
        <Filter className="w-4 h-4 text-slate-500 shrink-0" />
        <select value={filters.niche}
          onChange={(e) => setFilters((f) => ({ ...f, niche: e.target.value }))}
          className="input-field text-sm w-auto py-2 px-3">
          {NICHES.map((n) => <option key={n} value={n}>{n ? n.charAt(0).toUpperCase() + n.slice(1) : 'Tất cả niche'}</option>)}
        </select>

        <select value={filters.source}
          onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
          className="input-field text-sm w-auto py-2 px-3">
          {SOURCES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 whitespace-nowrap">Min score:</span>
          <input type="range" min="0" max="80" step="10" value={filters.minScore}
            onChange={(e) => setFilters((f) => ({ ...f, minScore: parseInt(e.target.value) }))}
            className="w-24 accent-sky-500" />
          <span className="text-sm font-bold w-6 text-sky-400">{filters.minScore}</span>
        </div>

        <span className="text-sm text-slate-500 ml-auto">{trends.length} kết quả</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          <p className="text-slate-500 text-sm">Đang tải trends...</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="text-center py-20">
          <TrendingUp className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-slate-400">Chưa có trending topics</h3>
          <p className="text-slate-500 mb-6 text-sm">
            Bấm "Lấy trends ngay" để AI phân tích xu hướng từ Google, YouTube và báo Việt Nam.
          </p>
          <button onClick={handleFetchNow} disabled={fetching} className="btn-primary">
            {fetching ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Đang lấy...</> : '🔥 Lấy trends ngay'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {trends.map((trend) => (
            <TrendCard key={trend._id} trend={trend}
              onGenerate={(kw) => showToast(`✅ Đã tạo content từ "${kw.substring(0, 40)}"`)} />
          ))}
        </div>
      )}
    </div>
  );
}
