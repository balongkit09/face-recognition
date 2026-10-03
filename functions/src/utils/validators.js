const VALID_STATUSES = ['On Campus', 'Teaching', 'Off Campus'];

function requireString(value, fieldName, maxLen = 500) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    throw new Error(`${fieldName} is too long`);
  }
  return trimmed;
}

function validateFacultyRecord(raw, indexLabel = '') {
  const prefix = indexLabel ? `${indexLabel}: ` : '';
  const record = {
    name: requireString(raw.name, `${prefix}name`),
    role: requireString(raw.role, `${prefix}role`),
    email: requireString(raw.email, `${prefix}email`),
    idNumber: requireString(raw.idNumber, `${prefix}idNumber`, 64),
    department: requireString(raw.department, `${prefix}department`),
    office: requireString(raw.office, `${prefix}office`, 128),
    status: requireString(raw.status || 'Off Campus', `${prefix}status`),
  };

  if (!VALID_STATUSES.includes(record.status)) {
    throw new Error(`${prefix}status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    throw new Error(`${prefix}email is invalid`);
  }

  return record;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function normalizeImportRow(row) {
  const map = {
    name: row.name ?? row.Name,
    role: row.role ?? row.Role,
    email: row.email ?? row.Email,
    idNumber: row.idNumber ?? row.id_number ?? row['ID Number'],
    department: row.department ?? row.Department,
    office: row.office ?? row.Office,
    status: row.status ?? row.Status ?? 'Off Campus',
  };
  return map;
}

module.exports = {
  VALID_STATUSES,
  validateFacultyRecord,
  parseCsv,
  normalizeImportRow,
};
