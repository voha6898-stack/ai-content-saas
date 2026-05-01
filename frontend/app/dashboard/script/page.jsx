'use client';

import { useState, useEffect } from 'react';
import {
  Clapperboard, Loader2, Sparkles, Youtube, Music2, Facebook,
  Clock, Camera, Type, ChevronDown, ChevronUp, Copy, Check,
  Trash2, Star, RefreshCw, BookOpen, Hash,
} from 'lucide-react';
import { scriptAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ── Config ────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'YouTube',  label: 'YouTube',  icon: <Youtube  className="w-4 h-4" />, color: 'border-red-500/60   bg-red-500/10   text-red-400'  },
  { value: 'TikTok',   label: 'TikTok',   icon: <Music2   className="w-4 h-4" />, color: 'border-pink-500/60  bg-pink-500/10  text-pink-400' },
  { value: 'Facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" />, color: 'border-blue-500/60  bg-blue-500/10  text-blue-400' },
];

const DURATIONS = {
  YouTube:  ['5 phút', '10 phút', '15 phút'],
  TikTok:   ['30 giây', '60 giây', '90 giây'],
  Facebook: ['Bài viết', 'Reel 60 giây', 'Video 5 phút'],
};

const STYLES = {
  YouTube:  [
    { value: 'storytelling', label: 'Kể chuyện', desc: 'Trải nghiệm cá nhân + bài học' },
    { value: 'tutorial',     label: 'Hướng dẫn', desc: 'Từng bước rõ ràng, dễ làm theo' },
    { value: 'listicle',     label: 'Danh sách', desc: 'Top X, đánh số từng điểm' },
    { value: 'review',       label: 'Đánh giá',  desc: 'So sánh, ưu nhược điểm' },
  ],
  TikTok:   [
    { value: 'tutorial',  label: 'Hướng dẫn nhanh', desc: 'Info dense, mỗi bước ngắn gọn' },
    { value: 'story',     label: 'Câu chuyện/POV',   desc: 'Relatable, twist bất ngờ' },
    { value: 'trending',  label: 'Theo Trend',        desc: 'Sound viral, transition mượt' },
    { value: 'skit',      label: 'Kịch hài',          desc: 'Nhân vật, tình huống buồn cười' },
  ],
  Facebook: [
    { value: 'storytelling', label: 'Kể chuyện',       desc: 'Hook story, cảm xúc sâu sắc' },
    { value: 'educational',  label: 'Chia sẻ kiến thức', desc: 'Tips hữu ích, actionable' },
    { value: 'motivational', label: 'Truyền cảm hứng', desc: 'Cảm xúc mạnh, thúc đẩy hành động' },
  ],
};

const SCENE_TYPE_STYLE = {
  hook:       'border-l-orange-500  bg-orange-500/5',
  problem:    'border-l-red-500     bg-red-500/5',
  tease:      'border-l-yellow-500  bg-yellow-500/5',
  content:    'border-l-sky-500     bg-sky-500/5',
  information:'border-l-sky-500     bg-sky-500/5',
  transition: 'border-l-slate-500   bg-slate-500/5',
  cta:        'border-l-green-500   bg-green-500/5',
  outro:      'border-l-purple-500  bg-purple-500/5',
  story:      'border-l-pink-500    bg-pink-500/5',
  twist:      'border-l-yellow-500  bg-yellow-500/5',
};

const SCENE_TYPE_BADGE = {
  hook:       'bg-orange-500/20 text-orange-400',
  problem:    'bg-red-500/20    text-red-400',
  tease:      'bg-yellow-500/20 text-yellow-400',
  content:    'bg-sky-500/20    text-sky-400',
  information:'bg-sky-500/20    text-sky-400',
  transition: 'bg-slate-500/20  text-slate-400',
  cta:        'bg-green-500/20  text-green-400',
  outro:      'bg-purple-500/20 text-purple-400',
  story:      'bg-pink-500/20   text-pink-400',
  twist:      'bg-yellow-500/20 text-yellow-400',
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

// ── Scene Card ────────────────────────────────────────────────────────────────

function SceneCard({ scene, index, copy, copied }) {
  const [open, setOpen] = useState(index < 3);
  const typeKey     = scene.type?.split(/[\s&_-]/)[0]?.toLowerCase() || 'content';
  const borderStyle = SCENE_TYPE_STYLE[typeKey] || SCENE_TYPE_STYLE.content;
  const badgeStyle  = SCENE_TYPE_BADGE[typeKey] || SCENE_TYPE_BADGE.content;
  const sceneId     = `scene-${scene.id}`;

  return (
    <div className={`border border-slate-800 border-l-4 rounded-xl overflow-hidden ${borderStyle}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors text-left"
      >
        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
          {scene.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{scene.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeStyle}`}>
              {scene.type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {scene.timestamp}
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{scene.duration}</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Script */}
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-400">LỜI THOẠI</span>
              <button
                onClick={() => copy(scene.script, sceneId)}
                className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-sky-400 transition-colors"
              >
                {copied === sceneId
                  ? <><Check className="w-3 h-3 text-green-400" /> Đã copy</>
                  : <><Copy className="w-3 h-3" /> Copy</>
                }
              </button>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 rounded-lg px-3 py-2.5 border border-slate-800">
              {scene.script}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direction */}
            {scene.direction && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400">GHI CHÚ QUAY</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800/60">
                  {scene.direction}
                </p>
              </div>
            )}
            {/* Overlay */}
            {scene.overlay && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400">TEXT OVERLAY</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800/60">
                  {scene.overlay}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Script Result ─────────────────────────────────────────────────────────────

function ScriptResult({ script, onDelete }) {
  const { copy, copied } = useCopy();
  const [showHashtags, setShowHashtags] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const fullScriptText = script.output.scenes
    .map((s) => `[${s.name} — ${s.timestamp}]\n${s.script}`)
    .join('\n\n');

  const handleDelete = async () => {
    if (!confirm('Xoá kịch bản này?')) return;
    try {
      await scriptAPI.delete(script._id);
      setDeleted(true);
      onDelete(script._id);
    } catch {}
  };

  if (deleted) return null;

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-snug">{script.output.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
              {script.platform}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
              {script.duration}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
              {script.style}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
              {script.output.scenes.length} cảnh
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => copy(fullScriptText, 'all')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            {copied === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'all' ? 'Đã copy' : 'Copy tất cả'}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scenes timeline */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-purple-400" />
          Phân cảnh kịch bản
        </h3>
        {script.output.scenes.map((scene, i) => (
          <SceneCard key={scene.id} scene={scene} index={i} copy={copy} copied={copied} />
        ))}
      </div>

      {/* Production Tips */}
      {script.output.productionTips?.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Mẹo sản xuất
          </h3>
          <ul className="space-y-1.5">
            {script.output.productionTips.map((tip, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5 shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hashtags */}
      {script.output.hashtags?.length > 0 && (
        <div>
          <button
            onClick={() => setShowHashtags((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
          >
            <Hash className="w-3.5 h-3.5" />
            {showHashtags ? 'Ẩn hashtags' : `Xem ${script.output.hashtags.length} hashtags`}
          </button>
          {showHashtags && (
            <div className="flex flex-wrap gap-1.5">
              {script.output.hashtags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ScriptPage() {
  const { user } = useAuth();

  const [platform, setPlatform] = useState('YouTube');
  const [duration, setDuration] = useState('5 phút');
  const [style,    setStyle]    = useState('storytelling');
  const [topic,    setTopic]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const [scripts,    setScripts]    = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [generated,  setGenerated]  = useState(null);

  // Reset duration + style khi đổi platform
  useEffect(() => {
    setDuration(DURATIONS[platform][0]);
    setStyle(STYLES[platform][0].value);
  }, [platform]);

  // Load history
  const loadHistory = async () => {
    setHistLoading(true);
    try {
      const { data } = await scriptAPI.getHistory(1, 6, platform);
      setScripts(data.items);
    } catch {} finally { setHistLoading(false); }
  };

  useEffect(() => { loadHistory(); }, [platform]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setError('');
    setLoading(true);
    setGenerated(null);
    try {
      const { data } = await scriptAPI.generate({ topic: topic.trim(), platform, duration, style });
      setGenerated(data.script);
      setScripts((prev) => [data.script, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Có lỗi xảy ra, thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setScripts((prev) => prev.filter((s) => s._id !== id));
    if (generated?._id === id) setGenerated(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Clapperboard className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold">Script Writer</h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            Miễn phí
          </span>
        </div>
        <p className="text-slate-400 text-sm">Kịch bản chuyên sâu, phân cảnh + thời gian cụ thể, có tính viral cho YouTube · TikTok · Facebook</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── FORM ── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Tạo kịch bản mới
            </h2>

            {/* Credits warning */}
            {user?.plan === 'free' && user?.credits !== undefined && user.credits <= 2 && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs">
                Còn {user.credits} lượt dùng miễn phí
              </div>
            )}

            {error && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">

              {/* Platform */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Nền tảng</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value} type="button"
                      onClick={() => setPlatform(p.value)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all
                        ${platform === p.value ? p.color : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Thời lượng</label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS[platform].map((d) => (
                    <button
                      key={d} type="button"
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                        ${duration === d
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                      <Clock className="w-3 h-3 inline mr-1 opacity-60" />{d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Phong cách</label>
                <div className="space-y-1.5">
                  {STYLES[platform].map((s) => (
                    <button
                      key={s.value} type="button"
                      onClick={() => setStyle(s.value)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all
                        ${style === s.value
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center
                        ${style === s.value ? 'border-purple-400 bg-purple-400' : 'border-slate-600'}`}>
                        {style === s.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold leading-tight">{s.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Chủ đề / Topic</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    platform === 'YouTube' ? 'VD: 5 cách đầu tư thông minh với 5 triệu đồng cho người mới bắt đầu'
                    : platform === 'TikTok' ? 'VD: Mẹo tiết kiệm tiền cực hay mà ít ai biết'
                    : 'VD: Câu chuyện tôi từ 0 đồng xây dựng được thương hiệu cá nhân'
                  }
                  rows={3} required maxLength={300}
                  className="input-field resize-none text-sm"
                />
                <p className="text-xs text-slate-600 mt-1 text-right">{topic.length}/300</p>
              </div>

              <button
                type="submit"
                disabled={loading || !topic.trim() || (user?.plan === 'free' && user?.credits <= 0)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang viết kịch bản...</>
                  : <><Clapperboard className="w-4 h-4" /> Tạo kịch bản viral</>
                }
              </button>

              {user?.plan === 'free' && user?.credits <= 0 && (
                <p className="text-center text-xs text-slate-500">
                  Hết lượt miễn phí —{' '}
                  <a href="/pricing" className="text-sky-400 hover:underline">Nâng cấp Pro</a>
                </p>
              )}
            </form>
          </div>
        </div>

        {/* ── RESULT + HISTORY ── */}
        <div className="xl:col-span-3 space-y-5">

          {/* Loading skeleton */}
          {loading && (
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <div>
                  <p className="font-medium text-sm">Đang viết kịch bản...</p>
                  <p className="text-xs text-slate-500 mt-0.5">AI đang phân tích chủ đề và xây dựng từng cảnh</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Latest generated */}
          {!loading && generated && (
            <ScriptResult script={generated} onDelete={handleDelete} />
          )}

          {/* History */}
          {scripts.filter((s) => s._id !== generated?._id).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-400">Kịch bản đã tạo</h3>
                <button onClick={loadHistory} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Làm mới
                </button>
              </div>
              {histLoading
                ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                : (
                  <div className="space-y-3">
                    {scripts.filter((s) => s._id !== generated?._id).map((s) => (
                      <ScriptResult key={s._id} script={s} onDelete={handleDelete} />
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {/* Empty state */}
          {!loading && !generated && scripts.length === 0 && (
            <div className="card text-center py-14">
              <Clapperboard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="font-medium text-slate-400 mb-1">Chưa có kịch bản nào</p>
              <p className="text-xs text-slate-600">Chọn platform, thời lượng và nhập chủ đề để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
