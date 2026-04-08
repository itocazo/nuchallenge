'use client';

import { useState, use, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApi, apiPost, apiPatch } from '@/lib/hooks/use-api';
import { SEED_CHALLENGES } from '@/lib/data';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import Timer from '@/components/workspace/Timer';
import MarkdownEditor from '@/components/workspace/MarkdownEditor';
import CodeEditor from '@/components/workspace/CodeEditor';
import VisibleTestCases from '@/components/workspace/VisibleTestCases';
import {
  ArrowLeft, Send, ChevronDown, ChevronUp,
  Lightbulb, FileText, AlertCircle, Loader2,
} from 'lucide-react';

interface StartResponse {
  attemptId: string;
  instructions: string | null;
  draftText: string | null;
  resumed: boolean;
}

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdFromUrl = searchParams.get('attempt');

  // Fetch challenge detail
  const { data: challengeData } = useApi<{ challenge: { instructions: string; hints: { level: number; text: string }[] } & Record<string, unknown> }>(`/api/challenges/${id}`);
  const seedChallenge = SEED_CHALLENGES.find(c => c.id === id);
  const challenge = challengeData?.challenge ?? seedChallenge;

  const [attemptId, setAttemptId] = useState<string | null>(attemptIdFromUrl);
  const [submission, setSubmission] = useState('');
  const [showBrief, setShowBrief] = useState(true);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-start attempt if none from URL
  useEffect(() => {
    if (!attemptIdFromUrl && id) {
      apiPost<StartResponse>(`/api/challenges/${id}/start`)
        .then(res => {
          setAttemptId(res.attemptId);
          if (res.draftText) setSubmission(res.draftText);
        })
        .catch(() => {
          // Demo mode — no attempt tracking
        });
    }
  }, [attemptIdFromUrl, id]);

  // Autosave draft every 30 seconds
  const lastSaved = useRef('');
  const saveDraft = useCallback(async () => {
    if (!attemptId || !submission || submission === lastSaved.current) return;
    try {
      await apiPatch(`/api/attempts/${attemptId}/draft`, { draftText: submission });
      lastSaved.current = submission;
    } catch {
      // Silent fail for autosave
    }
  }, [attemptId, submission]);

  useEffect(() => {
    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  // Guard against losing work on tab close / reload while there are unsaved
  // changes (anything different from what the autosave timer last flushed).
  const isDirty = submission !== lastSaved.current && submission.trim().length > 0;
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore the custom string but still show a prompt
      // when returnValue is set.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Intercept the in-app Exit link when the draft is dirty.
  const handleExit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isDirty || isSubmitting) return;
    const ok = window.confirm(
      'You have unsaved changes in your submission. Leave the workspace anyway?'
    );
    if (!ok) {
      e.preventDefault();
    }
  };

  if (!challenge) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">Challenge not found</p>
        <Link href="/" className="mt-3 text-sm text-purple-600 hover:underline">
          ← Back to Explorer
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!submission.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    // Save final draft
    await saveDraft();

    if (attemptId) {
      try {
        const result = await apiPost<{ attemptId: string }>(`/api/challenges/${id}/submit`, {
          attemptId,
          submissionText: submission,
        });
        router.push(`/challenges/${id}/results?attempt=${result.attemptId}`);
        return;
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Submission failed');
        setIsSubmitting(false);
        setShowConfirm(false);
        return;
      }
    }

    // Demo mode fallback
    setTimeout(() => {
      router.push(`/challenges/${id}/results`);
    }, 2000);
  };

  const tags = (challenge as Record<string, unknown>).tags as string[] | undefined;
  const difficulty = (challenge as Record<string, unknown>).difficulty as string;
  const timeMinutes = (challenge as Record<string, unknown>).timeMinutes as number;
  const title = (challenge as Record<string, unknown>).title as string;
  const instructions = challenge.instructions ?? '';
  const hints = challenge.hints ?? [];
  const rubricCriteria = seedChallenge?.rubric?.criteria ?? [];

  // Pick the editor by grader type. code-sandbox challenges get a real
  // code editor with tab-handling, line numbers, and a visible-tests panel;
  // everything else keeps the markdown editor it's always had.
  const grader = seedChallenge?.rubric?.grader;
  const isCodeSandbox = grader?.type === 'code-sandbox';
  const entrypoint = isCodeSandbox
    ? ((grader!.config as { entrypoint?: string }).entrypoint ?? 'solve')
    : null;
  const codeStarter = entrypoint
    ? `function ${entrypoint}(/* args */) {\n  // your code here\n}\n`
    : '';

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href={`/challenges/${id}`}
          onClick={handleExit}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit Workspace
        </Link>
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert'} />
          <span className="text-xs text-gray-400">{id}</span>
        </div>
      </div>

      <h1 className="mb-2 text-xl font-extrabold tracking-tight text-gray-900">{title}</h1>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {tags?.map(tag => (
          <TagPill key={tag} tag={tag} size="sm" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Timer totalMinutes={timeMinutes} />
          {isCodeSandbox ? (
            <CodeEditor
              value={submission}
              onChange={setSubmission}
              placeholder={codeStarter}
              language="javascript"
              onSubmit={() => {
                if (submission.trim() && !isSubmitting) setShowConfirm(true);
              }}
            />
          ) : (
            <MarkdownEditor
              value={submission}
              onChange={setSubmission}
              placeholder={`Write your submission for "${title}"...\n\nMarkdown is supported. Be thorough — the AI evaluator will check against ${rubricCriteria.length} criteria.`}
            />
          )}

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {submission.trim().split(/\s+/).filter(Boolean).length} words written
            </p>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!submission.trim() || isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Submit for Evaluation
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Confirm Submit
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {isCodeSandbox && <VisibleTestCases grader={grader} />}
          <div className="rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => setShowBrief(!showBrief)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-gray-400" />
                Challenge Brief
              </span>
              {showBrief ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {showBrief && (
              <div className="border-t border-gray-100 p-4">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-600">
                  {instructions}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Evaluation Criteria</h3>
            <div className="space-y-2">
              {rubricCriteria.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{c.name}</span>
                  <span className="font-semibold tabular-nums text-gray-900">{c.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Hints ({hintsRevealed}/{hints.length})
            </h3>
            <div className="space-y-2">
              {hints.map((hint, i) => (
                <div key={i}>
                  {i < hintsRevealed ? (
                    <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                      {hint.text}
                    </div>
                  ) : i === hintsRevealed ? (
                    <button
                      onClick={() => setHintsRevealed(prev => prev + 1)}
                      className="w-full rounded-lg border border-dashed border-amber-200 p-2.5 text-xs text-amber-600 hover:bg-amber-50"
                    >
                      Reveal hint {i + 1} (−{(i + 1) * 5}% score penalty)
                    </button>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-100 p-2.5 text-xs text-gray-300">
                      Hint {i + 1} locked
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
