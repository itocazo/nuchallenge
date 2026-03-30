'use client';

import { use } from 'react';
import Link from 'next/link';
import { SEED_CHALLENGES } from '@/lib/data';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import { ArrowLeft, Clock, Zap, Shield, BookOpen, CheckCircle2, Lock, Lightbulb } from 'lucide-react';
import { useState } from 'react';

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const challenge = SEED_CHALLENGES.find(c => c.id === id);
  const [hintsRevealed, setHintsRevealed] = useState(0);

  if (!challenge) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-gray-900">Challenge not found</p>
        <Link href="/" className="mt-2 text-sm text-purple-600 hover:text-purple-700">
          Back to Explorer
        </Link>
      </div>
    );
  }

  const prereqChallenges = challenge.prerequisites.map(pid =>
    SEED_CHALLENGES.find(c => c.id === pid)
  ).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Explorer
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">{challenge.id}</span>
              <DifficultyBadge difficulty={challenge.difficulty} />
            </div>
            <h1 className="text-[2rem] font-extrabold tracking-tight text-gray-900">
              {challenge.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {challenge.tags.map(tag => (
              <TagPill key={tag} tag={tag} size="md" />
            ))}
          </div>

          <div className="prose prose-sm max-w-none">
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="text-gray-600 leading-relaxed">{challenge.description}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">What You&apos;ll Submit</h2>
            <p className="text-sm text-gray-600">{challenge.submissionFormat}</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Evaluation Criteria</h2>
            <div className="space-y-2">
              {challenge.rubric.criteria.map(criterion => (
                <div key={criterion.name} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-600">
                    {criterion.weight}%
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{criterion.name}</div>
                    <div className="text-xs text-gray-500">{criterion.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {challenge.producesAsset && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h3 className="text-sm font-semibold text-purple-800">This Challenge Produces an Asset</h3>
              <p className="mt-1 text-xs text-purple-600">
                Your submission creates a {challenge.assetType} that may be used in later challenges.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Estimated time</span>
                <span className="ml-auto font-semibold text-gray-900">{challenge.timeMinutes} min</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Zap className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Points</span>
                <span className="ml-auto tabular-nums font-semibold text-purple-600">{challenge.pointsBase} pts</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Evaluation</span>
                <span className="ml-auto font-semibold text-gray-900 capitalize">{challenge.evaluationMethod.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Anti-cheat</span>
                <span className="ml-auto font-semibold text-gray-900">{challenge.antiCheatTier}</span>
              </div>
            </div>

            {prereqChallenges.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Prerequisites</div>
                {prereqChallenges.map(prereq => prereq && (
                  <Link
                    key={prereq.id}
                    href={`/challenges/${prereq.id}`}
                    className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-gray-50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-700">{prereq.id}: {prereq.title}</span>
                  </Link>
                ))}
              </div>
            )}

            {prereqChallenges.length === 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  No prerequisites
                </div>
              </div>
            )}

            <Link
              href={`/challenges/${id}/workspace`}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 active:scale-[0.98]"
            >
              Start Challenge
            </Link>
          </div>

          {/* Hints */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Hints ({challenge.hints.length})
            </h3>
            <div className="space-y-2">
              {challenge.hints.map((hint, i) => (
                <div key={i}>
                  {i < hintsRevealed ? (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                      {hint.text}
                    </div>
                  ) : i === hintsRevealed ? (
                    <button
                      onClick={() => setHintsRevealed(h => h + 1)}
                      className="flex w-full items-center gap-2 rounded-lg border border-gray-200 p-3 text-xs text-gray-500 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      Reveal Hint {i + 1}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 text-xs text-gray-400">
                      <Lock className="h-3.5 w-3.5" />
                      Hint {i + 1} (reveal previous hint first)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
