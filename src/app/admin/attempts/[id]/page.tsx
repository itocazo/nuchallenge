'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useApi, apiPatch } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ArrowLeft } from 'lucide-react';

interface AttemptDetail {
  attempt: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    challengeId: string;
    challengeTitle: string;
    attemptNumber: number;
    status: string;
    startedAt: string;
    submittedAt: string | null;
    completedAt: string | null;
    submissionText: string | null;
    submissionUrl: string | null;
    evaluationResult: Record<string, unknown> | null;
    evaluatorType: string | null;
    qualityScore: string | null;
    pointsAwarded: number | null;
    appealStatus: string | null;
    appealText: string | null;
    createdAt: string;
  };
  transactions: {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
  }[];
}

export default function AdminAttemptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, refetch } = useApi<AttemptDetail>(`/api/admin/attempts/${id}`);
  const [overrideScore, setOverrideScore] = useState('');
  const [overridePoints, setOverridePoints] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [overrideError, setOverrideError] = useState('');

  if (loading || !data) {
    return <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />;
  }

  const { attempt, transactions } = data;
  const canOverride = attempt.status === 'completed' || attempt.status === 'failed';

  async function handleOverride(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setOverrideError('');
    try {
      await apiPatch(`/api/admin/attempts/${id}`, {
        qualityScore: Number(overrideScore),
        pointsAwarded: Number(overridePoints),
        reason: overrideReason,
      });
      refetch();
      setOverrideScore('');
      setOverridePoints('');
      setOverrideReason('');
    } catch (err) {
      setOverrideError(err instanceof Error ? err.message : 'Failed to override');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/attempts" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to attempts
      </Link>

      <AdminPageHeader
        title={attempt.challengeTitle ?? attempt.challengeId}
        description={`Attempt #${attempt.attemptNumber} by ${attempt.userName}`}
      />

      {/* Info Grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-gray-400">Status</p>
            <p className="font-medium capitalize text-gray-900">{attempt.status.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-gray-400">Score</p>
            <p className="font-medium text-gray-900">
              {attempt.qualityScore ? `${Math.round(Number(attempt.qualityScore))}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Points Awarded</p>
            <p className="font-medium text-purple-600">{attempt.pointsAwarded ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Evaluator</p>
            <p className="font-medium text-gray-900">{attempt.evaluatorType ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Started</p>
            <p className="font-medium text-gray-900">{attempt.startedAt ? new Date(attempt.startedAt).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Submitted</p>
            <p className="font-medium text-gray-900">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Completed</p>
            <p className="font-medium text-gray-900">{attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">User</p>
            <Link href={`/admin/users/${attempt.userId}`} className="font-medium text-purple-600 hover:underline">
              {attempt.userName}
            </Link>
          </div>
        </div>
      </div>

      {/* Submission */}
      {attempt.submissionText && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Submission</h3>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {attempt.submissionText}
          </pre>
        </div>
      )}

      {/* Evaluation Result */}
      {attempt.evaluationResult && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Evaluation Result</h3>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
            {JSON.stringify(attempt.evaluationResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Point Transactions */}
      {transactions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Point Transactions</h3>
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{t.description}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount >= 0 ? '+' : ''}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Override */}
      {canOverride && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/30 p-5">
          <h3 className="mb-3 text-sm font-semibold text-orange-800">Score Override</h3>
          {overrideError && <p className="mb-2 text-sm text-red-600">{overrideError}</p>}
          <form onSubmit={handleOverride} className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">New Score (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">New Points</label>
              <input
                type="number"
                min={0}
                required
                value={overridePoints}
                onChange={(e) => setOverridePoints(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Reason</label>
              <div className="flex gap-2">
                <input
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason for override..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Override'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
