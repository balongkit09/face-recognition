import { useState } from 'react';
import FacultyRow, { LoginCell } from './FacultyRow';

const COLUMNS = [
  { key: 'name', label: 'Full Name' },
  { key: 'id', label: 'ID Number' },
  { key: 'program', label: 'Program' },
  { key: 'email', label: 'Email' },
  { key: 'login', label: 'Portal Login' },
  { key: 'actions', label: 'Settings' },
];

const COL_SPAN = COLUMNS.length + 1;

export default function FacultyTable({ faculty, loading, onEdit, onDelete, onCreateLogin }) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const allSelected = faculty.length > 0 && selectedIds.size === faculty.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(faculty.map((f) => f.id)));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mt-4 w-full overflow-hidden rounded-card border border-border-light bg-white shadow-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-light">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
                  aria-label="Select all faculty"
                />
              </th>
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
                <td colSpan={COL_SPAN} className="px-4 py-12 text-center text-body text-slate-500">
                  Loading faculty…
                </td>
              </tr>
            )}
            {!loading && faculty.length === 0 && (
              <tr>
                <td colSpan={COL_SPAN} className="px-4 py-12 text-center text-body text-slate-500">
                  No faculty records yet. Add faculty to save them to Firebase.
                </td>
              </tr>
            )}
            {!loading &&
              faculty.map((member, index) => (
                <FacultyRow
                  key={member.id}
                  member={member}
                  index={index}
                  selected={selectedIds.has(member.id)}
                  onToggleSelect={toggleOne}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCreateLogin={onCreateLogin}
                />
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-4 md:hidden">
        {loading && <p className="py-6 text-center text-body text-slate-500">Loading faculty…</p>}
        {!loading && faculty.length === 0 && (
          <p className="py-6 text-center text-body text-slate-500">
            No faculty records yet. Add faculty to save them to Firebase.
          </p>
        )}
        {!loading &&
          faculty.map((member) => (
            <article key={member.id} className="rounded-xl border border-border-light bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-slate-900">{member.name}</p>
                  <p className="text-secondary text-slate-500">ID {member.idNumber}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="text-body text-primary" onClick={() => onEdit(member)}>
                    Edit
                  </button>
                  <button type="button" className="text-body text-danger" onClick={() => onDelete(member)}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-secondary text-slate-600">{member.program}</p>
              <p className="break-all text-secondary text-slate-500">{member.email}</p>
              <div className="mt-2 border-t border-border-light pt-2">
                <p className="mb-1 text-label font-semibold uppercase tracking-wide text-slate-400">Portal login</p>
                <LoginCell member={member} onCreateLogin={onCreateLogin} compact />
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
