'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Crown, Coins, FileText, Send, GitBranch, DollarSign,
  Bot, Flame, ArrowUpRight, Clock, CheckCircle, XCircle, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { analyticsAPI } from '@/lib/api';
import UpgradeModal from '@/components/UpgradeModal';

const PLATFORM_COLOR = {
  YouTube:   'text-red-400',
  TikTok:    'text-pink-400',
  Facebook:  'text-blue-400',
  Instagram: 'text-purple-400',
};

const STATUS_ICON = {
  completed: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  failed:    <XCircle     className="w-3.5 h-3.5 text-red-400"   />,
  queued:    <Clock       className="w-3.5 h-3.5 text-yellow-400"/>,
  processing:<Clock       className="w-3.5 h-3.5 text-sky-400"   />,
};

function StatCard({ icon: Icon, label, value, sub, color = 'text-sky-400' }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-700" />
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview,     setOverview]     = useState(null);
  const [loadingData,  setLoadingData]  = useState(true);
  const [showUpgrade,  setShowUpgrade]  = useState(false);

  useEffect(() => {
    if (!user) return;
    analyticsAPI.getOverview()
      .then(({ data }) => setOverview(data))
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [user]);

  const ov = overview?.overview;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Xin chào, {user?.name?.split(' ').pop()} 👋 — tổng quan hệ thống
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {[
          { href: '/dashboard/create',       label: 'Tạo nội dung',  icon: FileText,   color: 'bg-sky-500/10 border-sky-500/30 text-sky-400'        },
          { href: '/dashboard/trends',       label: 'Trends',        icon: Flame,       color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
          { href: '/dashboard/automation',   label: 'Automation',    icon: Bot,         color: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
          { href: '/dashboard/distribution', label: 'Lên lịch',      icon: Send,        color: 'bg-green-500/10 border-green-500/30 text-green-400'  },
          { href: '/dashboard/pipeline',     label: 'Pipeline',      icon: GitBranch,   color: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
          { href: '/dashboard/monetization', label: 'Monetize',      icon: DollarSign,  color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${color} hover:opacity-80 transition-opacity text-center`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      {loadingData ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-28 bg-slate-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText}    label="Nội dung đã tạo"  value={ov?.totalContent       || 0} color="text-sky-400"
            sub={`${ov?.contentByPlatform?.YouTube || 0} YT · ${ov?.contentByPlatform?.TikTok || 0} TK`} />
          <StatCard icon={Send}        label="Bài đã đăng"       value={ov?.totalPosted         || 0} color="text-green-400"
            sub={`${ov?.postedByPlatform?.YouTube || 0} YT · ${ov?.postedByPlatform?.Facebook || 0} FB`} />
          <StatCard icon={GitBranch}   label="Pipelines"         value={ov?.totalPipelines      || 0} color="text-purple-400" />
          <StatCard icon={CheckCircle} label="Jobs thành công"   value={ov?.jobsByStatus?.completed || 0} color="text-emerald-400"
            sub={`${ov?.jobsByStatus?.failed || 0} thất bại`} />
        </div>
      )}

      {/* Platform breakdown + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h2 className="font-semibold mb-4">Theo nền tảng</h2>
          <div className="space-y-3">
            {['YouTube', 'TikTok', 'Facebook', 'Instagram'].map((p) => {
              const count = ov?.contentByPlatform?.[p] || 0;
              const total = Math.max(ov?.totalContent || 1, 1);
              const pct   = Math.round((count / total) * 100);
              const barColor = {
                YouTube: 'bg-red-500', TikTok: 'bg-pink-500',
                Facebook: 'bg-blue-500', Instagram: 'bg-purple-500',
              }[p];
              return (
                <div key={p}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={`font-medium ${PLATFORM_COLOR[p]}`}>{p}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="font-semibold mb-4">Hoạt động gần đây</h2>
          {(overview?.recentActivity?.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-3">Chưa có nội dung nào.</p>
              <Link href="/dashboard/create" className="btn-primary text-sm inline-flex items-center gap-2">
                Tạo bài đầu tiên
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {(overview?.recentActivity || []).slice(0, 7).map((item) => (
                <div key={item._id} className="flex items-center gap-3 py-2.5 border-b border-slate-800/50 last:border-0">
                  <span className={`text-xs font-semibold w-20 shrink-0 ${PLATFORM_COLOR[item.platform]}`}>
                    {item.platform}
                  </span>
                  <p className="text-sm text-slate-300 truncate flex-1">
                    {item.output?.title || item.topic}
                  </p>
                  <span className="text-xs text-slate-600 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Free plan upsell */}
      {user?.plan === 'free' && (
        <div className="bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-sky-500/10 border border-sky-500/20 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" /> Nâng cấp lên Pro để mở khoá toàn bộ
            </h3>
            <p className="text-sm text-slate-400">Automation, pipeline không giới hạn, monetization nâng cao, phân phối tự động.</p>
          </div>
          <button onClick={() => setShowUpgrade(true)}
            className="btn-primary shrink-0 flex items-center gap-2">
            <Crown className="w-4 h-4" /> Nâng cấp Pro
          </button>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
