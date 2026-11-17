import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import { PriceAlerterLogo } from '../components/brand/PriceAlerterLogo';

function resolvePostAuthPath(
  searchParams: URLSearchParams,
  locationState: unknown,
  role: 'user' | 'admin'
): string {
  const redirectParam = searchParams.get('redirect');
  if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    return redirectParam;
  }
  const from = (locationState as { from?: string } | null)?.from;
  if (from && from.startsWith('/') && !from.startsWith('//')) {
    return from;
  }
  return role === 'admin' ? '/admin' : '/profile';
}

function AlreadySignedInCard() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEOHead title="Account Active – PriceAlerter" description="Manage your PriceAlerter session." noIndex />
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-7 space-y-5 text-center">
        <div className="flex flex-col items-center space-y-2">
          <PriceAlerterLogo size="md" />
          <h1 className="font-display text-xl font-bold text-[#14263F] dark:text-white pt-1">
            Signed in as {user.name}
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <Link
            to="/profile"
            className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] py-2.5 px-3 font-semibold text-white hover:opacity-90"
          >
            Open Dashboard
          </Link>
          <Link
            to="/watchlist"
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 py-2.5 px-3 font-semibold text-[#152338] dark:text-slate-200 hover:border-[#2563EB]"
          >
            My Watchlist
          </Link>
          <Link
            to="/alerts"
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 py-2.5 px-3 font-semibold text-[#152338] dark:text-slate-200 hover:border-[#2563EB]"
          >
            Price Alerts
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-red-200 dark:border-red-900 py-2.5 px-3 font-semibold text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  if (user) {
    return <AlreadySignedInCard />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setBusy(true);
    try {
      const signedInUser = await login(cleanEmail, password);
      navigate(resolvePostAuthPath(searchParams, location.state, signedInUser.role), {
        replace: true,
      });
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
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.forgotPassword(cleanEmail);
      setForgotMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process reset request.');
    } finally {
      setBusy(false);
    }
  };

  const redirectSuffix = searchParams.get('redirect')
    ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
    : '';

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEOHead
        title="Sign In to PriceAlerter"
        description="Sign in to access your IPO watchlist, NSE/BSE price alerts, and personalized market dashboard."
        noIndex
      />
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-7 space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <PriceAlerterLogo size="md" />
          <h1 className="font-display text-xl font-bold text-[#14263F] dark:text-white pt-1">
            {forgotMode ? 'Reset Your Password' : 'Sign In to PriceAlerter'}
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            {forgotMode
              ? 'Enter your account email. If it exists, we’ll send a secure reset link.'
              : 'Access your saved IPOs, equity watchlist, and real-time alert rules.'}
          </p>
        </div>

        {!forgotMode && (
          <div className="grid grid-cols-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 p-1 text-xs font-semibold">
            <span className="rounded-md bg-white dark:bg-[#1E3554] py-1.5 text-center text-[#14263F] dark:text-white shadow-xs">
              Sign In
            </span>
            <Link
              to={`/register${redirectSuffix}`}
              className="rounded-md py-1.5 text-center text-[#64748B] dark:text-slate-300 hover:text-[#14263F] dark:hover:text-white"
            >
              Sign Up
            </Link>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-red-400"
          >
            {error}
          </div>
        )}
        {forgotMsg && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs text-[#059669] dark:text-emerald-400">
            {forgotMsg}
          </div>
        )}

        {forgotMode ? (
          <form onSubmit={handleForgot} noValidate className="space-y-4 text-xs">
            <label className="block">
              <span className="font-medium text-[#152338] dark:text-slate-200">Email Address</span>
              <input
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm text-[#152338] dark:text-slate-100"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#14263F] dark:bg-[#2563EB] py-2.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Sending...' : 'Send Reset Request'}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setForgotMsg(null);
                setForgotMode(false);
              }}
              className="w-full text-center text-xs text-[#2563EB] hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            <label className="block">
              <span className="font-medium text-[#152338] dark:text-slate-200">Email Address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm text-[#152338] dark:text-slate-100"
              />
            </label>
            <label className="block">
              <span className="font-medium text-[#152338] dark:text-slate-200">Password</span>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 pl-3 pr-10 py-2.5 text-sm text-[#152338] dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setForgotMode(true);
                }}
                className="text-xs text-[#2563EB] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
              <Link to={`/register${redirectSuffix}`} className="text-xs text-[#2563EB] font-medium hover:underline">
                New user? Create account
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
        )}
      </div>
    </main>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return <AlreadySignedInCard />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 10 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Use 10–128 characters and include at least one letter and one number.');
      return;
    }

    setBusy(true);
    try {
      const created = await register(cleanName, cleanEmail, password);
      navigate(resolvePostAuthPath(searchParams, location.state, created.role), {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register account.');
    } finally {
      setBusy(false);
    }
  };

  const redirectSuffix = searchParams.get('redirect')
    ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
    : '';

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEOHead
        title="Create Account – PriceAlerter"
        description="Register a PriceAlerter investor account to track IPO watchlists and create stock price alerts."
        noIndex
      />
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-7 space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <PriceAlerterLogo size="md" />
          <h1 className="font-display text-xl font-bold text-[#14263F] dark:text-white pt-1">
            Create Your PriceAlerter Account
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Save IPOs, build stock watchlists, and automate target price notifications.
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 p-1 text-xs font-semibold">
          <Link
            to={`/login${redirectSuffix}`}
            className="rounded-md py-1.5 text-center text-[#64748B] dark:text-slate-300 hover:text-[#14263F] dark:hover:text-white"
          >
            Sign In
          </Link>
          <span className="rounded-md bg-white dark:bg-[#059669] py-1.5 text-center text-[#14263F] dark:text-white shadow-xs">
            Sign Up
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
          <label className="block">
            <span className="font-medium text-[#152338] dark:text-slate-200">Full Name</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Mehta"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm text-[#152338] dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="font-medium text-[#152338] dark:text-slate-200">Email Address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm text-[#152338] dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="font-medium text-[#152338] dark:text-slate-200">
              Password (10+ characters, letters and numbers)
            </span>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters, include letters and numbers"
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 pl-3 pr-10 py-2.5 text-sm text-[#152338] dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#152338] dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#059669] py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Creating Account...' : 'Create Free Account'}
          </button>
        </form>

        <div className="text-center text-xs text-[#64748B]">
          Already registered?{' '}
          <Link to={`/login${redirectSuffix}`} className="text-[#2563EB] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!token) { setError('This reset link is missing its token. Request a new password reset email.'); return; }
    if (password !== confirmPassword) { setError('The new password and confirmation do not match.'); return; }
    if (password.length < 10 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Use 10–128 characters and include at least one letter and one number.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.resetPassword(token, password);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password.');
    } finally { setBusy(false); }
  };

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEOHead title="Reset Password – PriceAlerter" description="Choose a new password for your PriceAlerter account." noIndex />
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-7 space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <PriceAlerterLogo size="md" />
          <h1 className="font-display text-xl font-bold text-[#14263F] dark:text-white">Create a New Password</h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400">Choose a strong password for your account.</p>
        </div>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">{error}</div>}
        {message ? (
          <div className="space-y-4">
            <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">{message}</div>
            <button type="button" onClick={() => navigate('/login', { replace: true })} className="w-full rounded-lg bg-[#14263F] py-2.5 text-xs font-semibold text-white">Continue to Sign In</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <label className="block">
              <span className="font-medium text-[#152338] dark:text-slate-200">New Password</span>
              <input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 10 characters" className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="font-medium text-[#152338] dark:text-slate-200">Confirm New Password</span>
              <input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2.5 text-sm" />
            </label>
            <button type="submit" disabled={busy || !token} className="w-full rounded-lg bg-[#14263F] dark:bg-[#2563EB] py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Updating Password...' : 'Reset Password'}</button>
            <Link to="/login" className="block text-center text-xs text-[#2563EB] hover:underline">Back to Sign In</Link>
          </form>
        )}
      </div>
    </main>
  );
}
