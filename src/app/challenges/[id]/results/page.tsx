'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApi } from '@/lib/hooks/use-api';
import { SEED_CHALLENGES } from '@/lib/data';
import { EvaluationResult } from '@/lib/types';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import ScoreRing from '@/components/results/ScoreRing';
import CriteriaBreakdown from '@/components/results/CriteriaBreakdown';
import {
  ArrowLeft, ArrowRight, Trophy, Zap, Share2,
  AlertCircle, CheckCircle2, Sparkles, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultData {
  attemptId: string;
  challengeId: string;
  challengeTitle: string;
  status: string;
  qualityScore: number | null;
  pointsAwarded: number | null;
  evaluation: EvaluationResult | null;
  bonuses: { quality: number; speed: number; streak: number };
  scoreBreakdown?: {
    base: number;
    qualityBonus: number;
    speedBonus: number;
    streakBonus: number;
    humanAdjustment: number;
    humanAdjustmentReason: string | null;
    reviewerEntries?: Array<{
      id: string;
      kind: 'bonus' | 'adjustment';
      amount: number;
      reason: string | null;
      reviewerName: string | null;
      createdAt: string | null;
    }>;
    total: number;
    challengeMaxBase: number | null;
  };
  attemptsRemaining: number;
  evaluating: boolean;
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');

  const { data, loading, refetch } = useApi<ResultData>(
    attemptId ? `/api/attempts/${attemptId}/result` : null
  );

  const seedChallenge = SEED_CHALLENGES.find(c => c.id === id);
  const [showFeedback, setShowFeedback] = useState(false);

  // No attempt ID in the URL — refuse to render a fake score.
  if (!attemptId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">No attempt selected</p>
        <p className="mt-1 text-sm text-gray-500">
          Results pages are tied to a specific submission attempt.
        </p>
        <Link
          href={`/challenges/${id}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Challenge
        </Link>
      </div>
    );
  }

  // Poll while evaluating
  useEffect(() => {
    if (data?.evaluating) {
      const interval = setInterval(refetch, 3000);
      return () => clearInterval(interval);
    }
  }, [data?.evaluating, refetch]);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeedback(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Evaluating state
  if (data?.evaluating) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-purple-500" />
        <h2 className="text-xl font-bold text-gray-900">AI is evaluating your submission...</h2>
        <p className="mt-2 text-sm text-gray-500">This usually takes 10-20 seconds</p>
      </div>
    );
  }

  const evaluation = data?.evaluation ?? null;
  const overallScore = data?.qualityScore ?? evaluation?.overallScore ?? 0;
  const challengeTitle = data?.challengeTitle ?? seedChallenge?.title ?? 'Challenge';

  if (!evaluation && !loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">Results not found</p>
        <Link href="/" className="mt-3 text-sm text-purple-600 hover:underline">← Back to Explorer</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const challenge = seedChallenge;
  const challengeMaxBase =
    data?.scoreBreakdown?.challengeMaxBase ?? challenge?.pointsBase ?? 100;
  const pointsEarned =
    data?.pointsAwarded ?? Math.round(challengeMaxBase * (overallScore / 100));
  const confidence = evaluation?.confidence ?? 0.87;
  const bonuses = data?.bonuses ?? { quality: 0, speed: 0, streak: 0 };

  // Real ledger: base is the score-weighted amount actually earned
  // (not the challenge's max base). Falls back to a computed value if the
  // API hasn't returned a breakdown yet (demo mode / older attempts).
  const totalBonuses = bonuses.quality + bonuses.speed + bonuses.streak;
  const basePoints = data?.scoreBreakdown?.base ?? Math.max(0, pointsEarned - totalBonuses);
  const ledger: Array<{ label: string; amount: number; hint?: string }> = [
    {
      label: 'Base score',
      amount: basePoints,
      hint: `${overallScore}% of ${challengeMaxBase} max`,
    },
  ];
  if (bonuses.quality > 0) {
    ledger.push({
      label: 'Quality bonus',
      amount: bonuses.quality,
      hint: 'Awarded by reviewer',
    });
  }
  if (bonuses.speed > 0) ledger.push({ label: 'Speed bonus', amount: bonuses.speed, hint: 'Finished early' });
  if (bonuses.streak > 0) ledger.push({ label: 'Streak bonus', amount: bonuses.streak, hint: 'Daily streak' });
  // Human-touched rows from admin/evaluator review. Each reviewer entry
  // is its own ledger line so the user sees who awarded what and why.
  const reviewerEntries = data?.scoreBreakdown?.reviewerEntries ?? [];
  if (reviewerEntries.length > 0) {
    for (const entry of reviewerEntries) {
      const label = entry.kind === 'bonus' ? 'Reviewer bonus' : 'Reviewer adjustment';
      const attribution = entry.reviewerName ? ` by ${entry.reviewerName}` : '';
      ledger.push({
        label,
        amount: entry.amount,
        hint: `${entry.reason ?? 'Awarded by a human reviewer'}${attribution}`,
      });
    }
  } else {
    // Backwards-compat for older attempts whose API still only sends the
    // aggregate humanAdjustment field.
    const humanAdjustment = data?.scoreBreakdown?.humanAdjustment ?? 0;
    const humanAdjustmentReason = data?.scoreBreakdown?.humanAdjustmentReason;
    if (humanAdjustment !== 0) {
      ledger.push({
        label: humanAdjustment > 0 ? 'Reviewer bonus' : 'Reviewer adjustment',
        amount: humanAdjustment,
        hint: humanAdjustmentReason ?? 'Awarded by a human reviewer',
      });
    }
  }

  const feedback = evaluation?.feedback ?? 'Your submission demonstrates a strong grasp of the core concepts. The structure is clear and the analysis shows critical thinking beyond surface-level AI output. To improve further, consider adding more specific metrics and quantifying your assertions where possible.';

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/challenges/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Challenge
      </Link>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs text-gray-400">{id}</span>
              {challenge && <DifficultyBadge difficulty={challenge.difficulty} />}
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{challengeTitle}</h1>
            {challenge && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {challenge.tags.map(tag => <TagPill key={tag} tag={tag} size="sm" />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="flex flex-col items-center gap-6 lg:col-span-2">
          <ScoreRing score={overallScore} />

          <div className="w-full overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-amber-50/40">
            <div className="flex items-center justify-center gap-2 border-b border-amber-200/70 px-4 py-3 text-amber-900">
              <Trophy className="h-5 w-5" />
              <span className="text-2xl font-extrabold tabular-nums tracking-tight">
                +{pointsEarned}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700/80">
                pts earned
              </span>
            </div>
            <dl className="divide-y divide-amber-100">
              {ledger.map((row, idx) => (
                <div
                  key={`${row.label}-${idx}`}
                  className="flex items-baseline justify-between gap-3 px-4 py-2"
                >
                  <dt className="flex flex-col">
                    <span className="text-xs font-medium text-amber-900">{row.label}</span>
                    {row.hint && (
                      <span className="text-[10px] text-amber-700/70">{row.hint}</span>
                    )}
                  </dt>
                  <dd className="text-sm font-semibold tabular-nums text-amber-900">
                    {row.label === 'Base score'
                      ? row.amount
                      : row.amount >= 0
                        ? `+${row.amount}`
                        : row.amount /* keeps the leading minus sign */}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t-2 border-amber-200 bg-amber-100/40 px-4 py-2">
                <dt className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Total
                </dt>
                <dd className="text-base font-extrabold tabular-nums text-amber-900">
                  {pointsEarned}
                </dd>
              </div>
            </dl>
            <div className="border-t border-amber-200/60 bg-amber-50/60 px-4 py-2 text-[10px] leading-relaxed text-amber-800/80">
              <span className="font-semibold uppercase tracking-wider">Formula:</span>{' '}
              round(score% × base) + speed + streak + reviewer adj.
              <br />
              <span className="text-amber-700/70">
                This run: round({overallScore}% × {challengeMaxBase}) = {basePoints} base
                {totalBonuses > 0 ? ` + ${totalBonuses} bonuses` : ''}
                {' '}= {pointsEarned} pts.
              </span>
            </div>
          </div>

          <div className="w-full rounded-xl border border-gray-200 bg-white p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold">AI Confidence</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{Math.round(confidence * 100)}% evaluation confidence</p>
          </div>

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

        <div className="lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Score Breakdown</h2>
          <CriteriaBreakdown criteria={evaluation!.criteria} />

          <div className={cn(
            'mt-6 rounded-xl border border-purple-100 bg-purple-50/50 p-5 transition-all duration-700',
            showFeedback ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-900">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Feedback
            </h3>
            <p className="text-sm leading-relaxed text-purple-800/80">
              {feedback}
            </p>
          </div>

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
