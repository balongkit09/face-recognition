/**
 * Parser for the university "OFFICIAL CLASS LIST" exports.
 *
 * Two layouts are accepted:
 *
 *  PDF (text extracted line by line)
 *    UNIVERSITY OF CEBU - MAIN 1ST SEM. SY 2026-2027 OFFICIAL CLASS LIST
 *    SUBJECT: 18366 EE 415 LAB 5:01 - 8:01 PM TTH K504 (2 UNITS)
 *    DESCRIPTION: ...
 *    SEQ# STUDENT # STUDENT NAME PROGRAM YR. REMARKS E-MAIL VAX STAT
 *    1. 22630529 ABELLA JAYMAR C BSEE 4 jaymar.abella22@gmail.com FULL-VAX
 *
 *  Excel / tab separated export
 *    OFFICIAL CLASS LIST | 1ST SEM. SY 2026-2027
 *    18366 | EE 415
 *    SEQ# | STUDENT # | LASTNAME | FIRSTNAME | MIDDLE | PROGRAM YR. | REMARKS | E-MAIL
 *    1. | '22630529 | ABELLA | JAYMAR | C | BSEE 4 |  | jaymar.abella22@gmail.com
 *
 * Anything else is rejected with a descriptive error.
 */

export class ClassListFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClassListFormatError';
  }
}

const NAME_PARTICLES = new Set(['DE', 'DEL', 'DELA', 'DELOS', 'DELAS', 'LA', 'SAN', 'STA', 'STO', 'VAN', 'VON', 'MC', 'MAC']);
const NAME_SUFFIXES = new Set(['JR', 'JR.', 'SR', 'SR.', 'II', 'III', 'IV', 'V']);
const VAX_TOKENS = new Set(['FULL-VAX', '1ST-DOSE', '-']);
const SKIP_REMARKS = /WITHDRAWN|DROPPED|DROP|CANCELLED|CANCELED/i;

const DAY_MAP = {
  M: 'Mon',
  T: 'Tue',
  W: 'Wed',
  TH: 'Thu',
  F: 'Fri',
  S: 'Sat',
  SAT: 'Sat',
  MW: 'M-W',
  MWF: 'M-W-F',
  TTH: 'T-TH',
  TF: 'T-F',
  MTWTHF: 'Daily',
  MTWTHFS: 'Daily',
  DAILY: 'Daily',
};

function clean(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value) {
  return clean(value)
    .toLowerCase()
    .replace(/(^|[\s\-'.])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase())
    // Keep generational suffixes as written: II, III, IV
    .replace(/\b(Ii|Iii|Iv)\b/g, (m) => m.toUpperCase());
}

function normalizeStudentNumber(value) {
  return clean(value).replace(/^'+/, '').replace(/\D/g, '');
}

function normalizeTerm(raw) {
  // "1ST SEM. SY 2026-2027" -> "1st Sem, S.Y. 2026-2027"
  const m = clean(raw).match(/(\d)(ST|ND|RD|TH)\s*SEM\.?\s*(?:SY|S\.Y\.)?\s*(\d{4})\s*-\s*(\d{4})/i);
  if (!m) return clean(raw);
  return `${m[1]}${m[2].toLowerCase()} Sem, S.Y. ${m[3]}-${m[4]}`;
}

function normalizeDays(raw) {
  const key = clean(raw).toUpperCase().replace(/[^A-Z]/g, '');
  return DAY_MAP[key] || clean(raw).toUpperCase();
}

function to24h(hour, minute, meridiem) {
  let h = Number(hour);
  const m = Number(minute);
  const mer = (meridiem || '').toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "5:01 - 8:01 PM" / "11:30 - 1:00 PM" / "7:30 AM - 9:00 AM" -> { startTime, endTime } in 24h */
export function parseTimeRange(raw) {
  const m = clean(raw).match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
  );
  if (!m) return { startTime: '', endTime: '' };
  const [, sh, sm, sMer, eh, em, eMer] = m;
  const endMer = (eMer || sMer || 'AM').toUpperCase();
  let startMer = (sMer || '').toUpperCase();
  if (!startMer) {
    // Only one meridiem given: when the start hour is "later" than the end
    // hour on a 12h clock, the class crosses noon (e.g. 11:30 - 1:00 PM).
    const s12 = Number(sh) % 12;
    const e12 = Number(eh) % 12;
    startMer = endMer === 'PM' && s12 > e12 ? 'AM' : endMer;
  }
  return {
    startTime: to24h(sh, sm, startMer),
    endTime: to24h(eh, em, endMer),
  };
}

/**
 * Split "ABELLA JAYMAR C" / "DELA CALZADA LUIS REY O" / "TAGOD III ARTEMIO M"
 * into last / first / middle. The PDF prints LAST FIRST MIDDLE-INITIAL.
 */
export function splitPdfName(raw) {
  const tokens = clean(raw).split(' ').filter(Boolean);
  if (tokens.length === 0) return { lastName: '', firstName: '', middleName: '' };
  if (tokens.length === 1) return { lastName: tokens[0], firstName: '', middleName: '' };

  let lastParts = [tokens.shift()];
  // Multi-word surnames: "DELA CALZADA", "DEL ROSARIO", "DELOS SANTOS", "DE LA CRUZ"
  while (tokens.length > 1 && NAME_PARTICLES.has(lastParts[lastParts.length - 1])) {
    lastParts.push(tokens.shift());
  }
  // Suffix attached to the surname: "TAGOD III"
  if (tokens.length > 1 && NAME_SUFFIXES.has(tokens[0])) {
    lastParts.push(tokens.shift());
  }

  let middleName = '';
  const last = tokens[tokens.length - 1];
  if (tokens.length > 1 && /^[A-ZÑ]\.?$/i.test(last)) {
    middleName = tokens.pop().replace('.', '');
  }

  return {
    lastName: lastParts.join(' '),
    firstName: tokens.join(' '),
    middleName,
  };
}

function parseProgramYear(raw) {
  const m = clean(raw).match(/^([A-Z][A-Z\-\/&.]*)\s*(\d{1,2})?$/i);
  if (!m) return { program: clean(raw).toUpperCase(), year: '' };
  return { program: m[1].toUpperCase(), year: m[2] || '' };
}

function makeStudent({ studentNumber, lastName, firstName, middleName, program, year, email, remarks, edpCode }) {
  const skipped = SKIP_REMARKS.test(remarks || '');
  return {
    idNumber: studentNumber,
    firstName: titleCase(firstName),
    middleName: titleCase(middleName),
    lastName: titleCase(lastName),
    program,
    year,
    email: clean(email).toLowerCase(),
    remarks: clean(remarks),
    edpCode,
    skipped,
    skipReason: skipped ? clean(remarks) : '',
  };
}

/** Parse the "SUBJECT: 18366 EE 415 LAB 5:01 - 8:01 PM TTH K504 (2 UNITS)" header line. */
export function parseSubjectLine(line) {
  const body = clean(line).replace(/^SUBJECT:\s*/i, '');
  const m = body.match(
    /^(\d{4,6})\s+(.+?)\s+(LEC|LAB|LECTURE|LABORATORY)\b\s*(.*?)\s*(?:\((\d+(?:\.\d+)?)\s*UNITS?\))?$/i,
  );
  if (!m) {
    // Minimal header: "18366 EE 415"
    const simple = body.match(/^(\d{4,6})\s+(.+)$/);
    if (!simple) return null;
    return { edpCode: simple[1], subject: clean(simple[2]), type: '', startTime: '', endTime: '', days: '', room: '', units: '' };
  }
  const [, edpCode, subject, typeRaw, rest, units] = m;
  const type = typeRaw.toUpperCase().startsWith('LAB') ? 'Lab' : 'Lec';
  const { startTime, endTime } = parseTimeRange(rest);
  // After the time range: DAYS ROOM
  const tail = clean(rest.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i, ''));
  const tailTokens = tail.split(' ').filter(Boolean);
  const days = tailTokens.length ? normalizeDays(tailTokens[0]) : '';
  const room = tailTokens.slice(1).join(' ');
  return { edpCode, subject: clean(subject), type, startTime, endTime, days, room, units: units || '' };
}

/* -------------------------------------------------------------------------- */
/*  PDF (array of text lines)                                                 */
/* -------------------------------------------------------------------------- */

export function parsePdfLines(lines) {
  const text = lines.map(clean);
  const isClassList = text.some((l) => /OFFICIAL\s+CLASS\s+LIST/i.test(l));
  const subjectLine = text.find((l) => /^SUBJECT:/i.test(l));
  if (!isClassList || !subjectLine) {
    throw new ClassListFormatError(
      'This PDF is not an official class list. It must contain the "OFFICIAL CLASS LIST" heading and a "SUBJECT:" line (EDP code, subject, type, time, days, room).',
    );
  }

  const header = parseSubjectLine(subjectLine);
  if (!header) {
    throw new ClassListFormatError('Could not read the SUBJECT line (expected: EDP code, subject, LEC/LAB, time, days, room).');
  }
  const descLine = text.find((l) => /^DESCRIPTION:/i.test(l));
  const termLine = text.find((l) => /\d(ST|ND|RD|TH)\s*SEM/i.test(l)) || '';
  const classInfo = {
    ...header,
    description: descLine ? clean(descLine.replace(/^DESCRIPTION:\s*/i, '')) : '',
    term: normalizeTerm(termLine),
    source: 'pdf',
  };

  const students = [];
  for (const line of text) {
    const m = line.match(/^(\d{1,3})\.\s+(\d{6,})\s+(.*)$/);
    if (!m) continue;
    let tokens = m[3].split(' ').filter(Boolean);
    tokens = tokens.filter((t) => t !== '**');

    let vax = '';
    if (tokens.length && VAX_TOKENS.has(tokens[tokens.length - 1])) vax = tokens.pop();
    let email = '';
    const emailIdx = tokens.findIndex((t) => t.includes('@'));
    if (emailIdx >= 0) email = tokens.splice(emailIdx, 1)[0];

    // Find the year token: a 1–2 digit number preceded by the program code.
    let yearIdx = -1;
    for (let i = tokens.length - 1; i >= 1; i -= 1) {
      if (/^\d{1,2}$/.test(tokens[i]) && /^[A-Z]{2,}[A-Z\-\/&.]*$/i.test(tokens[i - 1])) {
        yearIdx = i;
        break;
      }
    }
    let nameTokens;
    let program = '';
    let year = '';
    let remarks = '';
    if (yearIdx > 0) {
      program = tokens[yearIdx - 1].toUpperCase();
      year = tokens[yearIdx];
      nameTokens = tokens.slice(0, yearIdx - 1);
      remarks = tokens.slice(yearIdx + 1).join(' ');
    } else {
      nameTokens = tokens;
    }

    const name = splitPdfName(nameTokens.join(' '));
    students.push(
      makeStudent({
        studentNumber: m[2],
        ...name,
        program,
        year,
        email,
        remarks,
        edpCode: classInfo.edpCode,
        vax,
      }),
    );
  }

  if (students.length === 0) {
    throw new ClassListFormatError('No student rows were found in this class list.');
  }

  return { classInfo, students };
}

/* -------------------------------------------------------------------------- */
/*  Excel / TSV (array of row arrays)                                         */
/* -------------------------------------------------------------------------- */

function findHeaderRow(rows) {
  return rows.findIndex((row) => {
    const joined = row.map((c) => clean(c).toUpperCase()).join('|');
    return joined.includes('STUDENT') && (joined.includes('LASTNAME') || joined.includes('STUDENT NAME') || joined.includes('NAME'));
  });
}

export function parseSheetRows(rows) {
  const cells = rows.map((row) => (Array.isArray(row) ? row.map(clean) : []));
  const isClassList = cells.some((row) => /OFFICIAL\s+CLASS\s+LIST/i.test(row.join(' ')));
  const headerIdx = findHeaderRow(cells);
  if (!isClassList || headerIdx < 0) {
    throw new ClassListFormatError(
      'This spreadsheet is not an official class list. It must contain the "OFFICIAL CLASS LIST" heading, the EDP code and subject, and a SEQ# / STUDENT # / LASTNAME / FIRSTNAME / MIDDLE / PROGRAM YR. / REMARKS / E-MAIL header row.',
    );
  }

  // Class info lives in the rows above the header.
  let classInfo = { edpCode: '', subject: '', type: '', startTime: '', endTime: '', days: '', room: '', units: '', description: '', term: '', source: 'sheet' };
  for (const row of cells.slice(0, headerIdx)) {
    const joined = row.filter(Boolean).join(' ');
    const term = joined.match(/\d(ST|ND|RD|TH)\s*SEM\.?\s*(SY|S\.Y\.)?\s*\d{4}\s*-\s*\d{4}/i);
    if (term) classInfo.term = normalizeTerm(term[0]);
    const subj = /^SUBJECT:/i.test(joined) ? parseSubjectLine(joined) : null;
    if (subj) {
      classInfo = { ...classInfo, ...subj };
      continue;
    }
    const nonEmpty = row.filter(Boolean);
    if (nonEmpty.length >= 2 && /^\d{4,6}$/.test(nonEmpty[0])) {
      const parsed = parseSubjectLine(nonEmpty.join(' '));
      if (parsed) classInfo = { ...classInfo, ...parsed };
    }
    if (/^DESCRIPTION:/i.test(joined)) {
      classInfo.description = clean(joined.replace(/^DESCRIPTION:\s*/i, ''));
    }
  }
  if (!classInfo.edpCode) {
    throw new ClassListFormatError('Could not find the EDP code and subject above the student list.');
  }

  const header = cells[headerIdx].map((c) => c.toUpperCase().replace(/[^A-Z#\-]/g, ''));
  const col = (...names) => header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  const cStudent = col('STUDENT#', 'STUDENTNO', 'STUDENT');
  const cLast = col('LASTNAME', 'SURNAME');
  const cFirst = col('FIRSTNAME', 'GIVEN');
  const cMiddle = col('MIDDLE');
  const cName = cLast < 0 ? col('STUDENTNAME', 'NAME') : -1;
  const cProgram = col('PROGRAM', 'COURSE');
  const cRemarks = col('REMARKS');
  const cEmail = col('E-MAIL', 'EMAIL');

  const students = [];
  for (const row of cells.slice(headerIdx + 1)) {
    const studentNumber = normalizeStudentNumber(row[cStudent]);
    if (!/^\d{6,}$/.test(studentNumber)) continue;
    let nameParts;
    if (cLast >= 0) {
      nameParts = {
        lastName: row[cLast] || '',
        firstName: cFirst >= 0 ? row[cFirst] || '' : '',
        middleName: cMiddle >= 0 ? row[cMiddle] || '' : '',
      };
    } else {
      nameParts = splitPdfName(cName >= 0 ? row[cName] : '');
    }
    const { program, year } = parseProgramYear(cProgram >= 0 ? row[cProgram] : '');
    students.push(
      makeStudent({
        studentNumber,
        ...nameParts,
        program,
        year,
        email: cEmail >= 0 ? row[cEmail] : '',
        remarks: cRemarks >= 0 ? row[cRemarks] : '',
        edpCode: classInfo.edpCode,
      }),
    );
  }

  if (students.length === 0) {
    throw new ClassListFormatError('No student rows were found in this class list.');
  }

  return { classInfo, students };
}

/** Tab / comma separated text -> rows */
export function parseDelimitedText(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const delimiter = lines[0] && lines[0].includes('\t') ? '\t' : ',';
  return lines.map((line) => line.split(delimiter));
}

/** Decode bytes as UTF-8, falling back to Windows-1252 (Ñ, accents) when needed. */
export function decodeText(buffer) {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  if (!utf8.includes('\uFFFD')) return utf8;
  try {
    return new TextDecoder('windows-1252').decode(buffer);
  } catch {
    return utf8;
  }
}

/** Build the schedule record that corresponds to a parsed class list. */
export function classInfoToSchedule(classInfo, students) {
  const active = students.filter((s) => !s.skipped);
  const programs = new Map();
  active.forEach((s) => {
    const key = [s.program, s.year].filter(Boolean).join('-');
    if (key) programs.set(key, (programs.get(key) || 0) + 1);
  });
  const section = [...programs.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  return {
    code: classInfo.subject,
    edpCode: classInfo.edpCode,
    subject: classInfo.description || classInfo.subject,
    type: classInfo.type || 'Lec',
    startTime: classInfo.startTime,
    endTime: classInfo.endTime,
    days: classInfo.days,
    room: classInfo.room,
    section,
    term: classInfo.term,
    enrolled: active.length,
    status: 'Open',
    teacher: '',
    teacherId: '',
  };
}
