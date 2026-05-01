'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  History, Trash2, ChevronLeft, ChevronRight,
  Youtube, Music2, Facebook, Instagram,
  Loader2, Star, Grid3x3,
} from 'lucide-react';
import { contentAPI } from '@/lib/api';

const PLATFORM_TABS = [
  { value: '',          label: 'Tất cả', icon: <Grid3x3   className="w-3.5 h-3.5" /> },
  { value: 'YouTube',   label: 'YouTube',   icon: <Youtube   className="w-3.5 h-3.5 text-red-400"    /> },
  { value: 'TikTok',    label: 'TikTok',    icon: <Music2    className="w-3.5 h-3.5 text-pink-400"   /> },
  { value: 'Facebook',  label: 'Facebook',  icon: <Facebook  className="w-3.5 h-3.5 text-blue-400"   /> },
  { value: 'Instagram', label: 'IG',        icon: <Instagram className="w-3.5 h-3.5 text-purple-400" /> },
];

const platformIcon = {
  YouTube:   <Youtube   className="w-3.5 h-3.5 text-red-400"    />,
  TikTok:    <Music2    className="w-3.5 h-3.5 text-pink-400"   />,
  Facebook:  <Facebook  className="w-3.5 h-3.5 text-blue-400"   />,
  Instagram: <Instagram className="w-3.5 h-3.5 text-purple-400" />,
};

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'Vừa xong';
  if (mins  < 60)  return `${mins} phút trước`;
  if (hours < 24)  return `${hours} giờ trước`;
  if (days  < 7)   return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function HistoryList({ onSelect, refreshKey }) {
  const [items, setItems]           = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [platform, setPlatform]     = useState('');
  const [favOnly, setFavOnly]       = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await contentAPI.getHistory(page, 8, platform, favOnly);
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, platform, favOnly, refreshKey]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Reset về trang 1 khi đổi filter
  const handlePlatformChange = (val) => { setPlatform(val); setPage(1); };
  const handleFavToggle      = ()    => { setFavOnly((v) => !v); setPage(1); };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Xoá nội dung này?')) return;
    try {
      await contentAPI.delete(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {}
  };

  const handleFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      const { data } = await contentAPI.toggleFavorite(id);
      setItems((prev) =>
        prev.map((i) => i._id === id ? { ...i, isFavorite: data.isFavorite } : i)
      );
    } catch {}
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-sky-400" />
        <h2 className="font-semibold text-lg">Lịch sử</h2>
        {pagination && (
          <span className="ml-auto text-xs text-slate-500">{pagination.total} bài</span>
        )}
      </div>

      {/* Platform filter tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {PLATFORM_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handlePlatformChange(tab.value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
              ${platform === tab.value
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        <button
          onClick={handleFavToggle}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ml-auto
            ${favOnly
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
        >
          <Star className="w-3.5 h-3.5" /> Yêu thích
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-10">
          {favOnly ? 'Chưa có nội dung yêu thích.' : 'Chưa có nội dung nào.'}
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            {items.map((item) => (
              <button
                key={item._id}
                onClick={() => onSelect(item)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {platformIcon[item.platform]}
                    <span className="text-xs text-slate-500">{item.platform}</span>
                    <span className="text-xs text-slate-700 ml-auto">{relativeTime(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 truncate font-medium">{item.output.title}</p>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{item.topic}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleFavorite(e, item._id)}
                    className={`p-1.5 rounded-lg transition-colors
                      ${item.isFavorite
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : 'hover:bg-slate-700 text-slate-500 hover:text-yellow-400'
                      }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-yellow-400' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, item._id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400">{page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}
                className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
