'use client';

import { useApi } from '@/lib/hooks/use-api';
import { SEED_LEADERBOARD } from '@/lib/data';
import { LeaderboardEntry } from '@/lib/types';
import { getInitials, formatPoints } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Flame, TrendingUp, Loader2 } from 'lucide-react';

const PODIUM_COLORS = [
  'from-amber-400 to-amber-500',
  'from-gray-300 to-gray-400',
  'from-amber-600 to-amber-700',
];

const PODIUM_HEIGHTS = ['h-28', 'h-20', 'h-16'];
const PODIUM_ORDER = [1, 0, 2];

function PodiumCard({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isFirst = index === 0;
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        'relative mb-2 flex items-center justify-center rounded-full font-bold text-white',
        isFirst ? 'h-16 w-16 text-lg' : 'h-14 w-14 text-base',
        `bg-gradient-to-br ${PODIUM_COLORS[index]}`
      )}>
        {getInitials(entry.name)}
        {entry.isCurrentUser && (
          <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-purple-500" />
        )}
      </div>
      <div className="mb-1 text-center">
        <div className={cn('font-semibold text-gray-900', isFirst ? 'text-sm' : 'text-xs')}>
          {entry.name.split(' ')[0]}
        </div>
        <div className="text-xs text-gray-400">{entry.department}</div>
      </div>
      <div className="mb-2 text-sm font-bold tabular-nums text-purple-600">
        {formatPoints(entry.points)} pts
      </div>
      <div className={cn(
        'w-24 rounded-t-lg bg-gradient-to-t',
        PODIUM_COLORS[index],
        PODIUM_HEIGHTS[index],
        'flex items-center justify-center'
      )}>
        <span className="text-2xl font-extrabold text-white/90">#{entry.rank}</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data, loading } = useApi<{ entries: LeaderboardEntry[]; currentUserRank: number | null }>('/api/leaderboard');

  const entries = data?.entries ?? SEED_LEADERBOARD;
  const currentUserRank = data?.currentUserRank ?? SEED_LEADERBOARD.find(e => e.isCurrentUser)?.rank ?? null;
  const top3 = entries.slice(0, 3);
  const currentUser = entries.find(e => e.isCurrentUser);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-[2rem] font-extrabold tracking-tight text-gray-900">Leaderboard</h1>
        <p className="mt-1 text-sm text-gray-500">Top performers across all challenges</p>
      </div>

      {top3.length >= 3 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-end justify-center gap-4">
            {PODIUM_ORDER.map(i => (
              top3[i] && <PodiumCard key={top3[i].userId} entry={top3[i]} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Completed</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr
                key={entry.userId}
                className={cn(
                  'border-b border-gray-50 transition-colors',
                  entry.isCurrentUser ? 'bg-purple-50/50' : 'hover:bg-gray-50'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {entry.rank <= 3 ? (
                      <Medal className={cn(
                        'h-4 w-4',
                        entry.rank === 1 && 'text-amber-500',
                        entry.rank === 2 && 'text-gray-400',
                        entry.rank === 3 && 'text-amber-700'
                      )} />
                    ) : (
                      <span className="w-4 text-center text-sm tabular-nums text-gray-400">{entry.rank}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-xs font-bold text-white">
                      {getInitials(entry.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{entry.name}</span>
                        {entry.isCurrentUser && (
                          <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600">You</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{entry.department} · Lvl {entry.level}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold tabular-nums text-purple-600">
                    {formatPoints(entry.points)}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  <span className="flex items-center justify-end gap-1 text-sm tabular-nums text-gray-600">
                    <Trophy className="h-3.5 w-3.5 text-gray-400" />
                    {entry.challengesCompleted}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  <span className="flex items-center justify-end gap-1 text-sm tabular-nums text-gray-600">
                    <Flame className={cn('h-3.5 w-3.5', entry.streak > 0 ? 'text-orange-400' : 'text-gray-300')} />
                    {entry.streak}d
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentUser && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-semibold text-purple-900">
                You&apos;re ranked #{currentUserRank ?? currentUser.rank} with {formatPoints(currentUser.points)} points
              </p>
              <p className="text-xs text-purple-600">
                {entries[0] && currentUser.challengesCompleted < entries[0].challengesCompleted
                  ? `Complete ${entries[0].challengesCompleted - currentUser.challengesCompleted} more challenges to reach #1`
                  : 'Keep up the great work!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
