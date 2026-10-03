import { useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Upload } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  ClassListFormatError,
  classInfoToSchedule,
  decodeText,
  parseDelimitedText,
  parsePdfLines,
  parseSheetRows,
} from '../../utils/classListParser';
import { formatScheduleTime } from '../../hooks/useSchedules';
import { notify } from '../../firebase/notifications';

const ACCEPT = '.pdf,.xls,.xlsx,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function isZip(bytes) {
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}
function isOle(bytes) {
  return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
}
function isPdf(bytes) {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
}

/** Read and parse a class list file (PDF or Excel/TSV). Throws ClassListFormatError. */
async function parseClassListFile(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 8));
  const ext = (file.name.split('.').pop() || '').toLowerCase();

  if (isPdf(bytes) || ext === 'pdf') {
    const { extractPdfLines } = await import('../../utils/pdfText');
    const lines = await extractPdfLines(buffer);
    return parsePdfLines(lines);
  }

  if (isZip(bytes) || isOle(bytes)) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: '',
    });
    return parseSheetRows(rows);
  }

  if (['xls', 'xlsx', 'csv', 'txt', 'tsv'].includes(ext)) {
    // The university portal exports ".xls" files that are really tab-separated text.
    const rows = parseDelimitedText(decodeText(buffer));
    return parseSheetRows(rows);
  }

  throw new ClassListFormatError(
    'Unsupported file. Upload the official class list downloaded from the portal as PDF (.pdf) or Excel (.xls / .xlsx).',
  );
}

export default function ImportClassListModal({
  open,
  onClose,
  students = [],
  schedules = [],
  faculty = [],
  addStudent,
  updateStudent,
  addSchedule,
  defaultTeacherId = '',
  lockTeacher = false,
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [createSchedule, setCreateSchedule] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFileName('');
    setParsed(null);
    setSelected(new Set());
    setCreateSchedule(true);
    setTeacherId(defaultTeacherId || '');
    setBusy('');
    setError('');
    setProgress(0);
    setResult(null);
  }, [open, defaultTeacherId]);

  const existingByIdNumber = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      if (s.idNumber) map.set(String(s.idNumber), s);
    });
    return map;
  }, [students]);

  const scheduleExists = useMemo(() => {
    if (!parsed) return false;
    return schedules.some((s) => s.edpCode && s.edpCode === parsed.classInfo.edpCode);
  }, [schedules, parsed]);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setResult(null);
    setParsed(null);
    setFileName(file.name);
    setBusy('parsing');
    try {
      const data = await parseClassListFile(file);
      setParsed(data);
      setSelected(new Set(data.students.filter((s) => !s.skipped).map((s) => s.idNumber)));
    } catch (err) {
      setError(
        err instanceof ClassListFormatError
          ? err.message
          : `Could not read this file: ${err.message || err}`,
      );
    } finally {
      setBusy('');
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const toggle = (idNumber) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idNumber)) next.delete(idNumber);
      else next.add(idNumber);
      return next;
    });
  };

  const toggleAll = () => {
    if (!parsed) return;
    const all = parsed.students.map((s) => s.idNumber);
    setSelected((prev) => (prev.size === all.length ? new Set() : new Set(all)));
  };

  const handleImport = async () => {
    if (!parsed) return;
    const rows = parsed.students.filter((s) => selected.has(s.idNumber));
    if (rows.length === 0) {
      setError('Select at least one student to import.');
      return;
    }
    setBusy('importing');
    setError('');
    setProgress(0);
    const summary = { added: 0, updated: 0, failed: [], scheduleCreated: false };
    for (let i = 0; i < rows.length; i += 1) {
      const s = rows[i];
      const payload = {
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        program: s.program,
        email: s.email,
        idNumber: s.idNumber,
        edpCode: s.edpCode,
      };
      try {
        const existing = existingByIdNumber.get(s.idNumber);
        if (existing) {
          await updateStudent(existing.id, payload, { silent: true });
          summary.updated += 1;
        } else {
          await addStudent(payload, { silent: true });
          summary.added += 1;
        }
      } catch (err) {
        summary.failed.push(`${s.idNumber} ${s.lastName}: ${err.message}`);
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    if (createSchedule && !scheduleExists && addSchedule) {
      try {
        const member = faculty.find((f) => f.id === teacherId);
        await addSchedule(
          {
            ...classInfoToSchedule(parsed.classInfo, rows),
            teacherId: member ? member.id : '',
            teacher: member ? member.name : '',
          },
          { silent: true },
        );
        summary.scheduleCreated = true;
      } catch (err) {
        summary.failed.push(`Schedule: ${err.message}`);
      }
    }

    const { classInfo } = parsed;
    notify({
      type: 'import',
      entity: 'student',
      title: `Class list imported: ${classInfo.subject} (EDP ${classInfo.edpCode})`,
      message: `${summary.added} added · ${summary.updated} updated${
        summary.scheduleCreated ? ' · schedule created' : ''
      }${summary.failed.length ? ` · ${summary.failed.length} failed` : ''}`,
      meta: { edpCode: classInfo.edpCode, subject: classInfo.subject },
    });

    setResult(summary);
    setBusy('');
  };

  const info = parsed?.classInfo;
  const allSelected = parsed && selected.size === parsed.students.length;

  return (
    <Modal open={open} onClose={onClose} title="Import Class List" size="xl">
      <div className="flex flex-col gap-4">
        <p className="text-body text-slate-500">
          Upload the <span className="font-semibold text-slate-700">official class list</span> downloaded from the
          portal (PDF or Excel). Only that format is accepted. Students in the list are added to the{' '}
          <code className="rounded bg-[#f1f5f9] px-1 text-secondary">student</code> collection with the class EDP code;
          students that already exist (same ID number) are updated instead of duplicated.
        </p>

        {/* Drop zone */}
        <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInputChange} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={busy === 'importing'}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragOver ? 'border-primary bg-info-bg' : 'border-border bg-[#f8fafc] hover:border-primary/60'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="h-5 w-5" />
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <span className="text-body font-medium text-slate-700">
            {busy === 'parsing' ? 'Reading file…' : fileName || 'Click to choose a class list, or drag it here'}
          </span>
          <span className="text-secondary text-slate-500">
            Accepted: OFFICIAL_&lt;EDP&gt;_&lt;SUBJECT&gt;.pdf or &lt;EDP&gt;_&lt;SUBJECT&gt;.xls / .xlsx
          </span>
        </button>

        {error && <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}

        {/* Preview */}
        {parsed && !result && (
          <>
            <section className="rounded-card border border-border-light bg-white p-4">
              <h3 className="mb-3 text-label font-semibold uppercase tracking-wide text-slate-500">Class details</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-body sm:grid-cols-4">
                <Detail label="EDP code" value={info.edpCode} mono />
                <Detail label="Subject" value={info.subject} />
                <Detail label="Type" value={info.type || '—'} />
                <Detail label="Room" value={info.room || '—'} />
                <Detail label="Schedule" value={info.startTime ? formatScheduleTime(info) : '—'} mono />
                <Detail label="Days" value={info.days || '—'} />
                <Detail label="Term" value={info.term || '—'} />
                <Detail label="Students" value={`${parsed.students.filter((s) => !s.skipped).length} listed`} />
                {info.description && (
                  <div className="col-span-2 sm:col-span-4">
                    <dt className="text-label uppercase tracking-wide text-slate-400">Description</dt>
                    <dd className="text-slate-700">{info.description}</dd>
                  </div>
                )}
              </dl>

              {addSchedule && (
                <div className="mt-4 flex flex-col gap-2 border-t border-border-light pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-body text-slate-700">
                    <input
                      type="checkbox"
                      checked={createSchedule && !scheduleExists}
                      disabled={scheduleExists}
                      onChange={(e) => setCreateSchedule(e.target.checked)}
                      className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
                    />
                    {scheduleExists
                      ? `A schedule with EDP ${info.edpCode} already exists in Create Schedule.`
                      : 'Also add this class to Create Schedule'}
                  </label>
                  {createSchedule && !scheduleExists && (
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      disabled={lockTeacher}
                      className="rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none disabled:bg-[#f8fafc]"
                      aria-label="Teacher for this class"
                    >
                      <option value="">Teacher: assign later</option>
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-card border border-border-light">
              <div className="max-h-[40vh] overflow-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead className="sticky top-0 bg-[#fafbfd]">
                    <tr className="border-b border-border-light">
                      <th className="w-10 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!allSelected}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
                          aria-label="Select all students"
                        />
                      </th>
                      {['ID Number', 'Full Name', 'Program', 'Email', 'Action'].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-3 py-2 text-label font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.students.map((s) => {
                      const existing = existingByIdNumber.get(s.idNumber);
                      const checked = selected.has(s.idNumber);
                      return (
                        <tr
                          key={s.idNumber}
                          className={`border-b border-border-light last:border-b-0 ${s.skipped ? 'opacity-60' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(s.idNumber)}
                              className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
                              aria-label={`Import ${s.lastName}, ${s.firstName}`}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-secondary text-slate-700">{s.idNumber}</td>
                          <td className="px-3 py-2 text-body font-semibold text-slate-900">
                            {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-secondary text-slate-700">
                            {[s.program, s.year].filter(Boolean).join(' ')}
                          </td>
                          <td className="px-3 py-2 text-secondary text-slate-500">{s.email || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {s.skipped ? (
                              <Tag tone="danger">{s.skipReason || 'Skipped'}</Tag>
                            ) : existing ? (
                              <Tag tone="warn">Update</Tag>
                            ) : (
                              <Tag tone="success">New</Tag>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {busy === 'importing' && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between sm:items-center">
              <span className="text-secondary text-slate-500">
                {selected.size} of {parsed.students.length} selected
              </span>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={busy === 'importing'}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleImport} disabled={busy === 'importing' || selected.size === 0}>
                  <Upload className="h-4 w-4" />
                  {busy === 'importing' ? `Importing… ${progress}%` : `Import ${selected.size} student${selected.size === 1 ? '' : 's'}`}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Result */}
        {result && (
          <section className="rounded-card border border-border-light bg-[#f8fafc] p-4 text-body text-slate-700">
            <p className="font-semibold text-slate-900">Import finished</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{result.added} student{result.added === 1 ? '' : 's'} added</li>
              <li>{result.updated} existing student{result.updated === 1 ? '' : 's'} updated</li>
              {result.scheduleCreated && <li>Class schedule {info.subject} (EDP {info.edpCode}) added to Create Schedule</li>}
              {result.failed.length > 0 && (
                <li className="text-danger">
                  {result.failed.length} failed:
                  <ul className="mt-1 list-disc pl-5">
                    {result.failed.slice(0, 5).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div>
      <dt className="text-label uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

const TAG_TONES = {
  success: 'bg-success-bg text-success-text',
  warn: 'bg-[#fffbeb] text-[#b45309]',
  danger: 'bg-[#fff1f2] text-[#be123c]',
};

function Tag({ tone = 'success', children }) {
  return (
    <span className={`inline-flex rounded-btn px-2 py-0.5 text-label font-semibold ${TAG_TONES[tone]}`}>{children}</span>
  );
}
