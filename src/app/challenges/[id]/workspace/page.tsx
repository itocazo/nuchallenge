'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SEED_CHALLENGES } from '@/lib/data';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import TagPill from '@/components/ui/TagPill';
import Timer from '@/components/workspace/Timer';
import MarkdownEditor from '@/components/workspace/MarkdownEditor';
import {
  ArrowLeft, Send, ChevronDown, ChevronUp,
  Lightbulb, FileText, AlertCircle, Loader2,
} from 'lucide-react';

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const challenge = SEED_CHALLENGES.find(c => c.id === id);

  const [submission, setSubmission] = useState('');
  const [showBrief, setShowBrief] = useState(true);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleSubmit = () => {
    if (!submission.trim()) return;
    setIsSubmitting(true);
    // Simulate submission delay then redirect to results
    setTimeout(() => {
      router.push(`/challenges/${id}/results`);
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Top Bar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href={`/challenges/${id}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit Workspace
        </Link>
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={challenge.difficulty} />
          <span className="text-xs text-gray-400">{challenge.id}</span>
        </div>
      </div>

      <h1 className="mb-2 text-xl font-extrabold tracking-tight text-gray-900">{challenge.title}</h1>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {challenge.tags.map(tag => (
          <TagPill key={tag} tag={tag} size="sm" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor Area */}
        <div className="space-y-4 lg:col-span-2">
          <Timer totalMinutes={challenge.timeMinutes} />
          <MarkdownEditor
            value={submission}
            onChange={setSubmission}
            placeholder={`Write your submission for "${challenge.title}"...\n\nMarkdown is supported. Be thorough — the AI evaluator will check against ${challenge.rubric.criteria.length} criteria.`}
          />

          {/* Submit Bar */}
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

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Challenge Brief */}
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
                  {challenge.instructions}
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Criteria */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Evaluation Criteria</h3>
            <div className="space-y-2">
              {challenge.rubric.criteria.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{c.name}</span>
                  <span className="font-semibold tabular-nums text-gray-900">{c.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hints */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Hints ({hintsRevealed}/{challenge.hints.length})
            </h3>
            <div className="space-y-2">
              {challenge.hints.map((hint, i) => (
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
