'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiPatch } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable, { type Column } from '@/components/admin/DataTable';
import SearchInput from '@/components/admin/SearchInput';
import Pagination from '@/components/admin/Pagination';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface ChallengeRow {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  active: boolean;
  pointsBase: number;
  timeMinutes: number;
  totalAttempts: number | null;
  completedAttempts: number | null;
  avgScore: number | null;
  createdAt: string;
}

interface ChallengesResponse {
  challenges: ChallengeRow[];
  total: number;
  page: number;
  limit: number;
}

const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-green-50 text-green-600',
  intermediate: 'bg-blue-50 text-blue-600',
  advanced: 'bg-orange-50 text-orange-600',
  expert: 'bg-red-50 text-red-600',
};

export default function AdminChallengesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));

  const { data, loading, refetch } = useApi<ChallengesResponse>(`/api/admin/challenges?${params}`);

  async function toggleActive(e: React.MouseEvent, row: ChallengeRow) {
    e.stopPropagation();
    await apiPatch(`/api/admin/challenges/${row.id}`, { active: !row.active });
    refetch();
  }

  const columns: Column<ChallengeRow>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (c) => (
        <div>
          <p className="font-medium text-gray-900">{c.title}</p>
          <p className="text-xs text-gray-400">{c.id}</p>
        </div>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (c) => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${DIFF_COLORS[c.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
          {c.difficulty}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      render: (c) => (
        <button
          onClick={(e) => toggleActive(e, c)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            c.active ? 'bg-purple-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              c.active ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (c) => <span className="tabular-nums">{c.totalAttempts ?? 0}</span>,
      className: 'text-center',
    },
    {
      key: 'completionRate',
      header: 'Completion',
      render: (c) => {
        const total = c.totalAttempts ?? 0;
        const completed = c.completedAttempts ?? 0;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return <span className="tabular-nums">{total > 0 ? `${rate}%` : '—'}</span>;
      },
      className: 'text-center',
    },
    {
      key: 'avgScore',
      header: 'Avg Score',
      render: (c) => (
        <span className="tabular-nums">{c.avgScore ? `${Math.round(Number(c.avgScore))}%` : '—'}</span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Challenges"
        description="Manage platform challenges"
        action={
          <Link
            href="/admin/challenges/new"
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Create Challenge
          </Link>
        }
      />

      <div className="w-64">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search challenges..."
        />
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.challenges ?? []}
            onRowClick={(c) => router.push(`/admin/challenges/${c.id}`)}
            emptyMessage="No challenges found"
          />
          {data && (
            <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
