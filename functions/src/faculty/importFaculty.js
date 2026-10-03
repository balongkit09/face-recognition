const { onCall, HttpsError } = require('firebase-functions/v2/https');
const {
  validateFacultyRecord,
  parseCsv,
  normalizeImportRow,
} = require('../utils/validators');
const { admin, db, assertAdmin } = require('../utils/adminAuth');

// EDIT HERE for bulk CSV/JSON import logic
exports.importFaculty = onCall(async (request) => {
  await assertAdmin(request);

  const { format, content } = request.data || {};
  if (!content || typeof content !== 'string') {
    throw new HttpsError('invalid-argument', 'content is required');
  }

  let rawRows;
  if (format === 'json') {
    try {
      rawRows = JSON.parse(content);
    } catch {
      throw new HttpsError('invalid-argument', 'Invalid JSON');
    }
    if (!Array.isArray(rawRows)) {
      throw new HttpsError('invalid-argument', 'JSON must be an array of faculty objects');
    }
  } else {
    try {
      rawRows = parseCsv(content).map(normalizeImportRow);
    } catch (err) {
      throw new HttpsError('invalid-argument', err.message);
    }
  }

  let imported = 0;
  const errors = [];
  const batchSize = 400;
  let batch = db.batch();
  let batchCount = 0;
  const { FieldValue } = admin.firestore;

  for (let i = 0; i < rawRows.length; i += 1) {
    try {
      const validated = validateFacultyRecord(
        normalizeImportRow(rawRows[i]),
        `Row ${i + 1}`,
      );
      const ref = db.collection('faculty').doc();
      batch.set(ref, {
        ...validated,
        facePhotoUrl: '',
        faceRegisteredAt: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchCount += 1;
      imported += 1;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { imported, errors };
});
