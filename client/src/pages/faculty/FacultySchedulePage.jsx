import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import ScheduleTable from '../../components/schedules/ScheduleTable';
import { useSchedules } from '../../hooks/useSchedules';
import { useStudents } from '../../hooks/useStudents';
import { useMyClasses } from '../../hooks/useMyClasses';

export default function FacultySchedulePage() {
  const { search = '' } = useOutletContext() || {};
  const { schedules, loading, error } = useSchedules();
  const { students } = useStudents();
  const { myClasses } = useMyClasses(schedules, students);

  return (
    <>
      <PageHeader
        breadcrumbSection="CLASSES"
        breadcrumbPage="SCHEDULE"
        title="My Schedule"
        description="Class schedules assigned to you. Contact an administrator to change a class."
      />

      {error && <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}

      <div className="mt-4">
        <ScheduleTable schedules={myClasses} loading={loading} globalSearch={search} readOnly />
      </div>
    </>
  );
}
