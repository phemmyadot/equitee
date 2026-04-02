'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usernameOrEmail, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--canvas)] px-4">
      <div className="w-full max-w-sm">
        {/* Tagline lockup */}
        <div className="flex justify-center mb-8">
          <img
            src="/equitee-lockup-tagline.svg"
            alt="equitee — Your edge in the market."
            width={260}
            height={98}
          />
        </div>

        {/* Card */}
        <div
          className="bg-white border border-[var(--border)] rounded-2xl p-8"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          <h1 className="text-[16px] font-bold text-[var(--ink)] mb-1">Sign in</h1>
          <p className="text-[12px] text-[var(--ink-4)] mb-6">
            Enter your credentials to access your portfolio.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wide">
                Username or email
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="admin"
                className="h-9 px-3 text-[13px] border border-[var(--border)] rounded-lg bg-[var(--canvas)] text-[var(--ink)] placeholder:text-[var(--ink-4)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-9 px-3 text-[13px] border border-[var(--border)] rounded-lg bg-[var(--canvas)] text-[var(--ink)] placeholder:text-[var(--ink-4)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-9 px-4 text-[13px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[#17A06B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ boxShadow: '0 1px 4px rgba(29,184,122,0.25)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--ink-4)] mt-5">
          Need access?{' '}
          <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
            Register with an invite code
          </Link>
        </p>
      </div>
    </div>
  );
}
