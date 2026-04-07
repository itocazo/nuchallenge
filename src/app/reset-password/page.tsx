'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Missing reset token. Request a new link.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong. Try again.');
    }
  };

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <span>Password updated. Redirecting to sign in…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-gray-600">
          New password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="min. 8 characters"
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold text-gray-600">
          Confirm password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="repeat password"
            required
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !token}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900">
          Set new password
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Choose a strong password you haven&apos;t used before.
        </p>

        <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link href="/forgot-password" className="hover:underline">
            Request a new link
          </Link>
        </p>
      </div>
    </div>
  );
}
