const { onRequest } = require('firebase-functions/v2/https');
const { admin, db } = require('../utils/adminAuth');

// EDIT HERE for incoming camera/device event validation + Firestore write
exports.deviceEventWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const {
    deviceId,
    eventType,
    timestamp,
    payload,
  } = req.body || {};

  if (!deviceId || typeof deviceId !== 'string') {
    res.status(400).json({ error: 'deviceId is required' });
    return;
  }
  if (!eventType || typeof eventType !== 'string') {
    res.status(400).json({ error: 'eventType is required' });
    return;
  }

  const deviceSnap = await db.collection('devices').doc(deviceId).get();
  if (!deviceSnap.exists) {
    res.status(404).json({ error: 'Unknown device' });
    return;
  }

  const eventRef = db.collection('monitoringEvents').doc();
  await eventRef.set({
    deviceId,
    eventType,
    timestamp: timestamp || admin.firestore.FieldValue.serverTimestamp(),
    payload: payload || {},
    receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    processed: false,
  });

  res.status(201).json({ eventId: eventRef.id });
});
