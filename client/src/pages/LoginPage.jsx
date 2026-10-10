import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { homeForRole } from '../utils/routes';
import BrandLogo from '../components/common/BrandLogo';

export default function LoginPage() {
  const { user, role, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <p className="text-body text-slate-500">Loading…</p>
      </div>
    );
  }

  if (user && role) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const signedInRole = await login(email.trim(), password);
      navigate(homeForRole(signedInRole), { replace: true });
    } catch (err) {
      const code = String(err.code || '');
      if (code.includes('operation-not-allowed')) {
        setError(
          'Email/password sign-in is not enabled yet. In Firebase Console open Authentication → Get started → Sign-in method → Email/Password, then try again.',
        );
      } else if (code === 'app/no-role') {
        setError(err.message);
      } else if (
        code.includes('invalid-credential') ||
        code.includes('wrong-password') ||
        code.includes('user-not-found') ||
        code.includes('invalid-email')
      ) {
        setError('Incorrect username or password.');
      } else if (code.includes('too-many-requests')) {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Sign in failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md rounded-card border border-border-light bg-white p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <BrandLogo className="h-16 w-16" alt="UCME logo" />
          <h1 className="mt-3 text-h1 font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-body text-slate-500">UCME Monitoring Eye · Admin and Faculty portal</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500"
            >
              Username, ID number or email
            </label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-btn border border-input-border px-3 py-2 text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label
                htmlFor="password"
                className="block text-label font-semibold uppercase tracking-wide text-slate-500"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-label font-semibold text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-btn border border-input-border px-3 py-2 text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialUsername={email}
      />
    </div>
  );
}
