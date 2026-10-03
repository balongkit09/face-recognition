import { useRef, useState } from 'react';
import { Upload, Download } from 'lucide-react';
import Button from '../common/Button';
import { notify } from '../../firebase/notifications';

const HEADERS = ['name', 'idNumber', 'program', 'email', 'username', 'password'];

function escapeCsv(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    return {
      name: row.name || row.Name || row['Full Name'] || '',
      idNumber: row.idNumber || row['ID Number'] || '',
      program: row.program || row.Program || '',
      email: row.email || row.Email || '',
    };
  });
}

export default function ImportExportButtons({ faculty = [], addFaculty }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(null);

  const handleExport = () => {
    setBusy('export');
    try {
      const lines = [HEADERS.join(',')];
      faculty.forEach((row) => {
        lines.push(HEADERS.map((h) => escapeCsv(row[h])).join(','));
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faculty-roster-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !addFaculty) return;
    setBusy('import');
    try {
      const text = await file.text();
      const rows = text.trim().startsWith('[') ? JSON.parse(text) : parseCsv(text);
      let imported = 0;
      const errors = [];
      for (const row of rows) {
        try {
          await addFaculty(row, { silent: true });
          imported += 1;
        } catch (err) {
          errors.push(err.message);
        }
      }
      notify({
        type: 'import',
        entity: 'faculty',
        title: `Faculty roster imported (${imported})`,
        message: errors.length ? `${errors.length} row(s) failed` : `${imported} faculty added with generated logins`,
      });
      if (errors.length) {
        alert(`Imported ${imported}. ${errors.length} error(s):\n${errors.slice(0, 5).join('\n')}`);
      } else {
        alert(`Imported ${imported} faculty record(s).`);
      }
    } catch (err) {
      alert(err.message || 'Import failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busy === 'import'}>
        <Upload className="h-4 w-4" />
        {busy === 'import' ? 'Importing…' : 'Import Faculty'}
      </Button>
      <Button variant="outline" onClick={handleExport} disabled={busy === 'export'}>
        <Download className="h-4 w-4" />
        {busy === 'export' ? 'Exporting…' : 'Export Roster'}
      </Button>
    </>
  );
}
