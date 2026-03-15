'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

const REGISTRATION_MODE = process.env.NEXT_PUBLIC_REGISTRATION_MODE ?? 'invite';

// ── Validation ────────────────────────────────────────────────────────────────

function validateEmail(v: string): string {
  if (!v) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
  return '';
}

function validatePassword(v: string): string[] {
  const missing: string[] = [];
  if (v.length < 8)               missing.push('at least 8 characters');
  if (!/[A-Z]/.test(v))           missing.push('one uppercase letter');
  if (!/[a-z]/.test(v))           missing.push('one lowercase letter');
  if (!/\d/.test(v))              missing.push('one number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(v)) missing.push('one special character');
  return missing;
}

// ── Password strength indicator ───────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const missing = validatePassword(password);
  const score   = 5 - missing.length;   // 0–5

  const label  = score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : score === 4 ? 'Good' : 'Strong';
  const color  = score <= 1 ? 'var(--loss)' : score <= 3 ? 'var(--warn)' : 'var(--gain)';
  const widths = ['20%', '20%', '40%', '60%', '80%', '100%'];

  return (
    <div className="mt-1 space-y-1.5">
      <div className="h-1 w-full rounded-full bg-[var(--border)]">
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{ width: widths[score], background: color }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
        {missing.length > 0 && (
          <span className="text-[10px] text-[var(--ink-4)]">
            Needs: {missing.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register } = useAuth();
  const [email,      setEmail]      = useState('');
  const [username,   setUsername]   = useState('');
  const [password,   setPassword]   = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [touched,    setTouched]    = useState<Record<string, boolean>>({});

  const needsInvite = REGISTRATION_MODE === 'invite';

  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  const emailError    = touched.email    ? validateEmail(email)    : '';
  const passwordMsgs  = touched.password ? validatePassword(password) : [];
  const passwordError = passwordMsgs.length > 0 ? `Needs: ${passwordMsgs.join(', ')}` : '';

  function validate(): boolean {
    const allTouched = { email: true, password: true };
    setTouched(t => ({ ...t, ...allTouched }));
    return !validateEmail(email) && validatePassword(password).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email, username, password, needsInvite ? (inviteCode || undefined) : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (field: string) => [
    'h-9 px-3 text-[13px] border rounded-lg bg-[var(--canvas)] text-[var(--ink)]',
    'placeholder:text-[var(--ink-4)] outline-none transition',
    errors[field] || (field === 'email' && emailError) || (field === 'password' && passwordError)
      ? 'border-[var(--loss)] focus:border-[var(--loss)] focus:ring-2 focus:ring-red-100'
      : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10',
  ].join(' ');

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--canvas)] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 rounded-[10px] bg-[var(--accent)] flex items-center justify-center"
               style={{ boxShadow: '0 2px 12px rgba(26,86,219,0.35)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6.5L8 9L12 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-[15px] text-[var(--ink)] tracking-tight">
            Portfolio <span className="font-normal text-[var(--ink-4)]">Analyzer</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h1 className="text-[16px] font-bold text-[var(--ink)] mb-1">Create account</h1>
          <p className="text-[12px] text-[var(--ink-4)] mb-6">
            {needsInvite
              ? 'You need an invite code from an admin to register.'
              : 'Fill in your details to create an account.'}
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {needsInvite && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wide">
                  Invite code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  placeholder="XXXXXXXX"
                  className="h-9 px-3 text-[13px] font-mono border border-[var(--border)] rounded-lg bg-[var(--canvas)] text-[var(--ink)] placeholder:text-[var(--ink-4)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition tracking-widest"
                />
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => touch('email')}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass('email')}
              />
              {emailError && (
                <span className="text-[11px] text-[var(--loss)]">{emailError}</span>
              )}
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="johndoe"
                className="h-9 px-3 text-[13px] border border-[var(--border)] rounded-lg bg-[var(--canvas)] text-[var(--ink)] placeholder:text-[var(--ink-4)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClass('password')}
              />
              <PasswordStrength password={password} />
              {touched.password && passwordError && (
                <span className="text-[11px] text-[var(--loss)]">{passwordError}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-9 px-4 text-[13px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[#1447C0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ boxShadow: '0 1px 4px rgba(26,86,219,0.2)' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--ink-4)] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
