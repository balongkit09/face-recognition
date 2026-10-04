import { signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, provisioningAuth } from './config';
import { resolveCredentials } from './bootstrap';
import { notify } from './notifications';

export const PASSWORD_RESETS_COLLECTION = 'passwordResets';

/**
 * Submitted from the login page by someone who is NOT signed in.
 * Faculty accounts use ID-number logins (no mailbox), so a reset cannot be
 * e-mailed; instead the request is queued for an administrator to approve.
 */
export async function requestPasswordReset({ username, email, newPassword }) {
  const raw = String(username || '').trim();
  const { kind } = resolveCredentials(raw, newPassword);
  if (kind === 'admin') {
    const err = new Error(
      'The administrator account cannot be reset from here. Sign in and change it in Settings, or delete the admin user in Firebase Authentication and sign in again with admin / admin to re-create it.',
    );
    err.code = 'reset/admin';
    throw err;
  }
  const ref = await addDoc(collection(db, PASSWORD_RESETS_COLLECTION), {
    username: raw,
    email: String(email || '').trim().toLowerCase(),
    newPassword,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Admin side: apply a pending request to the matching faculty record.
 * Signs in on the isolated provisioning auth with the password currently on
 * file, sets the requested password, and syncs the faculty document.
 */
export async function approvePasswordReset(request, member) {
  if (!member) throw new Error('No faculty record matches this ID number.');
  const requestEmail = String(request.email || '').trim().toLowerCase();
  const memberEmail = String(member.email || '').trim().toLowerCase();
  if (requestEmail && memberEmail && requestEmail !== memberEmail) {
    throw new Error('The e-mail on this request does not match the faculty record.');
  }
  if (!member.loginEmail || !member.password) {
    throw new Error(`${member.name} has no portal login yet. Create the login first.`);
  }
  let credential;
  try {
    credential = await signInWithEmailAndPassword(provisioningAuth, member.loginEmail, member.password);
  } catch (err) {
    const code = String(err?.code || '');
    if (code.includes('invalid-credential') || code.includes('wrong-password')) {
      throw new Error(
        'The password on file does not match the account, so it cannot be reset automatically. Ask the faculty member to sign in and change it in Settings.',
      );
    }
    throw err;
  }
  try {
    await updatePassword(credential.user, request.newPassword);
  } finally {
    await signOut(provisioningAuth).catch(() => {});
  }
  await updateDoc(doc(db, 'faculty', member.id), {
    password: request.newPassword,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, PASSWORD_RESETS_COLLECTION, request.id), {
    status: 'approved',
    facultyId: member.id,
    newPassword: '',
    resolvedAt: serverTimestamp(),
  });
  notify({
    type: 'account',
    entity: 'faculty',
    title: `Password reset approved for ${member.name}`,
    message: `ID ${member.idNumber} · the faculty member can sign in with their new password`,
    meta: { facultyId: member.id, requestId: request.id },
    audience: 'admin',
  });
  if (member.authUid) {
    notify({
      type: 'account',
      entity: 'account',
      title: 'Your password reset was approved',
      message: 'Sign in with the new password you submitted.',
      meta: { facultyId: member.id, requestId: request.id },
      audience: 'faculty',
      targetUid: member.authUid,
    });
  }
}

export async function rejectPasswordReset(request) {
  await updateDoc(doc(db, PASSWORD_RESETS_COLLECTION, request.id), {
    status: 'rejected',
    newPassword: '',
    resolvedAt: serverTimestamp(),
  });
  notify({
    type: 'account',
    entity: 'faculty',
    title: `Password reset rejected for ID ${request.username}`,
    message: request.email ? `Requested with e-mail ${request.email}` : '',
    meta: { requestId: request.id },
    audience: 'admin',
  });
}
