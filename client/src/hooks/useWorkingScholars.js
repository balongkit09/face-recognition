import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { notify } from '../firebase/notifications';

export const WORKING_SCHOLAR_COLLECTION = 'workingScholar';

export const DESIGNATIONS = [
  { value: 'Office Scholar', label: 'Office Scholar' },
  { value: 'Laboratory Scholar', label: 'Laboratory Scholar' },
];

export function buildScholarName({ firstName, lastName }) {
  return [firstName, lastName]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(' ');
}

function toPayload(data) {
  const firstName = (data.firstName || data.firstname || '').trim();
  const lastName = (data.lastName || data.lastname || '').trim();
  const designation = (data.designation || '').trim();
  return {
    firstName,
    lastName,
    firstname: firstName,
    lastname: lastName,
    name: buildScholarName({ firstName, lastName }),
    idNumber: (data.idNumber || data.idnumber || '').trim(),
    email: (data.email || '').trim(),
    designation,
  };
}

export function useWorkingScholars() {
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, WORKING_SCHOLAR_COLLECTION),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => {
          const data = d.data();
          const firstName = data.firstName || data.firstname || '';
          const lastName = data.lastName || data.lastname || '';
          return {
            id: d.id,
            ...data,
            firstName,
            lastName,
            name: buildScholarName({ firstName, lastName }) || data.name || '',
            idNumber: data.idNumber || data.idnumber || '',
            email: data.email || '',
            designation: data.designation || '',
          };
        });
        rows.sort((a, b) => (a.lastName || a.name || '').localeCompare(b.lastName || b.name || ''));
        setScholars(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const addScholar = useCallback(async (data, { silent = false } = {}) => {
    const payload = toPayload(data);
    const docRef = await addDoc(collection(db, WORKING_SCHOLAR_COLLECTION), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (!silent) {
      notify({
        type: 'add',
        entity: 'workingScholar',
        title: `Working scholar added: ${payload.name}`,
        message: `ID ${payload.idNumber} · ${payload.designation}`,
        meta: { scholarId: docRef.id },
      });
    }
    return docRef.id;
  }, []);

  const updateScholar = useCallback(async (id, data, { silent = false } = {}) => {
    const payload = toPayload(data);
    await updateDoc(doc(db, WORKING_SCHOLAR_COLLECTION, id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    if (!silent) {
      notify({
        type: 'update',
        entity: 'workingScholar',
        title: `Working scholar updated: ${payload.name}`,
        message: `ID ${payload.idNumber} · ${payload.designation}`,
        meta: { scholarId: id },
      });
    }
  }, []);

  const deleteScholar = useCallback(
    async (id, { silent = false } = {}) => {
      const scholar = scholars.find((s) => s.id === id);
      await deleteDoc(doc(db, WORKING_SCHOLAR_COLLECTION, id));
      if (!silent) {
        notify({
          type: 'delete',
          entity: 'workingScholar',
          title: `Working scholar removed: ${scholar?.name || id}`,
          message: scholar ? `ID ${scholar.idNumber} · ${scholar.designation}` : '',
          meta: { scholarId: id },
        });
      }
    },
    [scholars],
  );

  return { scholars, loading, error, addScholar, updateScholar, deleteScholar };
}
