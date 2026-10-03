import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'face-recognition-f0aad';
const AUTH_DOMAIN = `${PROJECT_ID}.firebaseapp.com`;

export const ADMIN_EMAIL = `admin@${AUTH_DOMAIN}`;
/** Firebase requires 6+ characters. The login form still accepts "admin". */
export const ADMIN_FIREBASE_PASSWORD = 'admin!';

/** Faculty accounts sign in with their ID number; the Auth email is derived from it. */
export const FACULTY_PASSWORD_PREFIX = 'UCMN-';

export function facultyLoginEmail(idNumber) {
  const id = String(idNumber || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `faculty-${id}@${AUTH_DOMAIN}`;
}

/** Generated faculty password: "UCMN-" + ID number, e.g. UCMN-121515 */
export function facultyPassword(idNumber) {
  return `${FACULTY_PASSWORD_PREFIX}${String(idNumber || '').trim()}`;
}

export function resolveCredentials(username, password) {
  const raw = String(username || '').trim();
  const name = raw.toLowerCase();
  const isBootstrap =
    name === 'admin' ||
    name === ADMIN_EMAIL ||
    name === 'admin@local' ||
    name === 'admin@attendancems.app';
  if (isBootstrap) {
    return {
      email: ADMIN_EMAIL,
      password: password === 'admin' ? ADMIN_FIREBASE_PASSWORD : password,
      isBootstrap: true,
      kind: 'admin',
    };
  }
  if (raw.includes('@')) {
    return { email: raw, password, isBootstrap: false, kind: 'email' };
  }
  // Anything else is treated as a faculty ID number.
  return { email: facultyLoginEmail(raw), password, isBootstrap: false, kind: 'faculty' };
}

export async function signInUser(username, password) {
  const { email, password: firebasePassword, isBootstrap } =
    resolveCredentials(username, password);

  try {
    return await signInWithEmailAndPassword(auth, email, firebasePassword);
  } catch (err) {
    if (!isBootstrap) throw err;
    try {
      const created = await createUserWithEmailAndPassword(
        auth,
        email,
        firebasePassword,
      );
      await updateProfile(created.user, { displayName: 'Admin' });
      return created;
    } catch (createErr) {
      if (String(createErr?.code || '').includes('email-already-in-use')) {
        return signInWithEmailAndPassword(auth, email, firebasePassword);
      }
      throw createErr;
    }
  }
}

/** Backwards compatible alias. */
export const signInOrCreateAdmin = signInUser;

export function isBootstrapAdminUser(user) {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
}

export async function ensureAdminProfile(user) {
  await setDoc(
    doc(db, 'admins', user.uid),
    {
      email: user.email || ADMIN_EMAIL,
      displayName: user.displayName || 'Admin',
      role: 'admin',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
