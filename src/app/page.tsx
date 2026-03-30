'use client';

import { useState, useMemo } from 'react';
import { SEED_CHALLENGES, SEED_USERS } from '@/lib/data';
import { ALL_TAGS, Difficulty, ChallengeUserStatus } from '@/lib/types';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import TagPill from '@/components/ui/TagPill';
import StatCard from '@/components/ui/StatCard';
import { Search, Target, CheckCircle2, Clock, Flame, X, Sparkles } from 'lucide-react';

const DEMO_STATUS: Record<string, { status: ChallengeUserStatus; score?: number }> = {
  'CH-01': { status: 'completed', score: 87 },
  'CH-02': { status: 'completed', score: 92 },
  'CH-21': { status: 'completed', score: 78 },
  'CH-22': { status: 'completed', score: 85 },
  'CH-31': { status: 'completed', score: 90 },
  'CH-32': { status: 'completed', score: 88 },
  'CH-41': { status: 'completed', score: 76 },
  'CH-11': { status: 'completed', score: 95 },
  'CH-12': { status: 'completed', score: 81 },
  'CH-05': { status: 'in_progress' },
  'CH-42': { status: 'completed', score: 84 },
  'CH-33': { status: 'completed', score: 91 },
};

function getChallengeStatus(id: string): ChallengeUserStatus {
  return DEMO_STATUS[id]?.status ?? 'available';
}

export default function ExplorerPage() {
  const user = SEED_USERS[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ChallengeUserStatus | 'all'>('all');

  const completedCount = Object.values(DEMO_STATUS).filter(d => d.status === 'completed').length;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredChallenges = useMemo(() => {
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
      if (selectedStatus !== 'all' && getChallengeStatus(c.id) !== selectedStatus) return false;
      return true;
    });
  }, [searchQuery, selectedTags, selectedDifficulty, selectedStatus]);

  const recommended = SEED_CHALLENGES
    .filter(c => getChallengeStatus(c.id) === 'available')
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[2rem] font-extrabold tracking-tight text-gray-900">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {completedCount}/50 challenges completed
        </p>
        <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 transition-all"
            style={{ width: `${(completedCount / 50) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Target} label="Available" value={SEED_CHALLENGES.filter(c => getChallengeStatus(c.id) === 'available').length} accent="purple" />
        <StatCard icon={Clock} label="In Progress" value={Object.values(DEMO_STATUS).filter(d => d.status === 'in_progress').length} accent="amber" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedCount} accent="emerald" />
        <StatCard icon={Flame} label="Streak" value={`${user.currentStreak} days`} accent="orange" />
      </div>

      {recommended.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-purple-500" />
            You Might Enjoy
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {recommended.map(c => (
              <ChallengeCard key={c.id} challenge={c} userStatus="available" />
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
          {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
        </div>
        {filteredChallenges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredChallenges.map(c => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                userStatus={getChallengeStatus(c.id)}
                bestScore={DEMO_STATUS[c.id]?.score}
              />
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
