import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Upload, UserPlus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import BoxedPlusButton from '../../components/common/BoxedPlusButton';
import StudentTable from '../../components/students/StudentTable';
import StudentFormModal from '../../components/students/StudentFormModal';
import ImportClassListModal from '../../components/students/ImportClassListModal';
import EnrollFaceModal from '../../components/students/EnrollFaceModal';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { useStudents } from '../../hooks/useStudents';
import { useSchedules } from '../../hooks/useSchedules';
import { useFaculty } from '../../hooks/useFaculty';
import { useMyClasses } from '../../hooks/useMyClasses';
import { useFaceEnrollRequests } from '../../hooks/useFaceEnrollRequests';
import { requestFaceEnroll } from '../../firebase/faceEnrollRequests';

const SCOPES = [
  { key: 'mine', label: 'My classes' },
  { key: 'all', label: 'All students' },
];

export default function EnrollStudentPage() {
  const { search = '' } = useOutletContext() || {};
  const { profile, account } = useAuth();
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents();
  const { schedules, addSchedule } = useSchedules();
  const { faculty } = useFaculty();
  const { myClasses, myStudents, facultyId } = useMyClasses(schedules, students);
  const { requests: faceRequests } = useFaceEnrollRequests({ pendingOnly: true });
  const { confirm, dialog } = useConfirm();

  const [scope, setScope] = useState('mine');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [faceOpen, setFaceOpen] = useState(false);
  const [faceStudent, setFaceStudent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [faceNotice, setFaceNotice] = useState(null);

  const pendingFaceIds = useMemo(
    () => new Set(faceRequests.map((r) => r.studentId).filter(Boolean)),
    [faceRequests],
  );

  const query = search.trim().toLowerCase();
  const rows = useMemo(() => {
    const base = scope === 'mine' ? myStudents : students;
    if (!query) return base;
    return base.filter((s) =>
      Object.values(s)
        .filter((v) => typeof v === 'string')
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [scope, myStudents, students, query]);

  const edpOptions = useMemo(
    () =>
      myClasses
        .filter((c) => c.edpCode || c.code)
        .map((c) => {
          const value = String(c.edpCode || c.code);
          return { value, label: `${value} · ${c.subject || ''}`.trim() };
        }),
    [myClasses],
  );

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (student) => {
    setEditing(student);
    setModalOpen(true);
  };

  const handleDelete = (student) =>
    confirm({
      title: 'Remove student',
      message: (
        <>
          Remove <strong>{student.name}</strong> (ID {student.idNumber}) from the system? This cannot be undone.
        </>
      ),
      confirmLabel: 'Remove',
      onConfirm: () => deleteStudent(student.id),
    });

  const handleSubmit = async (form) => {
    if (editing) await updateStudent(editing.id, form);
    else await addStudent(form);
  };

  return (
    <>
      <PageHeader
        breadcrumbSection="FACULTY"
        breadcrumbPage="ENROLL STUDENT"
        title="Enroll Student"
        description="Add students to your classes one by one, or import an official class list (PDF / Excel). Imported classes are assigned to you automatically."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import Class List
            </Button>
            <BoxedPlusButton
              label="Enroll Face"
              onClick={() => {
                setFaceStudent(null);
                setFaceOpen(true);
              }}
            />
            <Button onClick={openAdd}>
              <UserPlus className="h-4 w-4" />
              Enroll Student
            </Button>
          </>
        }
      />

      {error && <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}
      {faceNotice && (
        <p
          className={`mt-4 rounded-btn px-3 py-2 text-body ${
            faceNotice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {faceNotice.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setScope(s.key)}
            className={`rounded-full px-3 py-1.5 text-body font-medium transition-colors ${
              scope === s.key
                ? 'bg-primary text-white shadow-card'
                : 'border border-border bg-white text-slate-600 hover:bg-[#f8fafc]'
            }`}
          >
            {s.label} · {s.key === 'mine' ? myStudents.length : students.length}
          </button>
        ))}
        {scope === 'mine' && myClasses.length === 0 && !loading && (
          <span className="text-secondary text-slate-500">
            You have no classes yet — import a class list to create one.
          </span>
        )}
      </div>

      <StudentTable
        students={rows}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onEnrollFace={(student) => {
          if (pendingFaceIds.has(student.id)) {
            setFaceNotice({ type: 'error', text: `A face enroll request for ${student.name} is already pending.` });
            return;
          }
          setFaceStudent(student);
          setFaceOpen(true);
        }}
        pendingFaceIds={pendingFaceIds}
      />

      <StudentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        mode={editing ? 'edit' : 'add'}
        edpOptions={editing ? undefined : edpOptions}
        defaultEdpCode={edpOptions.length === 1 ? edpOptions[0].value : ''}
      />

      <ImportClassListModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        students={students}
        schedules={schedules}
        faculty={faculty}
        addStudent={addStudent}
        updateStudent={updateStudent}
        addSchedule={addSchedule}
        defaultTeacherId={facultyId || ''}
        lockTeacher
      />

      <EnrollFaceModal
        open={faceOpen}
        onClose={() => {
          setFaceOpen(false);
          setFaceStudent(null);
        }}
        students={rows}
        initialStudent={faceStudent}
        onSubmit={async ({ student, note }) => {
          if (pendingFaceIds.has(student.id)) {
            throw new Error(`A face enroll request for ${student.name} is already pending.`);
          }
          await requestFaceEnroll({
            student,
            note,
            facultyId: facultyId || account?.facultyId || '',
            facultyName: profile?.name || account?.name || '',
          });
          setFaceNotice({
            type: 'success',
            text: `Request sent to the administrator to enroll ${student.name}'s face.`,
          });
        }}
      />

      {dialog}
    </>
  );
}
