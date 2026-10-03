import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, provisioningAuth } from './config';
import { facultyLoginEmail, facultyPassword } from './bootstrap';

/**
 * Create (or look up) the Firebase Auth account for a faculty member and
 * register their role in `users/{uid}`. Runs on the isolated provisioning
 * auth instance so the admin stays signed in.
 *
 * Returns { uid, email, username, password }.
 */
export async function provisionFacultyAccount({ facultyId, idNumber, name, email }) {
  const loginEmail = facultyLoginEmail(idNumber);
  const password = facultyPassword(idNumber);

  let credential;
  try {
    credential = await createUserWithEmailAndPassword(provisioningAuth, loginEmail, password);
    await updateProfile(credential.user, { displayName: name || idNumber });
  } catch (err) {
    if (String(err?.code || '').includes('email-already-in-use')) {
      // Account exists from a previous save – sign in to recover its uid.
      credential = await signInWithEmailAndPassword(provisioningAuth, loginEmail, password);
    } else {
      throw err;
    }
  }

  const uid = credential.user.uid;
  try {
    await signOut(provisioningAuth);
  } catch {
    /* ignore */
  }

  // Role document (written by the signed-in admin on the main app).
  await setDoc(
    doc(db, 'users', uid),
    {
      role: 'faculty',
      facultyId,
      idNumber: String(idNumber),
      name: name || '',
      email: email || '',
      loginEmail,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { uid, email: loginEmail, username: String(idNumber), password };
}

/** Remove the role document so the account can no longer access the system. */
export async function revokeFacultyAccount(uid) {
  if (!uid) return;
  await deleteDoc(doc(db, 'users', uid));
}
