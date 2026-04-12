'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn, formatPoints, getInitials } from '@/lib/utils';
import { useApi } from '@/lib/hooks/use-api';
import { Compass, Trophy, UserCircle, Flame, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Explorer', icon: Compass },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.platformRole?.includes('admin');
  const { data: userStats } = useApi<{ pointsTotal: number }>(user ? '/api/users/me' : null);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <span className="hidden text-lg font-semibold text-gray-900 sm:block">NuChallenge</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                pathname.startsWith('/admin') ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </nav>

        <div className="flex-1" />

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-sm sm:flex">
              <span className="tabular-nums font-semibold text-purple-600">{formatPoints(userStats?.pointsTotal ?? 0)}</span>
              <span className="text-gray-400">pts</span>
            </div>

            <Link href="/profile" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-xs font-bold text-white">
                {getInitials(user.name ?? 'U')}
              </div>
              <div className="hidden text-left lg:block">
                <div className="text-sm font-medium leading-tight text-gray-900">{user.name}</div>
                <div className="text-[11px] leading-tight text-gray-400">{user.email}</div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
