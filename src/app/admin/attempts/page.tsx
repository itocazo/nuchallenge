'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable, { type Column } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';

interface AttemptRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  challengeId: string;
  challengeTitle: string;
  status: string;
  qualityScore: string | null;
  pointsAwarded: number | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface AttemptsResponse {
  attempts: AttemptRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-50 text-green-600',
  failed: 'bg-red-50 text-red-600',
  submitted: 'bg-blue-50 text-blue-600',
  evaluating: 'bg-amber-50 text-amber-600',
  in_progress: 'bg-gray-100 text-gray-500',
};

export default function AdminAttemptsPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));

  const { data, loading } = useApi<AttemptsResponse>(`/api/admin/attempts?${params}`);

  const columns: Column<AttemptRow>[] = [
    {
      key: 'user',
      header: 'User',
      render: (a) => (
        <div>
          <p className="font-medium text-gray-900">{a.userName}</p>
          <p className="text-xs text-gray-400">{a.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'challenge',
      header: 'Challenge',
      render: (a) => <span className="text-gray-700">{a.challengeTitle}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {a.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (a) => (
        <span className="tabular-nums">{a.qualityScore ? `${Math.round(Number(a.qualityScore))}%` : '—'}</span>
      ),
      className: 'text-center',
    },
    {
      key: 'points',
      header: 'Points',
      render: (a) => (
        <span className="tabular-nums font-medium text-purple-600">{a.pointsAwarded ?? '—'}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'date',
      header: 'Date',
      render: (a) => (
        <span className="text-xs tabular-nums text-gray-400">
          {new Date(a.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Attempts" description="All challenge attempts across users" />

      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400"
        >
          <option value="">All Status</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
          <option value="evaluating">Evaluating</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.attempts ?? []}
            onRowClick={(a) => router.push(`/admin/attempts/${a.id}`)}
            emptyMessage="No attempts found"
          />
          {data && (
            <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
