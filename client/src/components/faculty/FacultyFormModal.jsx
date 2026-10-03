import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { facultyPassword } from '../../firebase/bootstrap';

const emptyForm = {
  name: '',
  idNumber: '',
  program: '',
  email: '',
};

export default function FacultyFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = 'add',
}) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        name: initialData.name || '',
        idNumber: initialData.idNumber || '',
        program: initialData.program || '',
        email: initialData.email || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save faculty');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Faculty' : 'Add Faculty'}
      wide
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <Field label="ID number" name="idNumber" value={form.idNumber} onChange={handleChange} required />
          <Field label="Program" name="program" value={form.program} onChange={handleChange} required />
          <div className="sm:col-span-2">
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
        </div>

        <LoginPreview
          idNumber={form.idNumber}
          existingPassword={mode === 'edit' && initialData?.idNumber === form.idNumber.trim() ? initialData?.password : ''}
          hasAccount={mode === 'edit' && !!initialData?.authUid && initialData?.idNumber === form.idNumber.trim()}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add faculty'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function LoginPreview({ idNumber, existingPassword, hasAccount }) {
  const id = (idNumber || '').trim();
  const password = existingPassword || (id ? facultyPassword(id) : '');
  return (
    <div className="rounded-btn border border-dashed border-border bg-[#f8fafc] p-3">
      <div className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-slate-500">
        <KeyRound className="h-3.5 w-3.5 text-primary" />
        Faculty portal login {hasAccount ? '(active)' : '(created on save)'}
      </div>
      <dl className="mt-2 grid gap-1 text-body sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-slate-500">Username</dt>
          <dd className="font-mono font-semibold text-slate-900">{id || '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-500">Password</dt>
          <dd className="font-mono font-semibold text-slate-900">{password || 'UCMN-<ID number>'}</dd>
        </div>
      </dl>
      <p className="mt-1.5 text-secondary text-slate-500">
        The password is generated as <span className="font-mono">UCMN-</span> followed by the ID number
        (e.g. UCMN-121515). Faculty can change it later in their Settings.
      </p>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
