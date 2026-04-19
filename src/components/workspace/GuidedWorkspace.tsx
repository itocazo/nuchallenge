'use client';

/**
 * GuidedWorkspace
 *
 * Vertical, stage-by-stage tutored loop. The learner works through:
 *   1. user-prompt          → (AI) tutor-prompt-critique
 *   2. user-raw-response    → (no tutor)
 *   3. user-critique        → (AI) tutor-critique-of-critique
 *   4. user-final           → (AI) tutor-final-review  (this scores the attempt)
 *
 * The component is a thin client: it pulls `workLog` from
 * `GET /api/attempts/[id]/advance` and submits each stage via POST. The
 * server owns all state — this view just renders it.
 *
 * On finalization (server returns `finalized: { ... }`), we redirect to the
 * normal results page, which already handles evaluated attempts.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/hooks/use-api';
import { Loader2, Sparkles, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { GuidedStage, GuidedStageKind, GuidedFlowConfig } from '@/lib/types';

interface GuidedWorkspaceProps {
  attemptId: string;
  challengeId: string;
  challengeTitle: string;
  guidedConfig: GuidedFlowConfig;
}

/**
 * UI-level prompt for each learner stage. These are the questions the
 * platform asks the learner at each step.
 */
const STAGE_PROMPTS: Record<Extract<GuidedStageKind, `user-${string}`>, {
  label: string;
  help: string;
  placeholder: string;
}> = {
  'user-prompt': {
    label: 'Step 1 — Craft your prompt',
    help:
      'Write the prompt you will paste into your external LLM (ChatGPT, Claude, Gemini, etc.) to produce the deliverable. The tutor will critique your PROMPT — not the answer. You will run it yourself.',
    placeholder:
      'Example: "You are a senior PM. Given the following user pain: ... produce a PRD with: Problem, Goals, Non-goals, User Stories, Success Metrics, Risks. Keep it under 500 words."',
  },
  'user-raw-response': {
    label: 'Step 2 — Paste the raw LLM output',
    help:
      'Run the prompt in your external tool, then paste back exactly what the LLM produced. No edits. This is what we will critique together.',
    placeholder: 'Paste the raw response from the external LLM here...',
  },
  'user-critique': {
    label: 'Step 3 — What do YOU think of that output?',
    help:
      'Write your own critique of the raw output. Be specific. Call out what is weak, generic, wrong, or missing. This is the most important step — it is where you learn to judge AI output.',
    placeholder:
      'Example: "The PRD is generic. It lists `improve UX` as a goal without a metric. Success metric `increase adoption` is not measurable. Missing: accessibility, LGPD..."',
  },
  'user-final': {
    label: 'Step 4 — Your FINAL version',
    help:
      'Rewrite the deliverable incorporating your own critique. This is what will be graded, with your full work-log as context. A final that is identical to the raw output will NOT score well.',
    placeholder: 'Your revised final version — the artifact being graded...',
  },
};

const STAGE_TITLES: Record<GuidedStageKind, string> = {
  'user-prompt': 'Your prompt',
  'tutor-prompt-critique': 'Tutor: critique of your prompt',
  'user-raw-response': 'Raw LLM output',
  'user-critique': 'Your critique of the output',
  'tutor-critique-of-critique': 'Tutor: critique of your critique',
  'user-final': 'Your final version',
  'tutor-final-review': 'PM-style review (final grade)',
};

function isLearnerStage(
  k: GuidedStageKind
): k is Extract<GuidedStageKind, `user-${string}`> {
  return k.startsWith('user-');
}

export default function GuidedWorkspace({
  attemptId,
  challengeId,
  challengeTitle,
  guidedConfig,
}: GuidedWorkspaceProps) {
  const router = useRouter();
  const [workLog, setWorkLog] = useState<GuidedStage[]>([]);
  const [expectedNext, setExpectedNext] = useState<GuidedStageKind | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/attempts/${attemptId}/advance`)
      .then((r) => r.json())
      .then((data: { workLog: GuidedStage[]; expectedNext: GuidedStageKind | null }) => {
        if (cancelled) return;
        setWorkLog(data.workLog ?? []);
        setExpectedNext(data.expectedNext ?? null);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load workspace state');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const submitStage = useCallback(async () => {
    if (!expectedNext || !draft.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<{
        workLog: GuidedStage[];
        finalized?: { pointsAwarded: number; qualityScore: number; status: string };
      }>(`/api/attempts/${attemptId}/advance`, {
        kind: expectedNext,
        text: draft,
      });
      setWorkLog(res.workLog);
      setDraft('');

      if (res.finalized) {
        // Attempt is graded — jump to the normal results page.
        router.push(`/challenges/${challengeId}/results?attempt=${attemptId}`);
        return;
      }

      // Determine next expected learner stage from the new log
      const nextFromLog = nextExpectedLearnerKindClient(res.workLog);
      setExpectedNext(nextFromLog);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stage submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, challengeId, draft, expectedNext, router]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your work-log...
      </div>
    );
  }

  const activePrompt = expectedNext && isLearnerStage(expectedNext)
    ? STAGE_PROMPTS[expectedNext]
    : null;

  return (
    <div className="space-y-4">
      {/* Brief / what the learner is producing */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-700">
          Challenge brief — {challengeTitle}
        </p>
        <p className="text-sm text-purple-900 whitespace-pre-wrap">
          {guidedConfig.briefRequest}
        </p>
      </div>

      {/* Completed stages timeline */}
      {workLog.map((stage, idx) => (
        <StageCard key={idx} stage={stage} />
      ))}

      {/* Active input for the next learner stage */}
      {activePrompt && (
        <div className="rounded-xl border-2 border-purple-300 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">{activePrompt.label}</h3>
          </div>
          <p className="mb-3 text-xs text-gray-600">{activePrompt.help}</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={activePrompt.placeholder}
            className="h-44 w-full resize-y rounded-lg border border-gray-200 p-3 font-mono text-sm text-gray-800 focus:border-purple-400 focus:outline-none"
          />
          {error && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {draft.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              onClick={submitStage}
              disabled={submitting || !draft.trim()}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {expectedNext === 'user-final' ? 'Scoring...' : 'Sending to tutor...'}
                </>
              ) : (
                <>
                  {expectedNext === 'user-final' ? 'Submit for PM review' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!expectedNext && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Work-log complete. Redirecting to results...
        </div>
      )}
    </div>
  );
}

function StageCard({ stage }: { stage: GuidedStage }) {
  const learner = isLearnerStage(stage.kind);
  const Icon = learner ? User : Sparkles;
  const color = learner
    ? 'border-gray-200 bg-white'
    : 'border-indigo-200 bg-indigo-50';
  const iconColor = learner ? 'text-gray-500' : 'text-indigo-600';

  return (
    <div className={`rounded-xl border ${color} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {STAGE_TITLES[stage.kind]}
        </h4>
        <span className="ml-auto text-[10px] text-gray-400">
          {new Date(stage.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="whitespace-pre-wrap text-sm text-gray-800">{stage.text}</div>

      {stage.scores && stage.scores.length > 0 && (
        <div className="mt-3 border-t border-indigo-200 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Rubric scores
          </p>
          <div className="space-y-1.5">
            {stage.scores.map((s) => (
              <div key={s.name} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="tabular-nums font-semibold text-indigo-700">
                    {s.score}/100
                  </span>
                </div>
                <p className="text-gray-600">{s.justification}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Mirror of the server-side `nextExpectedLearnerKind`. Kept in sync by hand
 * because duplicating 10 lines is cheaper than pulling server code into the
 * client bundle. Order must match the API route.
 */
function nextExpectedLearnerKindClient(workLog: GuidedStage[]): GuidedStageKind | null {
  const order: GuidedStageKind[] = [
    'user-prompt',
    'user-raw-response',
    'user-critique',
    'user-final',
  ];
  const done = workLog.map((s) => s.kind);
  for (const k of order) {
    if (!done.includes(k)) return k;
  }
  return null;
}
