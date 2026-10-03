import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import StudentTable from '../components/students/StudentTable';
import StudentFormModal from '../components/students/StudentFormModal';
import ImportClassListModal from '../components/students/ImportClassListModal';
import { useConfirm } from '../components/common/ConfirmDialog';
import { useStudents } from '../hooks/useStudents';
import { useSchedules } from '../hooks/useSchedules';
import { useFaculty } from '../hooks/useFaculty';

export default function ManageStudentPage() {
  const { students, loading, error, addStudent, updateStudent, deleteStudent } =
    useStudents();
  const { schedules, addSchedule } = useSchedules();
  const { faculty } = useFaculty();
  const { confirm, dialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </>
        }
      />

      {error && (
        <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>
      )}

      <StudentTable
        students={students}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
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

      {dialog}
    </>
  );
}
