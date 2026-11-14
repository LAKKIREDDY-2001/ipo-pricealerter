import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import { PriceAlerterLogo } from '../components/brand/PriceAlerterLogo';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotMsg(null);
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process reset request.');
    }
  };

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEOHead
        title="Sign In to PriceAlerter"
        description="Sign in to access your IPO watchlist, NSE/BSE price alerts, and personalized market dashboard."
        noIndex
      />
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-7 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <PriceAlerterLogo size="md" />
          <h1 className="font-display text-xl font-bold text-[#14263F] dark:text-white pt-1">
            {forgotMode ? 'Reset Your Password' : 'Sign In to PriceAlerter'}
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            {forgotMode
              ? 'Enter your registered email address to request verification.'
              : 'Access your saved IPOs, equity watchlist, and real-time alert rules.'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-red-400">
            {error}
          </div>
        )}
        {forgotMsg && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs text-[#059669] dark:text-emerald-400">
            {forgotMsg}
          </div>
        )}

        {forgotMode ? (
          <form onSubmit={handleForgot} className="space-y-4 text-xs">
            <label className="block">
              <span className="font-medium text-[#152338] dark:text-slate-200">Email Address</span>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#14263F] dark:bg-[#2563EB] py-2.5 text-xs font-semibold text-white cursor-pointer"
            >
              Send Reset Request
            </button>
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="w-full text-center text-xs text-[#2563EB] hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <label className="block">
                <span className="font-medium text-[#152338] dark:text-slate-200">Email Address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@pricealerter.in"
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="font-medium text-[#152338] dark:text-slate-200">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm"
                />
              </label>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs text-[#2563EB] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
                <Link to="/register" className="text-xs text-[#2563EB] hover:underline">
                  Create account
                </Link>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-[#14263F] dark:bg-[#2563EB] py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(name, email, password);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEOHead
        title="Create Account – PriceAlerter"
        description="Register a PriceAlerter investor account to track IPO watchlists and create stock price alerts."
        noIndex
      />
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-7 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <PriceAlerterLogo size="md" />
          <h1 className="font-display text-xl font-bold text-[#14263F] dark:text-white pt-1">
            Create Your PriceAlerter Account
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Save IPOs, build stock watchlists, and automate target price notifications.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <label className="block">
            <span className="font-medium text-[#152338] dark:text-slate-200">Full Name</span>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Mehta"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="font-medium text-[#152338] dark:text-slate-200">Email Address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="font-medium text-[#152338] dark:text-slate-200">
              Password (minimum 8 characters)
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#059669] py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs text-[#64748B]">
          Already registered?{' '}
          <Link to="/login" className="text-[#2563EB] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
