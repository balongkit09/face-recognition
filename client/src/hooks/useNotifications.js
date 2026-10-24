import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isVisibleToRole, NOTIFICATIONS_COLLECTION } from '../firebase/notifications';
import { normalizePreferences } from '../firebase/preferences';
import { useAuth } from './useAuth';

export function useNotifications(max = 100) {
  const { user, role, account } = useAuth();
  const uid = user?.uid;
  const preferences = normalizePreferences(account?.preferences);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !role) return undefined;
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
              read: Array.isArray(data.readBy) && data.readBy.includes(uid),
            };
          })
          .filter((n) => isVisibleToRole(n, { role, uid }));
        setNotifications(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [uid, role, max]);

  const visible = preferences.inAppNotifications ? notifications : [];
  const unreadCount = useMemo(() => {
    if (!preferences.inAppNotifications || !preferences.showUnreadBadge) return 0;
    return visible.filter((n) => !n.read).length;
  }, [visible, preferences.inAppNotifications, preferences.showUnreadBadge]);

  const markRead = useCallback(
    async (id) => {
      if (!uid) return;
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { readBy: arrayUnion(uid) });
    },
    [uid],
  );

  const markAllRead = useCallback(async () => {
    if (!uid) return;
    const unread = visible.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, NOTIFICATIONS_COLLECTION, n.id), { readBy: arrayUnion(uid) });
    });
    await batch.commit();
  }, [uid, visible]);

  const removeNotification = useCallback(async (id) => {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
  }, []);

  const removeAllNotifications = useCallback(async () => {
    const ids = visible.map((n) => n.id);
    if (ids.length === 0) return;
    const chunkSize = 400;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const batch = writeBatch(db);
      ids.slice(i, i + chunkSize).forEach((id) => {
        batch.delete(doc(db, NOTIFICATIONS_COLLECTION, id));
      });
      await batch.commit();
    }
  }, [visible]);

  return {
    notifications: visible,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    removeNotification,
    removeAllNotifications,
    preferences,
  };
}

export function formatRelativeTime(date) {
  if (!date) return 'just now';
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}
