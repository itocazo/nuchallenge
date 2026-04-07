'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Puzzle,
  ClipboardList,
  ScrollText,
  ArrowLeft,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/challenges', label: 'Challenges', icon: Puzzle },
  { href: '/admin/attempts', label: 'Attempts', icon: ClipboardList },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  const roles = session?.user?.platformRole ?? [];
  const isAdmin = roles.includes('admin');
  const isEvaluator = roles.includes('evaluator');
  if (!isAdmin && !isEvaluator) {
    router.replace('/');
    return null;
  }

  // Evaluators get a reduced nav: just the review queue.
  // Admins see everything.
  const visibleNav = isAdmin
    ? NAV
    : NAV.filter((n) => n.href === '/admin/attempts');

  return (
    <div className="flex min-h-[calc(100vh-6rem)] gap-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24 space-y-1">
          <Link
            href="/"
            className="mb-4 flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to platform
          </Link>
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {isAdmin ? 'Admin' : 'Evaluator'}
          </div>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">{children}</div>
    </div>
  );
}
