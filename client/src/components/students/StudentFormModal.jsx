import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  program: '',
  email: '',
  idNumber: '',
  edpCode: '',
};

export default function StudentFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = 'add',
  /** Optional list of { value, label } EDP codes; when given, EDP becomes a select. */
  edpOptions,
  defaultEdpCode = '',
}) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        firstName: initialData.firstName || '',
        middleName: initialData.middleName || '',
        lastName: initialData.lastName || '',
        program: initialData.program || '',
        email: initialData.email || '',
        idNumber: initialData.idNumber || '',
        edpCode: initialData.edpCode || '',
      });
    } else {
      setForm({ ...emptyForm, edpCode: defaultEdpCode || '' });
    }
    setError('');
  }, [open, initialData, defaultEdpCode]);

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
      setError(err.message || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Student' : 'Add Student'}
      wide
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
          <Field label="Middle name" name="middleName" value={form.middleName} onChange={handleChange} />
          <Field label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ID number" name="idNumber" value={form.idNumber} onChange={handleChange} required />
          {edpOptions && edpOptions.length > 0 ? (
            <div>
              <label htmlFor="edpCode" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
                EDP code (your class)
              </label>
              <select
                id="edpCode"
                name="edpCode"
                value={form.edpCode}
                onChange={handleChange}
                required
                className="w-full rounded-btn border border-input-border bg-white px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select class…</option>
                {edpOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Field label="EDP code" name="edpCode" value={form.edpCode} onChange={handleChange} required />
          )}
          <Field label="Program" name="program" value={form.program} onChange={handleChange} required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add student'}
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
