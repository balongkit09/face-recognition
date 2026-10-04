import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { requestPasswordReset } from '../../firebase/passwordResets';

const inputCls =
  'w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

const empty = { username: '', email: '', newPassword: '', confirmPassword: '' };

export default function ForgotPasswordModal({ open, onClose, initialUsername = '' }) {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, username: initialUsername });
    setError('');
    setDone(false);
  }, [open, initialUsername]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset({
        username: form.username,
        email: form.email,
        newPassword: form.newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not submit the request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Forgot password">
      {done ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-bg text-success-text">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="text-body text-slate-600">
              <p className="font-semibold text-slate-900">Request sent</p>
              <p className="mt-1">
                An administrator will review your request. Once approved, sign in with ID number{' '}
                <span className="font-mono font-semibold">{form.username.trim()}</span> and the new password you
                entered.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Back to sign in
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-btn bg-[#f8fafc] p-3 text-body text-slate-600">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Enter your ID number, the e-mail registered on your faculty record, and the new password you want to
              use. The administrator approves the change and your password is updated.
            </p>
          </div>

          {error && <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}

          <div>
            <Label htmlFor="fp-username">ID number</Label>
            <input
              id="fp-username"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
              className={inputCls}
            />
          </div>
          <div>
            <Label htmlFor="fp-email">Registered e-mail</Label>
            <input
              id="fp-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fp-new">New password</Label>
              <input
                id="fp-new"
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
            <div>
              <Label htmlFor="fp-confirm">Confirm new password</Label>
              <input
                id="fp-confirm"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                className={`${inputCls} ${mismatch ? 'border-danger focus:border-danger focus:ring-danger' : ''}`}
              />
              {mismatch && <p className="mt-1 text-secondary text-danger">Passwords do not match.</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || mismatch}>
              {submitting ? 'Sending…' : 'Send request'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </label>
  );
}
