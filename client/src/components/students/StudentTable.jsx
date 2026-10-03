import StudentRow from './StudentRow';

const COLUMNS = [
  { key: 'id', label: 'ID Number' },
  { key: 'edp', label: 'EDP Code' },
  { key: 'name', label: 'Full Name' },
  { key: 'program', label: 'Program' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Settings' },
];

export default function StudentTable({ students, loading, onEdit, onDelete }) {
  return (
    <div className="mt-4 w-full overflow-hidden rounded-card border border-border-light bg-white shadow-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-light">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-label font-semibold uppercase tracking-wide text-slate-500"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-body text-slate-500">
                  Loading students…
                </td>
              </tr>
            )}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-body text-slate-500">
                  No students yet. Add a student to see them here and on the dashboard.
                </td>
              </tr>
            )}
            {!loading &&
              students.map((student, index) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-4 md:hidden">
        {loading && <p className="py-6 text-center text-body text-slate-500">Loading students…</p>}
        {!loading && students.length === 0 && (
          <p className="py-6 text-center text-body text-slate-500">
            No students yet. Add a student to see them here and on the dashboard.
          </p>
        )}
        {!loading &&
          students.map((student) => (
            <article key={student.id} className="rounded-xl border border-border-light bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-slate-900">{student.name}</p>
                  <p className="text-secondary text-slate-500">
                    ID {student.idNumber} · EDP {student.edpCode || '—'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="text-body text-primary" onClick={() => onEdit(student)}>
                    Edit
                  </button>
                  <button type="button" className="text-body text-danger" onClick={() => onDelete(student)}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-secondary text-slate-600">{student.program}</p>
              <p className="break-all text-secondary text-slate-500">{student.email}</p>
            </article>
          ))}
      </div>
    </div>
  );
}
