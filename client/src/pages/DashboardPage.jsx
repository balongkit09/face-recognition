import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { CalendarDays, GraduationCap, RefreshCw, Users } from 'lucide-react';
import { useFaculty } from '../hooks/useFaculty';
import { useStudents } from '../hooks/useStudents';
import { useSchedules } from '../hooks/useSchedules';
import StatCard from '../components/dashboard/StatCard';
import FacultyOverviewTable from '../components/dashboard/FacultyOverviewTable';
import StudentsOverviewTable from '../components/dashboard/StudentsOverviewTable';
import FacultyFormModal from '../components/faculty/FacultyFormModal';
import StudentFormModal from '../components/students/StudentFormModal';
import { useConfirm } from '../components/common/ConfirmDialog';

function matchesQuery(row, query) {
  if (!query) return true;
  const haystack = Object.values(row)
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function DashboardPage() {
  const { search = '' } = useOutletContext() || {};
  const {
    faculty,
    loading: facultyLoading,
    error: facultyError,
    addFaculty,
    updateFaculty,
    deleteFaculty,
  } = useFaculty();
  const {
    students,
    loading: studentLoading,
    error: studentError,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useStudents();
  const { schedules, loading: scheduleLoading } = useSchedules();

  const [range, setRange] = useState('today');
  const [facultyModal, setFacultyModal] = useState({ open: false, editing: null });
  const [studentModal, setStudentModal] = useState({ open: false, editing: null });

  const query = search.trim().toLowerCase();
  const facultyRows = faculty.filter((row) => matchesQuery(row, query));
  const studentRows = students.filter((row) => matchesQuery(row, query));
  const scheduleRows = schedules.filter((row) => matchesQuery(row, query));
  const openSchedules = scheduleRows.filter((row) => row.status === 'Open').length;
  const loading = facultyLoading || studentLoading;

  const { confirm, dialog } = useConfirm();

  const confirmDeleteFaculty = (member) =>
    confirm({
      title: 'Delete faculty',
      message: (
        <>
          Delete <strong>{member.name}</strong> (ID {member.idNumber})? Their portal login will be revoked.
          This cannot be undone.
        </>
      ),
      onConfirm: () => deleteFaculty(member.id),
    });

  const confirmDeleteStudent = (student) =>
    confirm({
      title: 'Delete student',
      message: (
        <>
          Delete <strong>{student.name}</strong> (ID {student.idNumber})? This cannot be undone.
        </>
      ),
      onConfirm: () => deleteStudent(student.id),
    });

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-slate-900">Overview</h1>
          <p className="mt-1 text-body text-slate-500">
            Real-time attendance &amp; academic enrollment metrics
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-9 rounded-btn border border-border bg-white px-3 text-body font-medium text-slate-700 shadow-card focus:border-primary focus:outline-none"
            aria-label="Date range"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-border bg-white text-slate-500 shadow-card hover:bg-[#f8fafc]"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {(facultyError || studentError) && (
        <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">
          {facultyError || studentError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Registered Students"
          value={loading ? '—' : studentRows.length}
          hint="Active enrollments this semester"
          badge={studentRows.length ? `${studentRows.length} enrolled` : 'None yet'}
          icon={GraduationCap}
        />
        <StatCard
          label="Schedules"
          value={scheduleLoading ? '—' : scheduleRows.length}
          hint="Class schedules saved in the system"
          badge={scheduleRows.length ? `${openSchedules} Open` : 'None yet'}
          badgeTone="info"
          icon={CalendarDays}
        />
        <StatCard
          label="Registered Faculty"
          value={facultyRows.length}
          hint="Facilitating academic faculty"
          badge={facultyRows.length ? `${facultyRows.length} registered` : 'None yet'}
          icon={Users}
        />
      </div>

      <FacultyOverviewTable
        rows={facultyRows}
        loading={facultyLoading}
        onAdd={() => setFacultyModal({ open: true, editing: null })}
        onEdit={(row) => setFacultyModal({ open: true, editing: row })}
        onDelete={confirmDeleteFaculty}
      />
      <StudentsOverviewTable
        rows={studentRows}
        loading={studentLoading}
        onAdd={() => setStudentModal({ open: true, editing: null })}
        onEdit={(row) => setStudentModal({ open: true, editing: row })}
        onDelete={confirmDeleteStudent}
      />

      <FacultyFormModal
        open={facultyModal.open}
        onClose={() => setFacultyModal({ open: false, editing: null })}
        onSubmit={async (form) => {
          if (facultyModal.editing) {
            await updateFaculty(facultyModal.editing.id, form);
          } else {
            await addFaculty(form);
          }
        }}
        initialData={facultyModal.editing}
        mode={facultyModal.editing ? 'edit' : 'add'}
      />
      <StudentFormModal
        open={studentModal.open}
        onClose={() => setStudentModal({ open: false, editing: null })}
        onSubmit={async (form) => {
          if (studentModal.editing) {
            await updateStudent(studentModal.editing.id, form);
          } else {
            await addStudent(form);
          }
        }}
        initialData={studentModal.editing}
        mode={studentModal.editing ? 'edit' : 'add'}
      />
      {dialog}
    </div>
  );
}
