const { onCall } = require('firebase-functions/v2/https');
const { assertAdmin, db } = require('../utils/adminAuth');

// EDIT HERE for CSV export generation
exports.exportFaculty = onCall(async (request) => {
  await assertAdmin(request);

  const snapshot = await db.collection('faculty').orderBy('name').get();
  const headers = [
    'name',
    'role',
    'email',
    'idNumber',
    'department',
    'office',
    'status',
  ];

  const escape = (value) => {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];
  snapshot.forEach((doc) => {
    const data = doc.data();
    lines.push(headers.map((h) => escape(data[h])).join(','));
  });

  return { csv: lines.join('\n') };
});
