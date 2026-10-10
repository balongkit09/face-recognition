import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { STUDENT_MESSAGES_COLLECTION } from '../firebase/studentMessages';
import { useAuth } from './useAuth';

export function useStudentMessages() {
  const { role, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!role || !user?.uid) {
      setLoading(Boolean(role === undefined || !user));
      return undefined;
    }
    const source =
      role === 'faculty'
        ? query(collection(db, STUDENT_MESSAGES_COLLECTION), where('actorUid', '==', user.uid))
        : collection(db, STUDENT_MESSAGES_COLLECTION);
    const unsubscribe = onSnapshot(
      source,
      (snapshot) => {
        const rows = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            };
          })
          .filter((m) => (role === 'faculty' ? m.actorUid === user?.uid : true))
          .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setMessages(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [role, user?.uid]);

  return { messages, loading, error };
}
