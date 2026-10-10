import WorkingScholarRow from './WorkingScholarRow';
import DesignationBadge from './DesignationBadge';
import { BoxedPlusIcon } from '../common/BoxedPlusButton';

const COLUMNS = [
  { key: 'id', label: 'ID Number' },
  { key: 'name', label: 'Full Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Settings' },
];

export default function WorkingScholarTable({ scholars, loading, onEdit, onDelete, onEnrollFace }) {
  return (
    <div className="mt-4 w-full overflow-hidden rounded-card border border-border-light bg-white shadow-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
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
                  Loading working scholars…
                </td>
              </tr>
            )}
            {!loading && scholars.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-body text-slate-500">
                  No working scholars yet. Click Add Working Scholar to save one to Firebase.
                </td>
              </tr>
            )}
            {!loading &&
              scholars.map((scholar, index) => (
                <WorkingScholarRow
                  key={scholar.id}
                  scholar={scholar}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onEnrollFace={onEnrollFace}
                />
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-4 md:hidden">
        {loading && <p className="py-6 text-center text-body text-slate-500">Loading working scholars…</p>}
        {!loading && scholars.length === 0 && (
          <p className="py-6 text-center text-body text-slate-500">
            No working scholars yet. Click Add Working Scholar to save one to Firebase.
          </p>
        )}
        {!loading &&
          scholars.map((scholar) => (
            <article key={scholar.id} className="rounded-xl border border-border-light bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-slate-900">{scholar.name}</p>
                  <p className="text-secondary text-slate-500">ID {scholar.idNumber}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {onEnrollFace && (
                    <BoxedPlusIcon
                      disabled={scholar.faceEnrolled}
                      label={
                        scholar.faceEnrolled
                          ? `${scholar.name} is already enrolled`
                          : `Enroll face for ${scholar.name}`
                      }
                      title={scholar.faceEnrolled ? 'Already enrolled' : 'Enroll Face'}
                      onClick={() => onEnrollFace(scholar)}
                    />
                  )}
                  <button type="button" className="text-body text-primary" onClick={() => onEdit(scholar)}>
                    Edit
                  </button>
                  <button type="button" className="text-body text-danger" onClick={() => onDelete(scholar)}>
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <DesignationBadge designation={scholar.designation} />
              </div>
              <p className="mt-2 break-all text-secondary text-slate-500">{scholar.email}</p>
            </article>
          ))}
      </div>
    </div>
  );
}
