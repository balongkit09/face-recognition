import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { KeyRound, UserRound } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { auth, db } from '../firebase/config';
import { resolveCredentials } from '../firebase/bootstrap';
import { useAuth } from '../hooks/useAuth';
import { notify } from '../firebase/notifications';
import PreferencesSection from '../components/settings/PreferencesSection';
import { FACULTY_BASE } from '../utils/routes';

const inputCls =
  'w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export default function SettingsPage() {
  const { user, role, account, profile, updateDisplayName } = useAuth();
  const isFaculty = role === 'faculty';
  const basePath = isFaculty ? FACULTY_BASE : '';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  return (
    <>
      <PageHeader
        breadcrumbSection="SYSTEM"
        breadcrumbPage="SETTINGS"
        title="Settings"
        description="Manage your account, password and preferences."
        actions={
          <Link to={`${basePath}/profile`}>
            <Button variant="outline">
              <UserRound className="h-4 w-4" />
              View profile
            </Button>
          </Link>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ProfileSection
          isFaculty={isFaculty}
          user={user}
          account={account}
          profile={profile}
          updateDisplayName={updateDisplayName}
        />
        <PasswordSection isFaculty={isFaculty} profile={profile} />
        <PreferencesSection />

        <section className="rounded-card border border-border-light bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">System</h2>
          <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
            <Row label="Firebase project" value="face-recognition" />
            <Row label="Project ID" value={projectId} />
            <Row label="Signed in as" value={user?.email} />
            <Row label="Role" value={isFaculty ? 'Faculty' : 'Administrator'} />
          </dl>
          <p className="mt-4 text-secondary text-slate-500">
            {isFaculty
              ? 'Faculty sign in with their ID number and the generated password (UCMN-<ID number>). Students you enroll are saved to the shared student collection.'
              : 'Faculty, students, working scholars and schedules are stored in Cloud Firestore collections faculty, student, workingScholar and schedule. Faculty login accounts are created automatically when a faculty record is added (password UCMN-<ID number>).'}
          </p>
        </section>
      </div>
    </>
  );
}

function ProfileSection({ isFaculty, user, account, profile, updateDisplayName }) {
  const currentName =
    (isFaculty ? profile?.name || account?.name : account?.displayName) ||
    user?.displayName ||
    (isFaculty ? '' : 'Administrator');
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => setName(currentName), [currentName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateDisplayName(name);
      setMessage({ type: 'success', text: 'Display name updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not update name.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-card border border-border-light bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <UserRound className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-slate-900">Profile</h2>
      </div>
      <Feedback message={message} />
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div>
          <Label htmlFor="settings-name">Display name</Label>
          <input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <Label>Email</Label>
          <input value={(isFaculty ? profile?.email || account?.email : user?.email) || ''} readOnly className={`${inputCls} bg-[#f8fafc] text-slate-500`} />
        </div>
        {isFaculty && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>ID number</Label>
              <input value={profile?.idNumber || account?.idNumber || ''} readOnly className={`${inputCls} bg-[#f8fafc] text-slate-500`} />
            </div>
            <div>
              <Label>Program</Label>
              <input value={profile?.program || ''} readOnly className={`${inputCls} bg-[#f8fafc] text-slate-500`} />
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !name.trim() || name.trim() === currentName}>
            {saving ? 'Saving…' : 'Save name'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordSection({ isFaculty, profile }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (next.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (next !== confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    const fbUser = auth.currentUser;
    if (!fbUser?.email) return;
    setSaving(true);
    try {
      // Same mapping as the login form (e.g. the seeded admin's "admin" -> real Firebase password).
      const { password: currentFirebasePassword } = resolveCredentials(fbUser.email, current);
      await reauthenticateWithCredential(
        fbUser,
        EmailAuthProvider.credential(fbUser.email, currentFirebasePassword),
      );
      await updatePassword(fbUser, next);
      if (isFaculty && profile?.id) {
        // Keep the faculty record in sync so the admin sees the current login password.
        await updateDoc(doc(db, 'faculty', profile.id), { password: next, updatedAt: serverTimestamp() }).catch(() => {});
      }
      notify({
        type: 'account',
        entity: 'account',
        title: `${fbUser.displayName || profile?.name || 'A user'} changed their password`,
        message: isFaculty ? `Faculty ID ${profile?.idNumber || ''}`.trim() : 'Administrator account',
        audience: 'admin',
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      setMessage({ type: 'success', text: 'Password changed. Use the new password next time you sign in.' });
    } catch (err) {
      const code = err?.code || '';
      const text =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : code === 'auth/weak-password'
            ? 'New password is too weak.'
            : code === 'auth/too-many-requests'
              ? 'Too many attempts. Try again later.'
              : err.message || 'Could not change password.';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-card border border-border-light bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-slate-900">Change password</h2>
      </div>
      <p className="mt-1 text-secondary text-slate-500">
        {isFaculty
          ? 'Your generated password is UCMN-<ID number>. Change it to something only you know.'
          : 'Change the password used to sign in to the admin dashboard.'}
      </p>
      <Feedback message={message} />
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div>
          <Label htmlFor="pw-current">Current password</Label>
          <input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required className={inputCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pw-next">New password</Label>
            <input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} className={inputCls} />
          </div>
          <div>
            <Label htmlFor="pw-confirm">Confirm new password</Label>
            <input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !current || !next || !confirm}>
            {saving ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </label>
  );
}

function Feedback({ message }) {
  if (!message) return null;
  return (
    <p
      className={`mt-3 rounded-btn px-3 py-2 text-body ${
        message.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
      }`}
    >
      {message.text}
    </p>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}
