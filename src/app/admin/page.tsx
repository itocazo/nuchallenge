'use client';

import { useApi } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Users, Puzzle, ClipboardList, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  kpis: {
    totalUsers: number;
    activeUsers30d: number;
    suspendedUsers: number;
    totalChallenges: number;
    activeChallenges: number;
    totalAttempts: number;
    completedAttempts: number;
    avgScore: number | null;
    avgPointsAwarded: number | null;
  };
  charts: {
    completionsByDifficulty: { difficulty: string; completed: number }[];
    tagPopularity: { tag: string; count: number }[];
  };
  topPerformers: { id: string; name: string; email: string; pointsTotal: number; level: number }[];
  recentCompletions: {
    attemptId: string;
    userName: string;
    challengeTitle: string;
    qualityScore: string;
    pointsAwarded: number;
    completedAt: string;
  }[];
}

const KPI_CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { key: 'activeChallenges', label: 'Active Challenges', icon: Puzzle, color: 'text-purple-600 bg-purple-50' },
  { key: 'completedAttempts', label: 'Completions', icon: ClipboardList, color: 'text-green-600 bg-green-50' },
  { key: 'avgScore', label: 'Avg Score', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
] as const;

export default function AdminDashboard() {
  const { data, loading } = useApi<AnalyticsData>('/api/admin/analytics');

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Dashboard" description="Platform overview and analytics" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, charts, topPerformers, recentCompletions } = data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard" description="Platform overview and analytics" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          const val = kpis[card.key as keyof typeof kpis];
          return (
            <div key={card.key} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{val ?? '—'}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completions by Difficulty */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Completions by Difficulty</h3>
          <div className="space-y-3">
            {charts.completionsByDifficulty.map((d) => {
              const max = Math.max(...charts.completionsByDifficulty.map((x) => x.completed), 1);
              return (
                <div key={d.difficulty} className="flex items-center gap-3">
                  <span className="w-24 text-sm capitalize text-gray-600">{d.difficulty}</span>
                  <div className="flex-1">
                    <div
                      className="h-6 rounded-md bg-purple-100"
                      style={{ width: `${(d.completed / max) * 100}%`, minWidth: d.completed > 0 ? '2rem' : 0 }}
                    >
                      <span className="flex h-full items-center px-2 text-xs font-semibold text-purple-700">
                        {d.completed}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {charts.completionsByDifficulty.length === 0 && (
              <p className="text-sm text-gray-400">No completions yet</p>
            )}
          </div>
        </div>

        {/* Tag Popularity */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Tag Popularity</h3>
          <div className="flex flex-wrap gap-2">
            {charts.tagPopularity.map((t) => (
              <span
                key={t.tag}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {t.tag}
                <span className="ml-0.5 rounded-full bg-gray-200 px-1.5 text-[10px] font-bold tabular-nums">
                  {t.count}
                </span>
              </span>
            ))}
            {charts.tagPopularity.length === 0 && (
              <p className="text-sm text-gray-400">No tags yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Top Performers</h3>
          <div className="space-y-2">
            {topPerformers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">Lv.{u.level}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-purple-600">{u.pointsTotal} pts</span>
              </div>
            ))}
            {topPerformers.length === 0 && <p className="text-sm text-gray-400">No users yet</p>}
          </div>
        </div>

        {/* Recent Completions */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Recent Completions</h3>
          <div className="space-y-2">
            {recentCompletions.map((c) => (
              <div key={c.attemptId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{c.challengeTitle}</p>
                  <p className="text-xs text-gray-400">by {c.userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-gray-700">
                    {c.qualityScore ? `${Math.round(Number(c.qualityScore))}%` : '—'}
                  </p>
                  <p className="text-xs tabular-nums text-gray-400">{c.pointsAwarded} pts</p>
                </div>
              </div>
            ))}
            {recentCompletions.length === 0 && <p className="text-sm text-gray-400">No completions yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
