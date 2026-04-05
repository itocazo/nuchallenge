'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useApi } from '@/lib/hooks/use-api';
import { SEED_CHALLENGES, SEED_USERS } from '@/lib/data';
import { ALL_TAGS, Difficulty, ChallengeUserStatus, Challenge } from '@/lib/types';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import TagPill from '@/components/ui/TagPill';
import StatCard from '@/components/ui/StatCard';
import { Search, Target, CheckCircle2, Clock, Flame, X, Sparkles, Loader2 } from 'lucide-react';

interface ApiChallenge {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: Difficulty;
  timeMinutes: number;
  pointsBase: number;
  evaluationMethod: string;
  antiCheatTier: string;
  prerequisites: string[];
  producesAsset: boolean;
  userStatus: ChallengeUserStatus;
  bestScore: number | null;
  prerequisitesMet: boolean;
}

interface ApiUser {
  name: string;
  currentStreak: number;
  challengeStats: { completed: number; inProgress: number };
}

function toChallenge(ac: ApiChallenge): Challenge {
  return {
    ...ac,
    instructions: '',
    submissionFormat: '',
    rubric: { criteria: [] },
    assetType: null,
    hints: [],
    active: true,
  } as Challenge;
}

export default function ExplorerPage() {
  const { status: sessionStatus } = useSession();
  const isAuth = sessionStatus === 'authenticated';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ChallengeUserStatus | 'all'>('all');

  // Build API query string
  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set('limit', '100');
    if (searchQuery) p.set('search', searchQuery);
    if (selectedDifficulty !== 'all') p.set('difficulty', selectedDifficulty);
    if (selectedStatus !== 'all') p.set('status', selectedStatus);
    if (selectedTags.length > 0) p.set('tags', selectedTags.join(','));
    return p.toString();
  }, [searchQuery, selectedDifficulty, selectedStatus, selectedTags]);

  const { data: challengesData, loading: challengesLoading } = useApi<{ challenges: ApiChallenge[] }>(
    `/api/challenges?${queryParams}`
  );
  const { data: userData } = useApi<ApiUser>(isAuth ? '/api/users/me' : null);

  // Fallback to seed data if API fails or returns empty (no DB)
  const challenges = challengesData?.challenges;
  const useSeed = !challengesLoading && !challenges;

  const userName = userData?.name ?? SEED_USERS[0].name;
  const currentStreak = userData?.currentStreak ?? SEED_USERS[0].currentStreak;
  const completedCount = userData?.challengeStats?.completed ?? 0;
  const inProgressCount = userData?.challengeStats?.inProgress ?? 0;

  // Seed data fallback
  const SEED_STATUS: Record<string, { status: ChallengeUserStatus; score?: number }> = {
    'CH-01': { status: 'completed', score: 87 },
    'CH-02': { status: 'completed', score: 92 },
    'CH-21': { status: 'completed', score: 78 },
    'CH-05': { status: 'in_progress' },
  };

  const getSeedStatus = (id: string): ChallengeUserStatus => SEED_STATUS[id]?.status ?? 'available';
  const seedCompleted = Object.values(SEED_STATUS).filter(d => d.status === 'completed').length;

  const filteredChallenges = useMemo(() => {
    if (!useSeed && challenges) {
      return challenges.map(c => ({
        challenge: toChallenge(c),
        userStatus: c.userStatus,
        bestScore: c.bestScore,
      }));
    }
    // Seed fallback with client-side filtering
    return SEED_CHALLENGES.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!c.title.toLowerCase().includes(q) &&
            !c.description.toLowerCase().includes(q) &&
            !c.tags.some(t => t.toLowerCase().includes(q))) {
          return false;
        }
      }
      if (selectedTags.length > 0 && !c.tags.some(t => selectedTags.includes(t))) return false;
      if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;
      if (selectedStatus !== 'all' && getSeedStatus(c.id) !== selectedStatus) return false;
      return true;
    }).map(c => ({
      challenge: c,
      userStatus: getSeedStatus(c.id),
      bestScore: SEED_STATUS[c.id]?.score ?? null,
    }));
  }, [useSeed, challenges, searchQuery, selectedTags, selectedDifficulty, selectedStatus]);

  const availableCount = useSeed
    ? SEED_CHALLENGES.filter(c => getSeedStatus(c.id) === 'available').length
    : (challenges?.filter(c => c.userStatus === 'available').length ?? 0);

  const displayCompleted = useSeed ? seedCompleted : completedCount;
  const displayInProgress = useSeed
    ? Object.values(SEED_STATUS).filter(d => d.status === 'in_progress').length
    : inProgressCount;

  const recommended = filteredChallenges
    .filter(c => c.userStatus === 'available')
    .slice(0, 3);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[2rem] font-extrabold tracking-tight text-gray-900">
          Welcome back, {userName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {displayCompleted}/50 challenges completed
        </p>
        <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 transition-all"
            style={{ width: `${(displayCompleted / 50) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Target} label="Available" value={availableCount} accent="purple" />
        <StatCard icon={Clock} label="In Progress" value={displayInProgress} accent="amber" />
        <StatCard icon={CheckCircle2} label="Completed" value={displayCompleted} accent="emerald" />
        <StatCard icon={Flame} label="Streak" value={`${currentStreak} days`} accent="orange" />
      </div>

      {recommended.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-purple-500" />
            You Might Enjoy
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {recommended.map(c => (
              <ChallengeCard key={c.challenge.id} challenge={c.challenge} userStatus={c.userStatus} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search challenges..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map(tag => (
              <TagPill
                key={tag}
                tag={tag}
                selected={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
                size="sm"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value as Difficulty | 'all')}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-purple-300 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as ChallengeUserStatus | 'all')}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-purple-300 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {(selectedTags.length > 0 || selectedDifficulty !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => { setSelectedTags([]); setSelectedDifficulty('all'); setSelectedStatus('all'); setSearchQuery(''); }}
              className="self-end rounded-lg px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 text-sm text-gray-500">
          {challengesLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading challenges...
            </span>
          ) : (
            `${filteredChallenges.length} challenge${filteredChallenges.length !== 1 ? 's' : ''}`
          )}
        </div>
        {filteredChallenges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredChallenges.map(c => (
              <ChallengeCard
                key={c.challenge.id}
                challenge={c.challenge}
                userStatus={c.userStatus}
                bestScore={c.bestScore}
              />
            ))}
          </div>
        ) : !challengesLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-900">No challenges match your filters</p>
            <button
              onClick={() => { setSelectedTags([]); setSelectedDifficulty('all'); setSelectedStatus('all'); setSearchQuery(''); }}
              className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Clear all filters
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
