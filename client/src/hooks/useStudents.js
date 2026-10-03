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

const COLLECTION = 'student';

export function buildStudentName({ firstName, middleName, lastName }) {
  return [firstName, middleName, lastName]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(' ');
}

function toPayload(data) {
  const firstName = (data.firstName || '').trim();
  const middleName = (data.middleName || '').trim();
  const lastName = (data.lastName || '').trim();
  return {
    firstName,
    middleName,
    lastName,
    name: buildStudentName({ firstName, middleName, lastName }),
    program: (data.program || '').trim(),
    email: (data.email || '').trim(),
    idNumber: (data.idNumber || '').trim(),
    edpCode: (data.edpCode || '').trim(),
  };
}

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => {
          const data = d.data();
          // Tolerate documents created by hand in the console with lowercase keys.
          const firstName = data.firstName || data.firstname || '';
          const middleName = data.middleName || data.middlename || '';
          const lastName = data.lastName || data.lastname || '';
          return {
            id: d.id,
            ...data,
            firstName,
            middleName,
            lastName,
            // Displayed as "Full Name": first + middle + last.
            name:
              buildStudentName({ firstName, middleName, lastName }) ||
              data.name ||
              data.fullname ||
              '',
            idNumber: data.idNumber || data.idnumber || '',
            edpCode: data.edpCode || data.edpcode || data['EDP code'] || '',
          };
        });
        rows.sort((a, b) =>
          (a.lastName || a.name || '').localeCompare(b.lastName || b.name || ''),
        );
        setStudents(rows);
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

  const addStudent = useCallback(async (data, { silent = false } = {}) => {
    const payload = toPayload(data);
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (!silent) {
      notify({
        type: 'add',
        entity: 'student',
        title: `Student added: ${payload.name}`,
        message: `ID ${payload.idNumber} · ${payload.program}${payload.edpCode ? ` · EDP ${payload.edpCode}` : ''}`,
        meta: { studentId: docRef.id },
      });
    }
    return docRef.id;
  }, []);

  const updateStudent = useCallback(async (id, data, { silent = false } = {}) => {
    const payload = toPayload(data);
    await updateDoc(doc(db, COLLECTION, id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    if (!silent) {
      notify({
        type: 'update',
        entity: 'student',
        title: `Student updated: ${payload.name}`,
        message: `ID ${payload.idNumber} · ${payload.program}`,
        meta: { studentId: id },
      });
    }
  }, []);

  const deleteStudent = useCallback(
    async (id, { silent = false } = {}) => {
      const student = students.find((s) => s.id === id);
      await deleteDoc(doc(db, COLLECTION, id));
      if (!silent) {
        notify({
          type: 'delete',
          entity: 'student',
          title: `Student removed: ${student?.name || id}`,
          message: student ? `ID ${student.idNumber} · ${student.program}` : '',
          meta: { studentId: id },
        });
      }
    },
    [students],
  );

  return { students, loading, error, addStudent, updateStudent, deleteStudent };
}
