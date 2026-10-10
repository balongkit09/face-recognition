import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FACE_ENROLL_COLLECTION } from '../firebase/faceEnrollRequests';
import { useAuth } from './useAuth';

export function useFaceEnrollRequests({ pendingOnly = true } = {}) {
  const { role, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!role || !user?.uid) {
      setLoading(Boolean(role === undefined || !user));
      return undefined;
    }
    const source =
      role === 'faculty'
        ? query(collection(db, FACE_ENROLL_COLLECTION), where('actorUid', '==', user.uid))
        : collection(db, FACE_ENROLL_COLLECTION);
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
          .filter((r) => {
            if (pendingOnly && r.status !== 'pending') return false;
            if (role === 'faculty') return r.actorUid === user?.uid;
            return true;
          })
          .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setRequests(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [pendingOnly, role, user?.uid]);

  return { requests, loading, error };
}
