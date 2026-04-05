'use client';

import { useState } from 'react';
import { useApi } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable, { type Column } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';

interface AuditEvent {
  id: string;
  eventType: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminAuditPage() {
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (eventType) params.set('eventType', eventType);
  params.set('page', String(page));

  const { data, loading } = useApi<AuditResponse>(`/api/admin/audit?${params}`);

  const columns: Column<AuditEvent>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (e) => (
        <span className="text-xs tabular-nums text-gray-500">
          {new Date(e.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'event',
      header: 'Event',
      render: (e) => (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
          {e.eventType}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (e) => (
        <div>
          {e.actorName ? (
            <>
              <p className="text-sm text-gray-900">{e.actorName}</p>
              <p className="text-xs text-gray-400">{e.actorEmail}</p>
            </>
          ) : (
            <span className="text-xs text-gray-400">System</span>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (e) =>
        e.targetType ? (
          <span className="text-sm text-gray-600">
            {e.targetType}: {e.targetId?.slice(0, 8)}...
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'metadata',
      header: 'Details',
      render: (e) =>
        e.metadata ? (
          <span className="max-w-xs truncate text-xs text-gray-400" title={JSON.stringify(e.metadata)}>
            {JSON.stringify(e.metadata).slice(0, 60)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Audit Log" description="Platform activity history" />

      <div className="flex gap-3">
        <select
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400"
        >
          <option value="">All Events</option>
          <optgroup label="User">
            <option value="user.login">user.login</option>
            <option value="admin.user.created">admin.user.created</option>
            <option value="admin.user.role_changed">admin.user.role_changed</option>
            <option value="admin.user.suspended">admin.user.suspended</option>
            <option value="admin.user.reactivated">admin.user.reactivated</option>
          </optgroup>
          <optgroup label="Challenge">
            <option value="challenge.started">challenge.started</option>
            <option value="challenge.submitted">challenge.submitted</option>
            <option value="challenge.evaluated">challenge.evaluated</option>
            <option value="admin.challenge.created">admin.challenge.created</option>
            <option value="admin.challenge.updated">admin.challenge.updated</option>
            <option value="admin.challenge.toggled">admin.challenge.toggled</option>
          </optgroup>
          <optgroup label="Admin">
            <option value="admin.attempt.score_override">admin.attempt.score_override</option>
          </optgroup>
        </select>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.events ?? []}
            emptyMessage="No audit events found"
          />
          {data && (
            <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
