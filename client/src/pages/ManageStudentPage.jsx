import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import BoxedPlusButton from '../components/common/BoxedPlusButton';
import StudentTable from '../components/students/StudentTable';
import StudentFormModal from '../components/students/StudentFormModal';
import ImportClassListModal from '../components/students/ImportClassListModal';
import EnrollFaceModal from '../components/students/EnrollFaceModal';
import { useConfirm } from '../components/common/ConfirmDialog';
import { useStudents } from '../hooks/useStudents';
import { useSchedules } from '../hooks/useSchedules';
import { useFaculty } from '../hooks/useFaculty';
import { useFaceEnrollRequests } from '../hooks/useFaceEnrollRequests';
import { approveFaceEnroll, enrollStudentFace } from '../firebase/faceEnrollRequests';

export default function ManageStudentPage() {
  const { students, loading, error, addStudent, updateStudent, deleteStudent } =
    useStudents();
  const { schedules, addSchedule } = useSchedules();
  const { faculty } = useFaculty();
  const { requests: faceRequests } = useFaceEnrollRequests({ pendingOnly: true });
  const { confirm, dialog } = useConfirm();
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
  const eligibleFaces = useMemo(
    () => students.filter((s) => !s.faceEnrolled),
    [students],
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
      title: 'Delete student',
      message: (
        <>
          Delete <strong>{student.name}</strong> (ID {student.idNumber})? This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete',
      onConfirm: () => deleteStudent(student.id),
    });

  const handleSubmit = async (form) => {
    if (editing) {
      await updateStudent(editing.id, form);
    } else {
      await addStudent(form);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbSection="ACADEMICS"
        breadcrumbPage="STUDENT DIRECTORY"
        title="Manage Student"
        description="Add students one by one or import an official class list (PDF / Excel). Records appear on the dashboard as soon as they are saved to Firebase."
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
            <BoxedPlusButton label="Add Student" onClick={openAdd} />
          </>
        }
      />

      {error && (
        <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>
      )}
      {faceNotice && (
        <p
          className={`mt-4 rounded-btn px-3 py-2 text-body ${
            faceNotice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {faceNotice.text}
        </p>
      )}

      <StudentTable
        students={students}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onEnrollFace={(student) => {
          if (student.faceEnrolled) {
            setFaceNotice({ type: 'error', text: `${student.name} is already enrolled for face recognition.` });
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
      />

      <EnrollFaceModal
        open={faceOpen}
        onClose={() => {
          setFaceOpen(false);
          setFaceStudent(null);
        }}
        students={eligibleFaces}
        initialStudent={faceStudent}
        mode="enroll"
        onSubmit={async ({ student, captures }) => {
          if (student.faceEnrolled) {
            throw new Error(`${student.name} is already enrolled for face recognition.`);
          }
          const pending = faceRequests.find((r) => r.studentId === student.id);
          if (pending) await approveFaceEnroll(pending);
          await enrollStudentFace({ student, captures });
          setFaceNotice({ type: 'success', text: `${student.name}'s face is now enrolled.` });
        }}
      />

      {dialog}
    </>
  );
}
