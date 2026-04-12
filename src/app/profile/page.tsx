'use client';

import { useApi } from '@/lib/hooks/use-api';
import { SEED_CHALLENGES, SEED_USERS } from '@/lib/data';
import { getInitials, formatPoints } from '@/lib/utils';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import { signOut } from 'next-auth/react';
import {
  Trophy, Flame, Target, Star, Award,
  TrendingUp, Calendar, CheckCircle2, Clock, Loader2, LogOut,
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  department: string | null;
  title: string | null;
  level: number | null;
  levelName: string | null;
  pointsTotal: number | null;
  currentStreak: number | null;
  longestStreak: number | null;
  badges: string[] | null;
  interests: string[] | null;
  challengeStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  tagAffinity: { tag: string; completed: number; total: number; avgScore: number }[];
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  'First Steps': Star,
  'Speed Demon': Flame,
  'Bug Hunter': Target,
  'Perfectionist': Trophy,
  'Tag Explorer': Award,
};

export default function ProfilePage() {
  const { data, loading } = useApi<ProfileData>('/api/users/me');
  const seedUser = SEED_USERS[0];

  // Only fall back to seed when the API returned nothing at all (e.g. logged out
  // or DB error). Once we have real data, never cross-fill nulls from seed —
  // that leads to showing Sofia's department/title/badges for a different user.
  const src = data ?? seedUser;
  const name = src.name;
  const department = src.department;
  const title = src.title;
  const level = src.level;
  const levelName = src.levelName;
  const pointsTotal = src.pointsTotal;
  const currentStreak = src.currentStreak;
  const longestStreak = data?.longestStreak ?? seedUser.longestStreak;
  const badges = src.badges ?? [];
  const interests = src.interests ?? [];
  const completed = data?.challengeStats?.completed ?? seedUser.challengeStats.completed;
  const inProgress = data?.challengeStats?.inProgress ?? seedUser.challengeStats.inProgress;

  const tagScores = data?.tagAffinity?.filter(t => t.avgScore > 0).sort((a, b) => b.avgScore - a.avgScore) ?? [];
  const maxScore = Math.max(...tagScores.map(t => t.avgScore), 1);

  // Show a real average only when there's data. Otherwise show em-dash.
  const avgScore = tagScores.length > 0
    ? Math.round(tagScores.reduce((s, t) => s + t.avgScore, 0) / tagScores.length)
    : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-2xl font-bold text-white">
            {getInitials(name)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{name}</h1>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
            <p className="text-sm text-gray-500">{title} · {department}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-purple-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Level {level}</span>
                <span className="text-gray-400">({levelName})</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="font-semibold tabular-nums">{formatPoints(pointsTotal ?? 0)} pts</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-semibold tabular-nums">{currentStreak} day streak</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold tabular-nums text-gray-900">{completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-gray-900">{inProgress}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-gray-900">{avgScore ?? '—'}</div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {tagScores.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Tag Proficiency</h2>
              <div className="space-y-3">
                {tagScores.map(({ tag, avgScore: score }) => (
                  <div key={tag} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <TagPill tag={tag} size="sm" />
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                          style={{ width: `${(score / maxScore) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold tabular-nums text-gray-600">{score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tagScores.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <Target className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-900">No completed challenges yet</p>
              <p className="mt-1 text-xs text-gray-500">Complete challenges to see your tag proficiency</p>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {badges && badges.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Badges</h2>
              <div className="grid grid-cols-2 gap-3">
                {badges.map(badge => {
                  const BadgeIcon = BADGE_ICONS[badge] ?? Award;
                  return (
                    <div key={badge} className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                        <BadgeIcon className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{badge}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {interests && interests.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Interests</h2>
              <div className="flex flex-wrap gap-1.5">
                {interests.map(tag => (
                  <TagPill key={tag} tag={tag} size="sm" />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Stats</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Flame className="h-4 w-4 text-orange-400" /> Longest Streak
                </span>
                <span className="font-semibold tabular-nums text-gray-900">{longestStreak} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-400" /> Current Streak
                </span>
                <span className="font-semibold tabular-nums text-gray-900">{currentStreak} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4 text-gray-400" /> Avg Score
                </span>
                <span className="font-semibold tabular-nums text-gray-900">{avgScore !== null ? `${avgScore}/100` : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
