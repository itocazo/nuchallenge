'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiPost } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DataTable, { type Column } from '@/components/admin/DataTable';
import SearchInput from '@/components/admin/SearchInput';
import Pagination from '@/components/admin/Pagination';
import { Plus, X } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  department: string | null;
  title: string | null;
  platformRole: string[];
  level: number;
  pointsTotal: number;
  suspendedAt: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [suspended, setSuspended] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  if (suspended) params.set('suspended', suspended);
  params.set('page', String(page));

  const { data, loading, refetch } = useApi<UsersResponse>(`/api/admin/users?${params}`);

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div>
          <p className="font-medium text-gray-900">{u.name}</p>
          <p className="text-xs text-gray-400">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.platformRole?.map((r) => (
            <span
              key={r}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                r === 'admin'
                  ? 'bg-red-50 text-red-600'
                  : r === 'evaluator'
                    ? 'bg-blue-50 text-blue-600'
                    : r === 'builder'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-gray-100 text-gray-600'
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      render: (u) => <span className="tabular-nums">{u.level}</span>,
      className: 'text-center',
    },
    {
      key: 'points',
      header: 'Points',
      render: (u) => <span className="tabular-nums font-medium text-purple-600">{u.pointsTotal}</span>,
      className: 'text-right',
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) =>
        u.suspendedAt ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
            Suspended
          </span>
        ) : (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600">
            Active
          </span>
        ),
    },
  ];

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    const fd = new FormData(e.currentTarget);
    try {
      await apiPost('/api/admin/users', {
        name: fd.get('name'),
        email: fd.get('email'),
        department: fd.get('department') || undefined,
        title: fd.get('title') || undefined,
        platformRole: [fd.get('role') || 'challenger'],
      });
      setShowCreate(false);
      refetch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Users"
        description="Manage platform users"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name or email..."
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400"
        >
          <option value="">All Roles</option>
          <option value="challenger">Challenger</option>
          <option value="admin">Admin</option>
          <option value="evaluator">Evaluator</option>
          <option value="builder">Builder</option>
        </select>
        <select
          value={suspended}
          onChange={(e) => { setSuspended(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400"
        >
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.users ?? []}
            onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
            emptyMessage="No users found"
          />
          {data && (
            <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="space-y-3">
              <input name="name" required placeholder="Full name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400" />
              <input name="email" required type="email" placeholder="Email address" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400" />
              <input name="department" placeholder="Department (optional)" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400" />
              <input name="title" placeholder="Title (optional)" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400" />
              <select name="role" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400">
                <option value="challenger">Challenger</option>
                <option value="admin">Admin</option>
                <option value="evaluator">Evaluator</option>
                <option value="builder">Builder</option>
              </select>
            </div>
            <p className="text-xs text-gray-400">A password will be auto-generated and emailed to the user.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
