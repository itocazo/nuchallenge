'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi, apiPatch } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ChallengeForm from '@/components/admin/ChallengeForm';
import { ArrowLeft } from 'lucide-react';

interface ChallengeDetail {
  challenge: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    tags: string[];
    difficulty: string;
    timeMinutes: number;
    pointsBase: number;
    submissionFormat: string;
    evaluationMethod: string;
    rubric: { criteria: { name: string; weight: number; description: string }[] };
    antiCheatTier: string;
    prerequisites: string[];
    producesAsset: boolean;
    assetType: string | null;
    hints: { level: number; text: string }[];
    active: boolean;
  };
  stats: {
    totalAttempts: number;
    completedAttempts: number;
    failedAttempts: number;
    completionRate: number;
    avgScore: number | null;
    avgPoints: number | null;
  };
}

export default function AdminChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading } = useApi<ChallengeDetail>(`/api/admin/challenges/${id}`);

  if (loading || !data) {
    return <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />;
  }

  const { challenge, stats } = data;

  return (
    <div className="space-y-6">
      <Link href="/admin/challenges" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to challenges
      </Link>
      <AdminPageHeader title={`Edit: ${challenge.title}`} description={challenge.id} />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Total Attempts', value: stats.totalAttempts },
          { label: 'Completed', value: stats.completedAttempts },
          { label: 'Failed', value: stats.failedAttempts },
          { label: 'Completion Rate', value: `${stats.completionRate}%` },
          { label: 'Avg Score', value: stats.avgScore ? `${stats.avgScore}%` : '—' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-100 bg-white p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <ChallengeForm
          initial={challenge}
          submitLabel="Save Changes"
          onSubmit={async (formData) => {
            await apiPatch(`/api/admin/challenges/${id}`, formData);
            router.push('/admin/challenges');
          }}
        />
      </div>
    </div>
  );
}
