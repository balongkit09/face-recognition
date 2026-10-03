const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { admin, db, assertAdmin } = require('../utils/adminAuth');

const CONFIDENCE_THRESHOLD = 0.85;

// EDIT HERE for face-match confidence handling, campus-status update logic
exports.faceMatch = onCall(async (request) => {
  await assertAdmin(request);

  const {
    personType = 'faculty',
    personId,
    confidence,
    deviceId,
    location,
  } = request.data || {};

  if (!personId || typeof personId !== 'string') {
    throw new HttpsError('invalid-argument', 'personId is required');
  }
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new HttpsError('invalid-argument', 'confidence must be a number between 0 and 1');
  }

  const collectionName = personType === 'student' ? 'students' : 'faculty';
  const personRef = db.collection(collectionName).doc(personId);
  const personSnap = await personRef.get();

  if (!personSnap.exists) {
    throw new HttpsError('not-found', 'Person not found');
  }

  const matched = confidence >= CONFIDENCE_THRESHOLD;
  const statusUpdate = matched ? 'On Campus' : personSnap.data().status;

  if (matched && personType === 'faculty') {
    await personRef.update({
      status: statusUpdate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  const eventRef = db.collection('monitoringEvents').doc();
  await eventRef.set({
    type: 'face_match',
    personType,
    personId,
    confidence,
    matched,
    deviceId: deviceId || null,
    location: location || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // FACE_API_KEY / FACE_API_URL from functions/.env can be wired here for external verification.

  return {
    matched,
    confidence,
    status: statusUpdate,
    eventId: eventRef.id,
  };
});
