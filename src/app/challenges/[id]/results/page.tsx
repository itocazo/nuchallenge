'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { SEED_CHALLENGES } from '@/lib/data';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import ScoreRing from '@/components/results/ScoreRing';
import CriteriaBreakdown from '@/components/results/CriteriaBreakdown';
import {
  ArrowLeft, ArrowRight, Trophy, Zap, Share2,
  AlertCircle, CheckCircle2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo evaluation result
function generateDemoResult(challenge: typeof SEED_CHALLENGES[0]) {
  const scores = challenge.rubric.criteria.map(c => ({
    name: c.name,
    weight: c.weight,
    score: Math.floor(Math.random() * 20) + 75, // 75-94
    justification: `Your ${c.name.toLowerCase()} demonstrates solid understanding. ${c.description} — you met most expectations with room for refinement on edge cases.`,
  }));
  const overall = Math.round(
    scores.reduce((sum, s) => sum + s.score * (s.weight / 100), 0)
  );
  return { criteria: scores, overallScore: overall, confidence: 0.87 };
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const challenge = SEED_CHALLENGES.find(c => c.id === id);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeedback(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!challenge) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">Challenge not found</p>
        <Link href="/" className="mt-3 text-sm text-purple-600 hover:underline">← Back to Explorer</Link>
      </div>
    );
  }

  const result = generateDemoResult(challenge);
  const pointsEarned = Math.round(challenge.pointsBase * (result.overallScore / 100));

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/challenges/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Challenge
      </Link>

      {/* Header */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs text-gray-400">{challenge.id}</span>
              <DifficultyBadge difficulty={challenge.difficulty} />
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{challenge.title}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {challenge.tags.map(tag => <TagPill key={tag} tag={tag} size="sm" />)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Score Ring + Summary */}
        <div className="flex flex-col items-center gap-6 lg:col-span-2">
          <ScoreRing score={result.overallScore} />

          {/* Points Earned */}
          <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <Trophy className="h-5 w-5" />
              <span className="text-lg font-bold tabular-nums">+{pointsEarned} pts</span>
            </div>
            <p className="mt-1 text-xs text-amber-600">
              {pointsEarned}/{challenge.pointsBase} possible points
            </p>
          </div>

          {/* Confidence */}
          <div className="w-full rounded-xl border border-gray-200 bg-white p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold">AI Confidence</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500"
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{Math.round(result.confidence * 100)}% evaluation confidence</p>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
            <Link
              href={`/challenges/${id}/workspace`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100"
            >
              <Zap className="h-3.5 w-3.5" />
              Retry
            </Link>
          </div>
        </div>

        {/* Criteria Breakdown */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Score Breakdown</h2>
          <CriteriaBreakdown criteria={result.criteria} />

          {/* AI Feedback */}
          <div className={cn(
            'mt-6 rounded-xl border border-purple-100 bg-purple-50/50 p-5 transition-all duration-700',
            showFeedback ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-900">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Feedback
            </h3>
            <p className="text-sm leading-relaxed text-purple-800/80">
              Your submission demonstrates a strong grasp of the core concepts. The structure is clear and
              the analysis shows critical thinking beyond surface-level AI output. To improve further,
              consider adding more specific metrics and quantifying your assertions where possible.
              The evaluation criteria weights suggest investing more time in the highest-weighted areas
              for maximum impact on your score.
            </p>
          </div>

          {/* Next Challenge */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Continue Learning</h3>
            <Link
              href="/"
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-purple-600">Browse more challenges</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
