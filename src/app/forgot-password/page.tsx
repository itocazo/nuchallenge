'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong. Try again.');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="mb-6 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900">
          Forgot password?
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {done ? (
          <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>
              If that email is registered, a reset link is on its way. Check your inbox
              (and spam folder).
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-gray-600">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@nubank.com"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
