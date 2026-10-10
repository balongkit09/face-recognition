import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { DESIGNATIONS } from '../../hooks/useWorkingScholars';

const emptyForm = {
  firstName: '',
  lastName: '',
  idNumber: '',
  email: '',
  designation: '',
};

export default function WorkingScholarFormModal({
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
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        idNumber: initialData.idNumber || '',
        email: initialData.email || '',
        designation: initialData.designation || '',
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
      setError(err.message || 'Failed to save working scholar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Working Scholar' : 'Add Working Scholar'}
      wide
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
          <Field label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
          <Field label="ID number" name="idNumber" value={form.idNumber} onChange={handleChange} required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <div className="sm:col-span-2">
            <label
              htmlFor="designation"
              className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500"
            >
              Designation
            </label>
            <select
              id="designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              required
              className="w-full rounded-btn border border-input-border bg-white px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select designation…</option>
              {DESIGNATIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add working scholar'}
          </Button>
        </div>
      </form>
    </Modal>
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
