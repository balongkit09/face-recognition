import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Briefcase, ScanFace } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import BoxedPlusButton, { BoxedPlusIcon } from '../components/common/BoxedPlusButton';
import StatusBadge from '../components/common/StatusBadge';
import InitialAvatar from '../components/dashboard/InitialAvatar';
import Modal from '../components/common/Modal';
import EnrollFaceModal from '../components/students/EnrollFaceModal';
import { FACE_POSES } from '../components/students/FaceCapture';
import FaceEnrollRequests from '../components/requests/FaceEnrollRequests';
import { useAuth } from '../hooks/useAuth';
import { useStudents } from '../hooks/useStudents';
import { useWorkingScholars } from '../hooks/useWorkingScholars';
import { useSchedules } from '../hooks/useSchedules';
import { useMyClasses } from '../hooks/useMyClasses';
import { useFaceEnrollRequests } from '../hooks/useFaceEnrollRequests';
import {
  approveFaceEnroll,
  enrollScholarFace,
  enrollStudentFace,
  removeEnrolledFace,
  requestFaceEnroll,
} from '../firebase/faceEnrollRequests';
import { useConfirm } from '../components/common/ConfirmDialog';

function FaceThumb({ src, alt, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-md border border-border-light focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label={`View ${alt}`}
    >
      {src ? (
        <img src={src} alt={alt} className="h-16 w-16 object-cover" />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center bg-[#f8fafc] text-label text-slate-400">—</span>
      )}
    </button>
  );
}

function FacePhotosViewer({ person, onClose }) {
  if (!person) return null;
  const captures = person.faceCaptures || {};
  return (
    <Modal open onClose={onClose} title={`${person.name} — enrolled face`} size="lg">
      <p className="mb-4 text-secondary text-slate-500">
        ID {person.idNumber || '—'}
        {person.program ? ` · ${person.program}` : ''}
        {person.designation ? ` · ${person.designation}` : ''}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {FACE_POSES.map((pose) => (
          <figure key={pose.key} className="overflow-hidden rounded-card border border-border-light bg-[#f8fafc]">
            {captures[pose.key] ? (
              <img
                src={captures[pose.key]}
                alt={`${person.name} ${pose.label}`}
                className="aspect-[3/4] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center text-body text-slate-400">
                No {pose.label.toLowerCase()} photo
              </div>
            )}
            <figcaption className="px-3 py-2 text-center text-body font-medium text-slate-700">{pose.label}</figcaption>
          </figure>
        ))}
      </div>
    </Modal>
  );
}

function DeleteButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body font-medium text-danger hover:underline"
      aria-label={`Delete ${label}`}
    >
      Delete
    </button>
  );
}

export default function EnrolledFacePage() {
  const { search = '' } = useOutletContext() || {};
  const { role, profile, account } = useAuth();
  const isAdmin = role === 'admin';
  const { students, loading, error } = useStudents();
  const { scholars, loading: scholarsLoading, error: scholarsError } = useWorkingScholars();
  const { schedules } = useSchedules();
  const { myStudents, facultyId } = useMyClasses(schedules, students);
  const { requests: faceRequests } = useFaceEnrollRequests({ pendingOnly: true });

  const [faceOpen, setFaceOpen] = useState(false);
  const [facePerson, setFacePerson] = useState(null);
  const [defaultKind, setDefaultKind] = useState('student');
  const [notice, setNotice] = useState(null);
  const [viewingPerson, setViewingPerson] = useState(null);
  const { confirm, dialog } = useConfirm();

  const pendingFaceIds = useMemo(
    () => new Set(faceRequests.map((r) => r.studentId).filter(Boolean)),
    [faceRequests],
  );

  const query = search.trim().toLowerCase();
  const studentPool = isAdmin ? students : myStudents.length ? myStudents : students;

  const enrolledStudents = useMemo(() => {
    const list = studentPool.filter((s) => s.faceEnrolled).map((s) => ({ ...s, kind: 'student' }));
    if (!query) return list;
    return list.filter((s) =>
      [s.name, s.idNumber, s.email, s.program, s.edpCode].join(' ').toLowerCase().includes(query),
    );
  }, [studentPool, query]);

  const enrolledScholars = useMemo(() => {
    const list = scholars.filter((s) => s.faceEnrolled).map((s) => ({ ...s, kind: 'scholar' }));
    if (!query) return list;
    return list.filter((s) =>
      [s.name, s.idNumber, s.email, s.designation].join(' ').toLowerCase().includes(query),
    );
  }, [scholars, query]);

  const eligibleStudents = useMemo(
    () =>
      studentPool
        .filter((s) => !s.faceEnrolled && (isAdmin || !pendingFaceIds.has(s.id)))
        .map((s) => ({ ...s, kind: 'student' })),
    [studentPool, isAdmin, pendingFaceIds],
  );

  const eligibleScholars = useMemo(
    () => scholars.filter((s) => !s.faceEnrolled).map((s) => ({ ...s, kind: 'scholar' })),
    [scholars],
  );

  const openAdd = (person = null, kind = 'student') => {
    if (person && !isAdmin && pendingFaceIds.has(person.id)) {
      setNotice({ type: 'error', text: `A face enroll request for ${person.name} is already pending.` });
      return;
    }
    if (person?.faceEnrolled) {
      setNotice({ type: 'error', text: `${person.name} is already enrolled for face recognition.` });
      return;
    }
    setDefaultKind(person?.kind || kind);
    setFacePerson(person);
    setFaceOpen(true);
  };

  const removeFace = (person) =>
    confirm({
      title: 'Delete enrolled face',
      message: (
        <>
          Remove the enrolled face for <strong>{person.name}</strong>? Front, right, and left photos will be deleted.
        </>
      ),
      onConfirm: async () => {
        await removeEnrolledFace({ person, kind: person.kind });
        setNotice({ type: 'success', text: `${person.name}'s enrolled face was deleted.` });
      },
    });

  return (
    <>
      <PageHeader
        breadcrumbSection={isAdmin ? 'ACADEMICS' : 'FACULTY'}
        breadcrumbPage="ENROLLED FACE"
        title="Enrolled Face"
        description={
          isAdmin
            ? 'Students and working scholars registered for face recognition. Capture front, right, and left photos with the camera.'
            : 'Students in your classes whose faces are enrolled. Use the boxed plus button to request a new enrollment.'
        }
        actions={<BoxedPlusButton label="Enroll Face" onClick={() => openAdd(null, 'student')} />}
      />

      {(error || scholarsError) && (
        <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error || scholarsError}</p>
      )}
      {notice && (
        <p
          className={`mt-4 rounded-btn px-3 py-2 text-body ${
            notice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {notice.text}
        </p>
      )}

      {isAdmin && (
        <div className="mt-4">
          <FaceEnrollRequests />
        </div>
      )}

      <EnrolledList
        title="Enrolled students"
        icon={ScanFace}
        rows={enrolledStudents}
        loading={loading}
        isAdmin={isAdmin}
        emptyLabel={isAdmin ? 'enroll a student' : 'request enrollment'}
        extraColumn="Program"
        extraValue={(row) => row.program}
        onDelete={removeFace}
        onView={setViewingPerson}
      />

      {isAdmin && (
        <EnrolledList
          title="Enrolled working scholars"
          icon={Briefcase}
          rows={enrolledScholars}
          loading={scholarsLoading}
          isAdmin
          emptyLabel="enroll a working scholar"
          extraColumn="Designation"
          extraValue={(row) => row.designation}
          onDelete={removeFace}
          onView={setViewingPerson}
        />
      )}

      {!isAdmin && faceRequests.length > 0 && (
        <section className="mt-4 rounded-card border border-border-light bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Pending requests</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border-light">
            {faceRequests.map((r) => (
              <li key={r.id} className="py-3">
                <p className="text-body font-semibold text-slate-900">{r.studentName}</p>
                <p className="text-secondary text-slate-500">ID {r.idNumber} · waiting for admin approval</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <EnrollFaceModal
        open={faceOpen}
        onClose={() => {
          setFaceOpen(false);
          setFacePerson(null);
        }}
        students={eligibleStudents}
        scholars={isAdmin ? eligibleScholars : []}
        initialPerson={facePerson}
        defaultKind={defaultKind}
        mode={isAdmin ? 'enroll' : 'request'}
        onSubmit={async ({ person, kind, note, captures }) => {
          if (person.faceEnrolled) {
            throw new Error(`${person.name} is already enrolled for face recognition.`);
          }
          if (isAdmin) {
            if (kind === 'scholar') {
              await enrollScholarFace({ scholar: person, captures });
            } else {
              const pending = faceRequests.find((r) => r.studentId === person.id);
              if (pending) await approveFaceEnroll(pending);
              await enrollStudentFace({ student: person, captures });
            }
            setNotice({ type: 'success', text: `${person.name}'s face is now enrolled.` });
            return;
          }
          if (pendingFaceIds.has(person.id)) {
            throw new Error(`A face enroll request for ${person.name} is already pending.`);
          }
          await requestFaceEnroll({
            student: person,
            note,
            facultyId: facultyId || account?.facultyId || '',
            facultyName: profile?.name || account?.name || '',
          });
          setNotice({
            type: 'success',
            text: `Request sent to the administrator to enroll ${person.name}'s face.`,
          });
        }}
      />
      <FacePhotosViewer person={viewingPerson} onClose={() => setViewingPerson(null)} />
      {dialog}
    </>
  );
}

function EnrolledList({ title, icon: Icon, rows, loading, isAdmin, emptyLabel, extraColumn, extraValue, onDelete, onView }) {
  return (
    <section className="mt-4 overflow-hidden rounded-card border border-border-light bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-border-light px-4 py-3">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full bg-info-bg px-2 py-0.5 text-label font-semibold text-info-text">{rows.length}</span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-light">
              {['ID Number', 'Full Name', extraColumn, 'Captures', 'Status', ''].map((col, index) => (
                <th key={`${col}-${index}`} className="px-4 py-3 text-label font-semibold uppercase tracking-wide text-slate-500">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-body text-slate-500">
                  Loading enrolled faces…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-body text-slate-500">
                  No faces enrolled yet. Use the boxed plus button to {emptyLabel}.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row, index) => (
                <tr key={row.id} className="border-t border-border-light">
                  <td className="px-4 py-3 text-secondary font-medium text-slate-700">{row.idNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <InitialAvatar name={row.name} tone={index + 2} />
                      <span className="text-body font-semibold text-slate-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary text-slate-700">{extraValue(row) || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <FaceThumb src={row.faceCaptures?.front} alt={`${row.name} front`} onClick={() => onView?.(row)} />
                      <FaceThumb src={row.faceCaptures?.right} alt={`${row.name} right`} onClick={() => onView?.(row)} />
                      <FaceThumb src={row.faceCaptures?.left} alt={`${row.name} left`} onClick={() => onView?.(row)} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status="Face Enrolled" />
                  </td>
                  <td className="px-4 py-3">
                    {onDelete ? (
                      <DeleteButton label={`${row.name} enrolled face`} onClick={() => onDelete(row)} />
                    ) : (
                      <BoxedPlusIcon disabled label={`${row.name} is already enrolled`} title="Already enrolled" />
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-4 md:hidden">
        {loading && <p className="py-6 text-center text-body text-slate-500">Loading enrolled faces…</p>}
        {!loading && rows.length === 0 && (
          <p className="py-6 text-center text-body text-slate-500">
            No faces enrolled yet. Use the boxed plus button to {emptyLabel}.
          </p>
        )}
        {!loading &&
          rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-border-light bg-[#f8fafc] p-3">
              <p className="text-body font-semibold text-slate-900">{row.name}</p>
              <p className="text-secondary text-slate-500">
                ID {row.idNumber}
                {isAdmin && extraValue(row) ? ` · ${extraValue(row)}` : ''}
              </p>
              <div className="mt-2 flex gap-1.5">
                <FaceThumb src={row.faceCaptures?.front} alt={`${row.name} front`} onClick={() => onView?.(row)} />
                <FaceThumb src={row.faceCaptures?.right} alt={`${row.name} right`} onClick={() => onView?.(row)} />
                <FaceThumb src={row.faceCaptures?.left} alt={`${row.name} left`} onClick={() => onView?.(row)} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status="Face Enrolled" />
                {onDelete && <DeleteButton label={`${row.name} enrolled face`} onClick={() => onDelete(row)} />}
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
