'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, LogOut, Crown, User, TrendingUp, FileText,
  Send, GitBranch, DollarSign, Bot, Flame, Clapperboard, Rocket, BarChart2, LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Overview',     icon: TrendingUp  },
  { href: '/dashboard/create',       label: 'Tạo nội dung', icon: FileText    },
  { href: '/dashboard/script',       label: 'Script',       icon: Clapperboard },
  { href: '/dashboard/growth',            label: 'Growth Plan',   icon: Rocket    },
  { href: '/dashboard/channel-analysis', label: 'Channel Audit', icon: BarChart2 },
  { href: '/dashboard/trends',       label: 'Trends',       icon: Flame       },
  { href: '/dashboard/automation',   label: 'Automation',   icon: Bot         },
  { href: '/dashboard/distribution', label: 'Phân phối',    icon: Send        },
  { href: '/dashboard/pipeline',     label: 'Pipeline',     icon: GitBranch   },
  { href: '/dashboard/monetization', label: 'Monetize',     icon: DollarSign  },
  { href: '/dashboard/support',      label: 'Hỗ trợ',       icon: LifeBuoy    },
];

export default function DashboardLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Sync plan từ server mỗi khi vào dashboard (bắt kịp sau khi được duyệt Pro)
  const { refreshUser } = useAuth();
  useEffect(() => {
    if (user) refreshUser();
  }, []);

  const handleUpgrade = () => setShowUpgradeModal(true);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sửa nút upgrade để không cần truyền disabled/loading nữa
  const UpgradeButton = ({ className = '', small = false }) =>
    user.plan === 'free' ? (
      <button onClick={handleUpgrade}
        className={className || `btn-primary w-full text-xs flex items-center justify-center gap-1.5 ${small ? 'py-1.5 px-3' : 'py-2'}`}>
        <Crown className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        {small ? 'Pro' : 'Nâng cấp Pro'}
      </button>
    ) : null;

  const isActive = (href) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-slate-800 bg-slate-950 py-6 px-4 shrink-0 fixed top-0 left-0 h-full z-30">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg mb-8 px-2 hover:opacity-80 transition-opacity">
          <Zap className="w-5 h-5 text-sky-400" />
          Content<span className="text-sky-400">AI</span>
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive(href)
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
          <Link href="/dashboard/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2
              ${pathname === '/dashboard/admin'
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                : 'text-yellow-700 hover:text-yellow-400 hover:bg-slate-800/70'}`}>
            <Crown className="w-4 h-4 shrink-0" />
            Admin
          </Link>
        </nav>

        {/* Bottom user section */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          {user.plan === 'free' && (
            <div className="px-3 py-2 bg-slate-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Credits còn lại</span>
                <span className="text-xs font-bold text-sky-400">{user.credits ?? 0}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-sky-500 transition-all"
                  style={{ width: `${Math.min(100, ((user.credits ?? 0) / 10) * 100)}%` }} />
              </div>
            </div>
          )}

          {user.plan === 'free' ? (
            <button onClick={handleUpgrade}
              className="btn-primary w-full text-xs flex items-center justify-center gap-1.5 py-2">
              <Crown className="w-3.5 h-3.5" />
              Nâng cấp Pro
            </button>
          ) : (
            <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">Pro Plan ⭐</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
              <p className="text-xs text-slate-500 truncate leading-tight">{user.email}</p>
            </div>
            <button onClick={logout} title="Đăng xuất"
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main wrapper (offset for sidebar on desktop) ── */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="lg:hidden border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-sky-400" />
            Content<span className="text-sky-400">AI</span>
          </Link>
          <div className="flex items-center gap-2">
            {user.plan === 'free' && (
              <span className="text-xs text-slate-500">{user.credits ?? 0} cr</span>
            )}
            {user.plan === 'free' ? (
              <button onClick={handleUpgrade} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Pro
              </button>
            ) : (
              <span className="text-xs text-yellow-400 font-medium">⭐ Pro</span>
            )}
            <button onClick={logout} className="p-2 text-slate-500 hover:text-slate-300">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 z-40">
          <div className="flex justify-around px-1 py-1">
            {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0
                  ${isActive(href) ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium truncate max-w-[40px] text-center leading-tight">
                  {label.split(' ')[0]}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
