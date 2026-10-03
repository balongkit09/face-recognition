import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import ScheduleTable from '../components/schedules/ScheduleTable';
import ScheduleFormModal from '../components/schedules/ScheduleFormModal';
import { useConfirm } from '../components/common/ConfirmDialog';
import { useSchedules } from '../hooks/useSchedules';
import { useFaculty } from '../hooks/useFaculty';

const CSV_HEADERS = [
  'code',
  'subject',
  'teacher',
  'type',
  'startTime',
  'endTime',
  'days',
  'room',
  'section',
  'term',
  'enrolled',
  'status',
];

function escapeCsv(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/\s+/g, '').toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    return {
      code: row.code || '',
      subject: row.subject || '',
      teacher: row.teacher || '',
      type: row.type || 'Lec',
      startTime: row.starttime || row.start || '',
      endTime: row.endtime || row.end || '',
      days: row.days || '',
      room: row.room || '',
      section: row.section || '',
      term: row.term || '',
      enrolled: row.enrolled || row.num || row.students || 0,
      status: row.status || 'Open',
    };
  });
}

export default function CreateSchedulePage() {
  const { search = '' } = useOutletContext() || {};
  const { schedules, loading, error, addSchedule, updateSchedule, deleteSchedule } =
    useSchedules();
  const { faculty } = useFaculty();
  const { confirm, dialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (schedule) => {
    setEditing(schedule);
    setModalOpen(true);
  };

  const handleDelete = (schedule) =>
    confirm({
      title: 'Delete schedule',
      message: (
        <>
          Delete <strong>{schedule.code || schedule.subject}</strong>
          {schedule.section ? ` (${schedule.section})` : ''}
          {schedule.edpCode ? ` · EDP ${schedule.edpCode}` : ''}? This cannot be undone.
        </>
      ),
      onConfirm: () => deleteSchedule(schedule.id),
    });

  const handleSubmit = async (form) => {
    if (editing) {
      await updateSchedule(editing.id, form);
    } else {
      await addSchedule(form);
    }
  };

  const handleExport = () => {
    const lines = [CSV_HEADERS.join(',')];
    schedules.forEach((row) => {
      lines.push(CSV_HEADERS.map((h) => escapeCsv(row[h])).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedules-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file) => {
    try {
      const rows = parseCsv(await file.text());
      let imported = 0;
      const errors = [];
      for (const row of rows) {
        try {
          // Link the teacher to a registered faculty member when the name matches.
          const member = faculty.find(
            (f) => f.name.trim().toLowerCase() === row.teacher.trim().toLowerCase(),
          );
          await addSchedule({ ...row, teacherId: member ? member.id : '' });
          imported += 1;
        } catch (err) {
          errors.push(err.message);
        }
      }
      if (errors.length) {
        alert(`Imported ${imported}. ${errors.length} error(s):\n${errors.slice(0, 5).join('\n')}`);
      } else {
        alert(`Imported ${imported} schedule(s).`);
      }
    } catch (err) {
      alert(err.message || 'Import failed');
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbSection="OPERATIONS"
        breadcrumbPage="SCHEDULES"
        title="Create Schedule"
        description="Build class and monitoring schedules tied to departments and rooms."
      />

      {error && (
        <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>
      )}

      <ScheduleTable
        schedules={schedules}
        loading={loading}
        globalSearch={search}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
      />

      <ScheduleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        faculty={faculty}
        mode={editing ? 'edit' : 'add'}
      />
      {dialog}
    </>
  );
}
