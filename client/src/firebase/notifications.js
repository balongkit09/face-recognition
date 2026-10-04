import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Record a system notification. Fire-and-forget: failures are logged, never thrown.
 *
 * audience:
 *  - 'admin'   (default) only administrators see it
 *  - 'faculty' only the faculty member in targetUid (or all faculty if omitted)
 *  - 'all'     both roles
 */
export async function notify({
  type,
  entity,
  title,
  message = '',
  meta = {},
  audience = 'admin',
  targetUid = '',
} = {}) {
  const user = auth.currentUser;
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      type,
      entity,
      title,
      message,
      meta,
      audience,
      targetUid: targetUid || '',
      actorUid: user?.uid || '',
      actorName: user?.displayName || user?.email?.split('@')[0] || 'System',
      readBy: [],
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('notify failed:', err.message);
  }
}

/** Whether a signed-in user should see this notification. */
export function isVisibleToRole(notification, { role, uid }) {
  if (!notification) return false;
  const audience = notification.audience || 'admin';
  if (role === 'admin') {
    return audience === 'admin' || audience === 'all';
  }
  if (role === 'faculty') {
    // Own dashboard activity (enroll / add / delete students, etc.).
    if (uid && notification.actorUid === uid) return true;
    // Messages aimed at this faculty member (e.g. password-reset decision).
    if (audience === 'faculty') {
      if (notification.targetUid && notification.targetUid !== uid) return false;
      return true;
    }
    return false;
  }
  return false;
}
