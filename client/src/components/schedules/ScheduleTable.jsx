import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import TypeBadge from './TypeBadge';
import { formatScheduleTime, SCHEDULE_TYPES } from '../../hooks/useSchedules';

const HEADERS = [
  'Code',
  'Subject',
  'Teacher',
  'Type',
  'Schedule',
  'Days',
  'Room',
  'Section',
  'Num.',
  'Status',
  'Settings',
];

const PER_PAGE_OPTIONS = [10, 25, 50];

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, 3, 4, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, idx) => {
    if (idx > 0 && p - sorted[idx - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

export default function ScheduleTable({
  schedules,
  loading,
  globalSearch = '',
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onImport,
}) {
  const [filter, setFilter] = useState('');
  const [section, setSection] = useState('');
  const [term, setTerm] = useState('');
  const [type, setType] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);

  const sections = useMemo(() => uniqueSorted(schedules.map((s) => s.section)), [schedules]);
  const terms = useMemo(() => uniqueSorted(schedules.map((s) => s.term)), [schedules]);

  const filtered = useMemo(() => {
    const q = `${filter} ${globalSearch}`.trim().toLowerCase();
    return schedules.filter((s) => {
      if (section && s.section !== section) return false;
      if (term && s.term !== term) return false;
      if (type && s.type !== type) return false;
      if (!q) return true;
      const haystack = [s.code, s.edpCode, s.subject, s.teacher, s.room, s.section, s.days, s.status, s.type]
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [schedules, filter, globalSearch, section, term, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [filter, globalSearch, section, term, type, perPage]);

  const start = (page - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);
  const showingFrom = filtered.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + perPage, filtered.length);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && onImport) await onImport(file);
  };

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-border-light bg-white shadow-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <label className="relative block w-full sm:w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter schedule, code, teacher…"
              className="w-full rounded-btn border border-border bg-[#f8fafc] py-2 pl-8 pr-3 text-body text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filter schedules"
            />
          </label>
          <Select value={section} onChange={setSection} allLabel="All Sections" options={sections} ariaLabel="Section" />
          <Select value={term} onChange={setTerm} allLabel="All Terms" options={terms} ariaLabel="Term" />
          <Select value={type} onChange={setType} allLabel="All Types" options={SCHEDULE_TYPES} ariaLabel="Type" />
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
          <ToolbarButton onClick={onExport} disabled={!schedules.length}>
            <Download className="h-3.5 w-3.5" />
            Export
          </ToolbarButton>
          <ToolbarButton onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </ToolbarButton>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-btn bg-primary px-3 py-2 text-body font-medium text-white shadow-card hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Class Schedule
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead>
            <tr className="border-y border-border-light bg-[#fafbfd]">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-label font-semibold uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-12 text-center text-body text-slate-500">
                  Loading schedules…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-12 text-center text-body text-slate-500">
                  {schedules.length === 0
                    ? 'No schedules yet. Click Add Class Schedule to save one to Firebase.'
                    : 'No schedules match the current filters.'}
                </td>
              </tr>
            )}
            {!loading &&
              visible.map((s) => (
                <tr key={s.id} className="border-b border-border-light last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-secondary font-medium text-primary">
                    {s.code}
                    {s.edpCode && (
                      <span className="block text-label font-normal text-slate-400">EDP {s.edpCode}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-body font-semibold text-slate-900">{s.subject}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-secondary text-slate-700">{s.teacher || '—'}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={s.type} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-secondary text-slate-600">
                    {formatScheduleTime(s)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-md bg-[#f1f5f9] px-1.5 py-0.5 font-mono text-label font-semibold text-slate-600">
                      {s.days || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-secondary text-slate-700">{s.room}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-secondary text-slate-700">{s.section}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-secondary text-slate-700">
                    {s.enrolled}/{s.capacity}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions schedule={s} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 border-t border-border-light px-4 py-4 md:hidden">
        {loading && <p className="py-6 text-center text-body text-slate-500">Loading schedules…</p>}
        {!loading && filtered.length === 0 && (
          <p className="py-6 text-center text-body text-slate-500">
            {schedules.length === 0
              ? 'No schedules yet. Click Add Class Schedule to save one to Firebase.'
              : 'No schedules match the current filters.'}
          </p>
        )}
        {!loading &&
          visible.map((s) => (
            <article key={s.id} className="rounded-xl border border-border-light bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-secondary font-medium text-primary">{s.code}</p>
                  <p className="truncate text-body font-semibold text-slate-900">{s.subject}</p>
                  <p className="truncate text-secondary text-slate-500">{s.teacher || 'No teacher assigned'}</p>
                </div>
                <RowActions schedule={s} onEdit={onEdit} onDelete={onDelete} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TypeBadge type={s.type} />
                <StatusBadge status={s.status} />
                <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-label font-semibold text-slate-600">
                  {s.days || '—'}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-secondary">
                <div>
                  <dt className="text-slate-400">Schedule</dt>
                  <dd className="font-mono text-slate-700">{formatScheduleTime(s)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Room</dt>
                  <dd className="text-slate-700">{s.room}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Section</dt>
                  <dd className="text-slate-700">{s.section}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Students</dt>
                  <dd className="text-slate-700">
                    {s.enrolled}/{s.capacity}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-border-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-secondary text-slate-500">
          <span>
            Showing <span className="font-semibold text-slate-700">{showingFrom}</span> to{' '}
            <span className="font-semibold text-slate-700">{showingTo}</span> of{' '}
            <span className="font-semibold text-slate-700">{filtered.length}</span> schedules
          </span>
          <label className="flex items-center gap-2">
            Per page:
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-btn border border-border bg-white px-2 py-1 text-secondary text-slate-700 focus:border-primary focus:outline-none"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <PageButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} ariaLabel="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </PageButton>
          {pageNumbers(page, totalPages).map((p, idx) =>
            p === '…' ? (
              <span key={`gap-${idx}`} className="px-1 text-secondary text-slate-400">
                …
              </span>
            ) : (
              <PageButton key={p} onClick={() => setPage(p)} active={p === page} ariaLabel={`Page ${p}`}>
                {p}
              </PageButton>
            ),
          )}
          <PageButton
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            ariaLabel="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PageButton>
        </nav>
      </div>
    </section>
  );
}

function Select({ value, onChange, allLabel, options, ariaLabel }) {
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="appearance-none rounded-btn border border-border bg-white py-2 pl-3 pr-8 text-body text-slate-700 shadow-card focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

function ToolbarButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-white px-3 py-2 text-body font-medium text-slate-700 shadow-card hover:bg-[#f8fafc] disabled:pointer-events-none disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

function PageButton({ children, onClick, disabled, active, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-secondary font-medium disabled:pointer-events-none disabled:opacity-40 ${
        active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-[#f8fafc]'
      }`}
    >
      {children}
    </button>
  );
}

function RowActions({ schedule, onEdit, onDelete }) {
  const label = `${schedule.code} ${schedule.section}`.trim();
  return (
    <div className="flex items-center gap-1 text-slate-400">
      <button
        type="button"
        onClick={() => onEdit(schedule)}
        className="rounded-md p-1.5 hover:bg-[#f8fafc] hover:text-slate-600"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(schedule)}
        className="rounded-md p-1.5 hover:bg-[#f8fafc] hover:text-slate-600"
        aria-label={`Delete ${label}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
