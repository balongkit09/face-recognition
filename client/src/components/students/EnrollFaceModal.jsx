import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FaceCapture, { allPosesCaptured, emptyCaptures } from './FaceCapture';

export default function EnrollFaceModal({
  open,
  onClose,
  onSubmit,
  students = [],
  scholars = [],
  people,
  initialPerson = null,
  initialStudent = null,
  mode = 'request',
  defaultKind = 'student',
}) {
  const isEnroll = mode === 'enroll';
  const startPerson = initialPerson || initialStudent;
  const [kind, setKind] = useState(startPerson?.kind || defaultKind);
  const [personId, setPersonId] = useState('');
  const [note, setNote] = useState('');
  const [captures, setCaptures] = useState(emptyCaptures);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const list = useMemo(() => {
    if (Array.isArray(people) && people.length) {
      return people.filter((p) => (p.kind || 'student') === kind);
    }
    return kind === 'scholar' ? scholars : students;
  }, [people, scholars, students, kind]);

  const studentCount = Array.isArray(people)
    ? people.filter((p) => (p.kind || 'student') === 'student').length
    : students.length;
  const scholarCount = Array.isArray(people)
    ? people.filter((p) => p.kind === 'scholar').length
    : scholars.length;
  const showKindTabs = isEnroll && !startPerson && studentCount > 0 && scholarCount > 0;

  useEffect(() => {
    if (!open) return;
    setKind(startPerson?.kind || defaultKind);
    setPersonId(startPerson?.id || '');
    setNote('');
    setCaptures(emptyCaptures());
    setError('');
    setSubmitting(false);
  }, [open, startPerson, defaultKind]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const person = list.find((p) => p.id === personId) || startPerson;
    if (!person) {
      setError(kind === 'scholar' ? 'Select a working scholar to enroll their face.' : 'Select a student to enroll their face.');
      return;
    }
    if (isEnroll && !allPosesCaptured(captures)) {
      setError('Capture the front, right side, and left side before enrolling.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        person,
        student: person,
        scholar: person,
        kind: person.kind || kind,
        note,
        captures,
      });
      onClose();
    } catch (err) {
      setError(err.message || (isEnroll ? 'Could not enroll this face.' : 'Could not send the face enroll request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Enroll Face" size={isEnroll ? 'lg' : undefined}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}
        <p className="text-body text-slate-500">
          {isEnroll
            ? 'Use the camera to capture the face three times: front, right side, and left side.'
            : 'Send a request to the administrator to enroll this student’s face for recognition.'}
        </p>

        {showKindTabs && (
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'student', label: 'Student' },
              { key: 'scholar', label: 'Working Scholar' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setKind(opt.key);
                  setPersonId('');
                }}
                className={`rounded-full px-3 py-1.5 text-body font-medium ${
                  kind === opt.key
                    ? 'bg-primary text-white shadow-card'
                    : 'border border-border bg-white text-slate-600 hover:bg-[#f8fafc]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="face-person" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
            {kind === 'scholar' ? 'Working Scholar' : 'Student'}
          </label>
          {startPerson ? (
            <p className="rounded-btn border border-border bg-[#f8fafc] px-3 py-2 text-body font-medium text-slate-900">
              {startPerson.name} · ID {startPerson.idNumber}
              {startPerson.designation ? ` · ${startPerson.designation}` : ''}
            </p>
          ) : (
            <select
              id="face-person"
              required
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full rounded-btn border border-input-border bg-white px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{kind === 'scholar' ? 'Select working scholar…' : 'Select student…'}</option>
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · ID {p.idNumber}
                  {p.designation ? ` · ${p.designation}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {isEnroll ? (
          <FaceCapture captures={captures} onChange={setCaptures} disabled={submitting} />
        ) : (
          <div>
            <label htmlFor="face-note" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
              Note (optional)
            </label>
            <textarea
              id="face-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this student needs face enrollment…"
              className="w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || (isEnroll && !allPosesCaptured(captures))}>
            {submitting ? (isEnroll ? 'Enrolling…' : 'Sending…') : isEnroll ? 'Enroll face' : 'Send request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
