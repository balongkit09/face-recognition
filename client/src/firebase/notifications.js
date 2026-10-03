import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Record a system notification. Fire-and-forget: failures are logged, never thrown,
 * so a notification problem can never block the action that triggered it.
 *
 * @param {object} n
 * @param {'add'|'update'|'delete'|'import'|'info'} n.type
 * @param {'faculty'|'student'|'schedule'|'account'|'system'} n.entity
 * @param {string} n.title
 * @param {string} [n.message]
 * @param {object} [n.meta]
 */
export async function notify({ type, entity, title, message = '', meta = {} }) {
  const user = auth.currentUser;
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      type,
      entity,
      title,
      message,
      meta,
      actorUid: user?.uid || '',
      actorName: user?.displayName || user?.email?.split('@')[0] || 'System',
      readBy: [],
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('notify failed:', err.message);
  }
}
