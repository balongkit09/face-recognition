import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Eye, EyeOff, Settings as SettingsIcon } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { FACULTY_BASE } from '../utils/routes';

export default function ProfilePage() {
  const { user, role, account, profile, updateDisplayName } = useAuth();
  const isFaculty = role === 'faculty';
  const basePath = isFaculty ? FACULTY_BASE : '';

  const currentName =
    (isFaculty ? profile?.name || account?.name : account?.displayName) ||
    user?.displayName ||
    (isFaculty ? '' : 'Administrator');

  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => setName(currentName), [currentName]);

  const initials = (currentName || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateDisplayName(name);
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Copied to clipboard.' });
    } catch {
      setMessage({ type: 'error', text: 'Clipboard not available.' });
    }
  };

  const username = isFaculty ? profile?.username || profile?.idNumber || account?.idNumber || '' : 'admin';
  const loginPassword = isFaculty ? profile?.password || '' : '';

  return (
    <>
      <PageHeader
        breadcrumbSection="ACCOUNT"
        breadcrumbPage="MY PROFILE"
        title="My Profile"
        description="Your account details and how you sign in to the system."
        actions={
          <Link to={`${basePath}/settings`}>
            <Button variant="outline">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        }
      />

      {message && (
        <p
          className={`mt-4 rounded-btn px-3 py-2 text-body ${
            message.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="rounded-card border border-border-light bg-white p-5 shadow-card">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
              {initials}
            </span>
            <h2 className="mt-3 text-base font-semibold text-slate-900">{currentName || '—'}</h2>
            <span className="mt-1 rounded-full bg-info-bg px-2.5 py-0.5 text-label font-semibold uppercase tracking-wide text-info-text">
              {isFaculty ? 'Faculty' : 'Administrator'}
            </span>
            {isFaculty && profile?.program && (
              <p className="mt-2 text-body text-slate-500">{profile.program}</p>
            )}
          </div>

          <dl className="mt-5 grid gap-3 text-body">
            <Row label="Email" value={isFaculty ? profile?.email || account?.email : user?.email} />
            {isFaculty && <Row label="ID number" value={profile?.idNumber || account?.idNumber} />}
            <Row label="Username" value={username} mono />
            {isFaculty && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Password</dt>
                <dd className="flex items-center gap-1 font-mono font-medium text-slate-900">
                  {loginPassword ? (showPassword ? loginPassword : '•'.repeat(loginPassword.length)) : '—'}
                  {loginPassword && (
                    <>
                      <IconButton
                        title={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </IconButton>
                      <IconButton title="Copy password" onClick={() => copy(loginPassword)}>
                        <Copy className="h-3.5 w-3.5" />
                      </IconButton>
                    </>
                  )}
                </dd>
              </div>
            )}
          </dl>
          {isFaculty && (
            <p className="mt-4 text-secondary text-slate-500">
              Your password was generated from your ID number (UCMN-&lt;ID&gt;). You can change it in Settings.
            </p>
          )}
        </section>

        <section className="rounded-card border border-border-light bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Edit profile</h2>
          <p className="mt-1 text-secondary text-slate-500">
            This name is shown in the top bar and attached to the notifications you trigger.
          </p>
          <form onSubmit={handleSave} className="mt-4 flex max-w-md flex-col gap-4">
            <div>
              <label htmlFor="displayName" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
                Display name
              </label>
              <input
                id="displayName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving || !name.trim() || name.trim() === currentName}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`truncate font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded p-1 text-slate-500 hover:bg-[#f1f5f9] hover:text-slate-800"
    >
      {children}
    </button>
  );
}
