import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StudentTable from '../../components/students/StudentTable';
import StudentFormModal from '../../components/students/StudentFormModal';
import ImportClassListModal from '../../components/students/ImportClassListModal';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { useStudents } from '../../hooks/useStudents';
import { useSchedules } from '../../hooks/useSchedules';
import { useFaculty } from '../../hooks/useFaculty';
import { useMyClasses } from '../../hooks/useMyClasses';

const SCOPES = [
  { key: 'mine', label: 'My classes' },
  { key: 'all', label: 'All students' },
];

export default function EnrollStudentPage() {
  const { search = '' } = useOutletContext() || {};
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents();
  const { schedules, addSchedule } = useSchedules();
  const { faculty } = useFaculty();
  const { myClasses, myStudents, facultyId } = useMyClasses(schedules, students);
  const { confirm, dialog } = useConfirm();

  const [scope, setScope] = useState('mine');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Enroll Student
            </Button>
          </>
        }
      />

      {error && <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}

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

      <StudentTable students={rows} loading={loading} onEdit={openEdit} onDelete={handleDelete} />

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

      {dialog}
    </>
  );
}
