'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useApi, apiPatch } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ArrowLeft, Download, ShieldAlert, ShieldCheck } from 'lucide-react';

interface UserDetail {
  user: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    title: string | null;
    platformRole: string[];
    level: number;
    levelName: string;
    pointsTotal: number;
    currentStreak: number;
    longestStreak: number;
    badges: string[];
    interests: string[];
    suspendedAt: string | null;
    createdAt: string;
  };
  attempts: {
    id: string;
    challengeId: string;
    status: string;
    qualityScore: string | null;
    pointsAwarded: number | null;
    createdAt: string;
  }[];
  transactions: {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
  }[];
  auditEvents: {
    id: string;
    eventType: string;
    createdAt: string;
  }[];
}

const ROLES = ['challenger', 'admin', 'evaluator', 'builder'] as const;

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, refetch } = useApi<UserDetail>(`/api/admin/users/${id}`);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'attempts' | 'points' | 'activity'>('attempts');

  if (loading || !data) {
    return <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />;
  }

  const { user, attempts, transactions, auditEvents } = data;

  async function toggleRole(role: string) {
    setSaving(true);
    const current = user.platformRole ?? [];
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    if (next.length === 0) { setSaving(false); return; }
    await apiPatch(`/api/admin/users/${id}`, { platformRole: next });
    refetch();
    setSaving(false);
  }

  async function toggleSuspend() {
    setSaving(true);
    await apiPatch(`/api/admin/users/${id}`, { suspended: !user.suspendedAt });
    refetch();
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to users
      </Link>

      <AdminPageHeader
        title={user.name}
        description={user.email}
        action={
          <a
            href={`/api/admin/users/${id}/export`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export Data
          </a>
        }
      />

      {/* User Info + Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-gray-400">Department</p>
              <p className="font-medium text-gray-900">{user.department ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400">Title</p>
              <p className="font-medium text-gray-900">{user.title ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400">Level</p>
              <p className="font-medium text-gray-900">Lv.{user.level} {user.levelName}</p>
            </div>
            <div>
              <p className="text-gray-400">Points</p>
              <p className="font-medium text-purple-600">{user.pointsTotal}</p>
            </div>
            <div>
              <p className="text-gray-400">Current Streak</p>
              <p className="font-medium text-gray-900">{user.currentStreak}</p>
            </div>
            <div>
              <p className="text-gray-400">Longest Streak</p>
              <p className="font-medium text-gray-900">{user.longestStreak}</p>
            </div>
            <div>
              <p className="text-gray-400">Joined</p>
              <p className="font-medium text-gray-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className={`font-medium ${user.suspendedAt ? 'text-red-600' : 'text-green-600'}`}>
                {user.suspendedAt ? 'Suspended' : 'Active'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Role Editor */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Roles</h3>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const active = user.platformRole?.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRole(r)}
                    disabled={saving}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suspend/Reactivate */}
          <button
            onClick={toggleSuspend}
            disabled={saving}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              user.suspendedAt
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            {user.suspendedAt ? (
              <>
                <ShieldCheck className="h-4 w-4" /> Reactivate User
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" /> Suspend User
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['attempts', 'points', 'activity'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'attempts' && (
        <div className="space-y-2">
          {attempts.length === 0 && <p className="text-sm text-gray-400">No attempts yet</p>}
          {attempts.map((a) => (
            <Link
              key={a.id}
              href={`/admin/attempts/${a.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{a.challengeId}</p>
                <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  a.status === 'completed' ? 'bg-green-50 text-green-600' :
                  a.status === 'failed' ? 'bg-red-50 text-red-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {a.status}
                </span>
                {a.qualityScore && (
                  <span className="text-sm tabular-nums font-medium text-gray-700">{Math.round(Number(a.qualityScore))}%</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'points' && (
        <div className="space-y-2">
          {transactions.length === 0 && <p className="text-sm text-gray-400">No transactions yet</p>}
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-400">{t.description ?? new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {t.amount >= 0 ? '+' : ''}{t.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-2">
          {auditEvents.length === 0 && <p className="text-sm text-gray-400">No activity yet</p>}
          {auditEvents.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-sm text-gray-700">{e.eventType}</p>
              <p className="text-xs tabular-nums text-gray-400">{new Date(e.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
