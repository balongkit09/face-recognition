import { useMemo, useState } from 'react';
import { ScanFace } from 'lucide-react';
import Button from '../common/Button';
import FaceCapture, { allPosesCaptured, emptyCaptures } from '../students/FaceCapture';
import { useStudents } from '../../hooks/useStudents';
import { useWorkingScholars } from '../../hooks/useWorkingScholars';
import { enrollScholarFace, enrollStudentFace } from '../../firebase/faceEnrollRequests';

export default function Esp32FaceEnroll() {
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const { scholars, loading: scholarsLoading, error: scholarsError } = useWorkingScholars();
  const [kind, setKind] = useState('student');
  const [personId, setPersonId] = useState('');
  const [captures, setCaptures] = useState(emptyCaptures);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const list = useMemo(
    () => (kind === 'scholar' ? scholars : students),
    [kind, scholars, students],
  );
  const person = list.find((row) => row.id === personId);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!person) {
      setNotice({ type: 'error', text: kind === 'scholar' ? 'Select a working scholar.' : 'Select a student.' });
      return;
    }
    if (!allPosesCaptured(captures)) {
      setNotice({ type: 'error', text: 'Capture the front, right side, and left side from the ESP32-CAM.' });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      if (kind === 'scholar') await enrollScholarFace({ scholar: person, captures });
      else await enrollStudentFace({ student: person, captures });
      setNotice({ type: 'success', text: `${person.name}'s face is now enrolled from the ESP32-CAM.` });
      setCaptures(emptyCaptures());
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not enroll this face.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleEnroll} className="flex h-full flex-col gap-3 overflow-auto bg-white p-4">
      <div className="flex items-center gap-2">
        <ScanFace className="h-5 w-5 text-primary" />
        <div>
          <p className="text-body font-semibold text-slate-900">Enroll Face</p>
          <p className="text-label text-slate-500">Capture three poses from the ESP32-CAM.</p>
        </div>
      </div>

      {(studentsError || scholarsError) && (
        <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{studentsError || scholarsError}</p>
      )}
      {notice && (
        <p
          className={`rounded-btn px-3 py-2 text-body ${
            notice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="flex rounded-btn border border-border bg-[#f8fafc] p-0.5">
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
              setCaptures(emptyCaptures());
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-body font-medium ${
              kind === opt.key ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="esp32-enroll-person" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
          {kind === 'scholar' ? 'Working Scholar' : 'Student'}
        </label>
        <select
          id="esp32-enroll-person"
          required
          value={personId}
          onChange={(e) => {
            setPersonId(e.target.value);
            setCaptures(emptyCaptures());
          }}
          className="w-full rounded-btn border border-input-border bg-white px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">
            {studentsLoading || scholarsLoading
              ? 'Loading…'
              : kind === 'scholar'
                ? 'Select working scholar…'
                : 'Select student…'}
          </option>
          {list.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name} · ID {row.idNumber}
              {row.faceEnrolled ? ' · Enrolled' : ''}
              {row.designation ? ` · ${row.designation}` : ''}
            </option>
          ))}
        </select>
      </div>

      <FaceCapture source="esp32" captures={captures} onChange={setCaptures} disabled={submitting} />

      <div className="mt-auto flex justify-end">
        <Button type="submit" disabled={submitting || !personId || !allPosesCaptured(captures)}>
          {submitting ? 'Enrolling…' : 'Enroll face'}
        </Button>
      </div>
    </form>
  );
}
