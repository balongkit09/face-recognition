import { Pencil, Plus, Trash2 } from 'lucide-react';
import InitialAvatar from './InitialAvatar';

const HEADERS = ['ID Number', 'EDP Code', 'Full Name', 'Program', 'Email', 'Settings'];

export default function StudentsOverviewTable({
  rows,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <section className="overflow-hidden rounded-card border border-border-light bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">Students</h2>
          <span className="rounded-full bg-[#f8fafc] px-2 py-0.5 text-label font-semibold text-slate-500">
            {rows.length} total
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-btn bg-primary px-3 py-2 text-body font-medium text-white shadow-card hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Student
        </button>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-y border-border-light">
              {HEADERS.map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-label font-semibold uppercase tracking-wide text-slate-400"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-10 text-center text-body text-slate-500">
                  Loading students…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-10 text-center text-body text-slate-500">
                  No students yet. Click Add Student to save a record to Firebase.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row, index) => (
                <tr key={row.id} className="border-b border-border-light last:border-b-0">
                  <td className="px-4 py-3 text-secondary font-medium text-slate-700">{row.idNumber}</td>
                  <td className="px-4 py-3 text-secondary text-slate-700">{row.edpCode || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <InitialAvatar name={row.name} tone={index + 2} />
                      <span className="text-body font-semibold text-slate-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-secondary text-slate-700">{row.program}</td>
                  <td className="px-4 py-3 text-secondary text-slate-500">{row.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded-md p-1.5 hover:bg-[#f8fafc] hover:text-slate-600"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="rounded-md p-1.5 hover:bg-[#f8fafc] hover:text-slate-600"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4 md:hidden">
        {!loading && rows.length === 0 && (
          <p className="py-6 text-center text-body text-slate-500">
            No students yet. Click Add Student to save a record to Firebase.
          </p>
        )}
        {!loading &&
          rows.map((row, index) => (
            <article key={row.id} className="rounded-xl border border-border-light bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <InitialAvatar name={row.name} tone={index + 2} />
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-slate-900">{row.name}</p>
                    <p className="truncate text-secondary text-slate-500">{row.idNumber}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 text-slate-400">
                  <button type="button" onClick={() => onEdit(row)} className="p-1" aria-label={`Edit ${row.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onDelete(row)} className="p-1" aria-label={`Delete ${row.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-secondary">
                <div>
                  <dt className="text-slate-400">EDP Code</dt>
                  <dd className="text-slate-700">{row.edpCode || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Program</dt>
                  <dd className="text-slate-700">{row.program}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Email</dt>
                  <dd className="break-all text-slate-700">{row.email}</dd>
                </div>
              </dl>
            </article>
          ))}
      </div>
    </section>
  );
}
