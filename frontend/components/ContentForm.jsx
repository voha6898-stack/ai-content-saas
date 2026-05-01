'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Youtube, Music2, Facebook, Instagram } from 'lucide-react';

const PLATFORMS = [
  { value: 'YouTube',   label: 'YouTube',   icon: <Youtube   className="w-4 h-4" />, color: 'border-red-500/60   bg-red-500/10   text-red-400'   },
  { value: 'TikTok',    label: 'TikTok',    icon: <Music2    className="w-4 h-4" />, color: 'border-pink-500/60  bg-pink-500/10  text-pink-400'  },
  { value: 'Facebook',  label: 'Facebook',  icon: <Facebook  className="w-4 h-4" />, color: 'border-blue-500/60  bg-blue-500/10  text-blue-400'  },
  { value: 'Instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" />, color: 'border-purple-500/60 bg-purple-500/10 text-purple-400' },
];

export default function ContentForm({ onGenerate }) {
  const [topic, setTopic]       = useState('');
  const [platform, setPlatform] = useState('YouTube');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onGenerate(topic.trim(), platform);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-sky-400" />
        <h2 className="font-semibold text-lg">Tạo nội dung mới</h2>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Chủ đề / Topic</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ví dụ: 5 cách kiếm tiền online không cần vốn cho sinh viên..."
            rows={3}
            required
            maxLength={200}
            className="input-field resize-none"
          />
          <p className="text-slate-600 text-xs mt-1 text-right">{topic.length}/200</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nền tảng</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${platform === p.value
                    ? p.color
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo nội dung...</>
            : <><Sparkles className="w-4 h-4" /> Tạo nội dung viral</>
          }
        </button>
      </form>
    </div>
  );
}
