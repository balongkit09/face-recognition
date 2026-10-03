const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function assertAdmin(context) {
  const { HttpsError } = require('firebase-functions/v2/https');

  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  if (context.auth.token.admin === true) {
    return context.auth.uid;
  }

  const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminDoc.exists) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  return context.auth.uid;
}

module.exports = { admin, db, assertAdmin };
