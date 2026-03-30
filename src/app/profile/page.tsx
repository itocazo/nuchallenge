'use client';

import { SEED_CHALLENGES, SEED_USERS } from '@/lib/data';
import { ALL_TAGS } from '@/lib/types';
import { getInitials, formatPoints } from '@/lib/utils';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import {
  Trophy, Flame, Target, Star, Award,
  TrendingUp, Calendar, CheckCircle2, Clock,
} from 'lucide-react';

const DEMO_COMPLETED: Record<string, number> = {
  'CH-01': 87, 'CH-02': 92, 'CH-21': 78, 'CH-22': 85,
  'CH-31': 90, 'CH-32': 88, 'CH-41': 76, 'CH-11': 95,
  'CH-12': 81, 'CH-42': 84, 'CH-33': 91, 'CH-05': 73,
};

const BADGE_ICONS: Record<string, React.ElementType> = {
  'First Steps': Star,
  'Speed Demon': Flame,
  'Bug Hunter': Target,
  'Perfectionist': Trophy,
  'Tag Explorer': Award,
};

function getTagScores(): { tag: string; score: number }[] {
  const tagPoints: Record<string, { total: number; count: number }> = {};
  Object.entries(DEMO_COMPLETED).forEach(([id, score]) => {
    const challenge = SEED_CHALLENGES.find(c => c.id === id);
    if (!challenge) return;
    challenge.tags.forEach(tag => {
      if (!tagPoints[tag]) tagPoints[tag] = { total: 0, count: 0 };
      tagPoints[tag].total += score;
      tagPoints[tag].count += 1;
    });
  });
  return ALL_TAGS
    .map(tag => ({
      tag,
      score: tagPoints[tag] ? Math.round(tagPoints[tag].total / tagPoints[tag].count) : 0,
    }))
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score);
}

export default function ProfilePage() {
  const user = SEED_USERS[0];
  const tagScores = getTagScores();
  const maxScore = Math.max(...tagScores.map(t => t.score), 1);

  const completedChallenges = Object.entries(DEMO_COMPLETED)
    .map(([id, score]) => ({
      challenge: SEED_CHALLENGES.find(c => c.id === id)!,
      score,
    }))
    .filter(c => c.challenge)
    .sort((a, b) => b.score - a.score);

  const avgScore = completedChallenges.length > 0
    ? Math.round(completedChallenges.reduce((s, c) => s + c.score, 0) / completedChallenges.length)
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-2xl font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.title} · {user.department}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-purple-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Level {user.level}</span>
                <span className="text-gray-400">({user.levelName})</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="font-semibold tabular-nums">{formatPoints(user.pointsTotal)} pts</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-semibold tabular-nums">{user.currentStreak} day streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5 border-t border-gray-100 pt-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold tabular-nums text-gray-900">{user.challengeStats.completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-gray-900">{user.challengeStats.inProgress}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-gray-900">{avgScore}</div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tag Proficiency */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Tag Proficiency</h2>
            <div className="space-y-3">
              {tagScores.map(({ tag, score }) => (
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

          {/* Completed Challenges */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Completed Challenges ({completedChallenges.length})
            </h2>
            <div className="space-y-2">
              {completedChallenges.map(({ challenge, score }) => (
                <div key={challenge.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{challenge.id}</span>
                      <span className="truncate text-sm font-medium text-gray-900">{challenge.title}</span>
                    </div>
                  </div>
                  <DifficultyBadge difficulty={challenge.difficulty} />
                  <div className="text-sm font-semibold tabular-nums text-purple-600">{score}/100</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Badges */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Badges</h2>
            <div className="grid grid-cols-2 gap-3">
              {user.badges.map(badge => {
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

          {/* Interests */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Interests</h2>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map(tag => (
                <TagPill key={tag} tag={tag} size="sm" />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Stats</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Flame className="h-4 w-4 text-orange-400" /> Longest Streak
                </span>
                <span className="font-semibold tabular-nums text-gray-900">{user.longestStreak} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-400" /> Current Streak
                </span>
                <span className="font-semibold tabular-nums text-gray-900">{user.currentStreak} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4 text-gray-400" /> Avg Score
                </span>
                <span className="font-semibold tabular-nums text-gray-900">{avgScore}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
