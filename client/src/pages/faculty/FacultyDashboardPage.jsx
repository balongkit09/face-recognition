import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Bell, CalendarDays, GraduationCap, UserPlus } from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import TypeBadge from '../../components/schedules/TypeBadge';
import NotificationItem from '../../components/layout/NotificationItem';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useSchedules, formatScheduleTime } from '../../hooks/useSchedules';
import { useStudents } from '../../hooks/useStudents';
import { useNotifications } from '../../hooks/useNotifications';
import { FACULTY_BASE } from '../../utils/routes';
import { useMyClasses } from '../../hooks/useMyClasses';

function matchesQuery(row, query) {
  if (!query) return true;
  return Object.values(row)
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export default function FacultyDashboardPage() {
  const { search = '' } = useOutletContext() || {};
  const { profile, account, user } = useAuth();
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules();
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const { notifications, markRead } = useNotifications(6);

  const { myClasses, myStudents } = useMyClasses(schedules, students);

  const query = search.trim().toLowerCase();
  const classRows = useMemo(() => myClasses.filter((row) => matchesQuery(row, query)), [myClasses, query]);
  const studentRows = useMemo(() => myStudents.filter((row) => matchesQuery(row, query)), [myStudents, query]);
  const openClasses = classRows.filter((row) => row.status === 'Open').length;
  const displayName = profile?.name || account?.name || user?.displayName || 'Faculty';

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-slate-900">Welcome, {displayName.split(' ')[0]}</h1>
          <p className="mt-1 text-body text-slate-500">
            Your classes, enrolled students and the latest activity in the system
          </p>
        </div>
        <Link to={`${FACULTY_BASE}/enroll`} className="self-start">
          <Button>
            <UserPlus className="h-4 w-4" />
            Enroll Student
          </Button>
        </Link>
      </div>

      {(schedulesError || studentsError) && (
        <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{schedulesError || studentsError}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="My Classes"
          value={schedulesLoading ? '—' : classRows.length}
          hint="Schedules assigned to you"
          badge={classRows.length ? `${openClasses} Open` : 'None yet'}
          badgeTone="info"
          icon={CalendarDays}
        />
        <StatCard
          label="My Students"
          value={studentsLoading ? '—' : studentRows.length}
          hint="Students enrolled in your classes (by EDP code)"
          badge={studentRows.length ? `${studentRows.length} enrolled` : 'None yet'}
          icon={GraduationCap}
        />
        <StatCard
          label="Notifications"
          value={notifications.filter((n) => !n.read).length}
          hint="Unread activity"
          badge="Live"
          badgeTone="info"
          icon={Bell}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-card border border-border-light bg-white shadow-card">
          <header className="flex items-center justify-between border-b border-border-light px-4 py-3">
            <h2 className="text-base font-semibold text-slate-900">My classes</h2>
            <span className="text-secondary text-slate-500">{classRows.length} total</span>
          </header>
          {schedulesLoading && <p className="px-4 py-10 text-center text-body text-slate-500">Loading…</p>}
          {!schedulesLoading && classRows.length === 0 && (
            <p className="px-4 py-10 text-center text-body text-slate-500">
              No schedules are assigned to you yet. Import a class list from Enroll Student to create one, or ask the administrator.
            </p>
          )}
          {!schedulesLoading && classRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-light">
                    {['Code / EDP', 'Subject', 'Type', 'Time', 'Room', 'Students', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-label font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classRows.map((row) => (
                    <tr key={row.id} className="border-b border-border-light last:border-b-0">
                      <td className="px-4 py-3 text-body">
                        <p className="font-semibold text-slate-900">{row.code || '—'}</p>
                        <p className="text-secondary text-slate-500">EDP {row.edpCode || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-body text-slate-700">{row.subject}</td>
                      <td className="px-4 py-3"><TypeBadge type={row.type} /></td>
                      <td className="px-4 py-3 text-body text-slate-700">{formatScheduleTime(row)}</td>
                      <td className="px-4 py-3 text-body text-slate-700">{row.room || '—'}</td>
                      <td className="px-4 py-3 text-body text-slate-700">{row.enrolled ?? 0}/{row.capacity ?? 50}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-card border border-border-light bg-white shadow-card">
          <header className="flex items-center justify-between border-b border-border-light px-4 py-3">
            <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
            <Link to={`${FACULTY_BASE}/notifications`} className="text-secondary font-semibold text-primary">
              View all
            </Link>
          </header>
          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-body text-slate-500">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-border-light">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  compact
                  onClick={(item) => {
                    if (!item.read) markRead(item.id).catch(() => {});
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-card border border-border-light bg-white shadow-card">
        <header className="flex items-center justify-between border-b border-border-light px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">My students</h2>
          <Link to={`${FACULTY_BASE}/enroll`} className="text-secondary font-semibold text-primary">
            Manage
          </Link>
        </header>
        {studentsLoading && <p className="px-4 py-10 text-center text-body text-slate-500">Loading…</p>}
        {!studentsLoading && studentRows.length === 0 && (
          <p className="px-4 py-10 text-center text-body text-slate-500">
            No students enrolled in your classes yet.
          </p>
        )}
        {!studentsLoading && studentRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-light">
                  {['ID Number', 'EDP Code', 'Full Name', 'Program', 'Email'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-label font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-border-light last:border-b-0">
                    <td className="px-4 py-3 text-body text-slate-700">{s.idNumber}</td>
                    <td className="px-4 py-3 text-body text-slate-700">{s.edpCode || '—'}</td>
                    <td className="px-4 py-3 text-body font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-body text-slate-700">{s.program}</td>
                    <td className="px-4 py-3 text-body text-slate-500">{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {studentRows.length > 10 && (
              <p className="border-t border-border-light px-4 py-2 text-secondary text-slate-500">
                Showing 10 of {studentRows.length}. Open Enroll Student to see all.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
