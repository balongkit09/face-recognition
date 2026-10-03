import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  SCHEDULE_CAPACITY,
  SCHEDULE_DAYS,
  SCHEDULE_STATUSES,
  SCHEDULE_TYPES,
} from '../../hooks/useSchedules';

const emptyForm = {
  code: '',
  edpCode: '',
  subject: '',
  type: 'Lec',
  teacherId: '',
  teacher: '',
  startTime: '',
  endTime: '',
  days: 'M-W-F',
  room: '',
  section: '',
  term: '',
  enrolled: 0,
  status: 'Open',
};

const inputClass =
  'w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export default function ScheduleFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  faculty = [],
  mode = 'add',
}) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        code: initialData.code || '',
        edpCode: initialData.edpCode || '',
        subject: initialData.subject || '',
        type: initialData.type || 'Lec',
        teacherId: initialData.teacherId || '',
        teacher: initialData.teacher || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        days: initialData.days || 'M-W-F',
        room: initialData.room || '',
        section: initialData.section || '',
        term: initialData.term || '',
        enrolled: initialData.enrolled ?? 0,
        status: initialData.status || 'Open',
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

  const handleTeacherChange = (e) => {
    const teacherId = e.target.value;
    const member = faculty.find((f) => f.id === teacherId);
    setForm((prev) => ({
      ...prev,
      teacherId,
      teacher: member ? member.name : '',
    }));
  };

  const handleEnrolledChange = (e) => {
    const raw = e.target.value;
    const n = raw === '' ? '' : Math.max(0, Math.min(SCHEDULE_CAPACITY, Number(raw)));
    setForm((prev) => {
      const next = { ...prev, enrolled: n };
      // Reaching capacity marks the class Full; dropping below reopens it.
      if (n === SCHEDULE_CAPACITY && prev.status === 'Open') next.status = 'Full';
      if (n !== '' && n < SCHEDULE_CAPACITY && prev.status === 'Full') next.status = 'Open';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      setError('End time must be after start time.');
      return;
    }
    if (!form.teacher) {
      setError('Select a teacher. Register the faculty member first if they are not listed.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ ...form, enrolled: form.enrolled === '' ? 0 : form.enrolled });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Class Schedule' : 'Add Class Schedule'}
      wide
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Code" name="code" value={form.code} onChange={handleChange} placeholder="EE 415" required />
          <Field label="EDP code" name="edpCode" value={form.edpCode} onChange={handleChange} placeholder="18366" />
          <div className="sm:col-span-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" value={form.type} onChange={handleChange} className={inputClass}>
              {SCHEDULE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Field
              label="Subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Data Structures & Algorithms"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="teacherId">Teacher</Label>
            <select
              id="teacherId"
              name="teacherId"
              value={form.teacherId}
              onChange={handleTeacherChange}
              className={inputClass}
              required
            >
              <option value="">
                {faculty.length ? 'Select a faculty member' : 'No faculty registered yet'}
              </option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {f.program ? ` — ${f.program}` : ''}
                </option>
              ))}
            </select>
          </div>

          <Field label="Start time" name="startTime" type="time" value={form.startTime} onChange={handleChange} required />
          <Field label="End time" name="endTime" type="time" value={form.endTime} onChange={handleChange} required />

          <div>
            <Label htmlFor="days">Days</Label>
            <select id="days" name="days" value={form.days} onChange={handleChange} className={inputClass}>
              {SCHEDULE_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <Field label="Room" name="room" value={form.room} onChange={handleChange} placeholder="Lab 302" required />

          <Field label="Section" name="section" value={form.section} onChange={handleChange} placeholder="BSCS-3A" required />
          <Field label="Term" name="term" value={form.term} onChange={handleChange} placeholder="1st Sem, A.Y. 2024-2025" />

          <div>
            <Label htmlFor="enrolled">Students (max {SCHEDULE_CAPACITY})</Label>
            <input
              id="enrolled"
              name="enrolled"
              type="number"
              min={0}
              max={SCHEDULE_CAPACITY}
              value={form.enrolled}
              onChange={handleEnrolledChange}
              className={inputClass}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" value={form.status} onChange={handleChange} className={inputClass}>
              {SCHEDULE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
            {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500"
    >
      {children}
    </label>
  );
}

function Field({ label, name, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}
