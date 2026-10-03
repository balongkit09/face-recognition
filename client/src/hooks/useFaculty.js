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
import { facultyLoginEmail, facultyPassword } from '../firebase/bootstrap';
import { provisionFacultyAccount, revokeFacultyAccount } from '../firebase/facultyAccounts';
import { notify } from '../firebase/notifications';

const COLLECTION = 'faculty';

function toPayload(data) {
  const idNumber = (data.idNumber || '').trim();
  return {
    name: (data.name || '').trim(),
    idNumber,
    program: (data.program || '').trim(),
    email: (data.email || '').trim(),
    // Login credentials generated from the ID number.
    username: idNumber,
    password: facultyPassword(idNumber),
    loginEmail: facultyLoginEmail(idNumber),
  };
}

/**
 * Create the Firebase Auth account for a faculty document and store the uid on it.
 * Any failure is reported back (not thrown) so the faculty record itself is kept.
 */
async function provisionLogin(facultyId, payload, previousUid) {
  const account = await provisionFacultyAccount({
    facultyId,
    idNumber: payload.idNumber,
    name: payload.name,
    email: payload.email,
  });
  if (previousUid && previousUid !== account.uid) {
    // ID number changed -> a new account was created; revoke the old one.
    await revokeFacultyAccount(previousUid).catch(() => {});
  }
  await updateDoc(doc(db, COLLECTION, facultyId), {
    authUid: account.uid,
    loginEmail: account.email,
    username: account.username,
    password: account.password,
  });
  return account;
}

export function useFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => {
          const data = d.data();
          const idNumber = data.idNumber || data.idnumber || '';
          return {
            id: d.id,
            ...data,
            // Tolerate documents created by hand in the console with lowercase keys.
            name: data.name || data.fullname || data.fullName || '',
            idNumber,
            username: data.username || idNumber,
            password: data.password || (idNumber ? facultyPassword(idNumber) : ''),
          };
        });
        rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setFaculty(rows);
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

  const addFaculty = useCallback(async (data, { silent = false } = {}) => {
    const payload = toPayload(data);
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...payload,
      dateRegistered: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    let accountError = null;
    try {
      await provisionLogin(docRef.id, payload, null);
    } catch (err) {
      accountError = err;
    }
    if (!silent) {
      notify({
        type: 'add',
        entity: 'faculty',
        title: `Faculty added: ${payload.name}`,
        message: `ID ${payload.idNumber} · ${payload.program}${
          accountError ? ' · login account NOT created' : ` · login ${payload.username} / ${payload.password}`
        }`,
        meta: { facultyId: docRef.id },
      });
    }
    if (accountError) {
      const err = new Error(
        `${payload.name} was saved, but the login account could not be created: ${accountError.message}`,
      );
      err.code = 'faculty/account-failed';
      err.facultyId = docRef.id;
      throw err;
    }
    return docRef.id;
  }, []);

  const updateFaculty = useCallback(
    async (id, data, { silent = false } = {}) => {
      const payload = toPayload(data);
      const previous = faculty.find((f) => f.id === id);
      const idChanged = previous && previous.idNumber !== payload.idNumber;
      if (previous?.authUid && !idChanged && previous.password) {
        // Keep whatever password the account currently uses (faculty may have changed it).
        payload.password = previous.password;
      }
      await updateDoc(doc(db, COLLECTION, id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      if (!previous?.authUid || idChanged) {
        await provisionLogin(id, payload, previous?.authUid || null);
      } else {
        // Keep the role document's display info in sync.
        await updateDoc(doc(db, 'users', previous.authUid), {
          name: payload.name,
          email: payload.email,
          idNumber: payload.idNumber,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
      if (!silent) {
        notify({
          type: 'update',
          entity: 'faculty',
          title: `Faculty updated: ${payload.name}`,
          message: `ID ${payload.idNumber} · ${payload.program}`,
          meta: { facultyId: id },
        });
      }
    },
    [faculty],
  );

  /** Create the login account for an existing record that has none. */
  const createLogin = useCallback(
    async (id) => {
      const member = faculty.find((f) => f.id === id);
      if (!member) throw new Error('Faculty record not found');
      const account = await provisionLogin(id, toPayload(member), member.authUid || null);
      notify({
        type: 'account',
        entity: 'faculty',
        title: `Login created for ${member.name}`,
        message: `Username ${account.username} · Password ${account.password}`,
        meta: { facultyId: id },
      });
      return account;
    },
    [faculty],
  );

  const deleteFaculty = useCallback(
    async (id, { silent = false } = {}) => {
      const member = faculty.find((f) => f.id === id);
      await deleteDoc(doc(db, COLLECTION, id));
      if (member?.authUid) await revokeFacultyAccount(member.authUid).catch(() => {});
      if (!silent) {
        notify({
          type: 'delete',
          entity: 'faculty',
          title: `Faculty removed: ${member?.name || id}`,
          message: member ? `ID ${member.idNumber} · ${member.program}` : '',
          meta: { facultyId: id },
        });
      }
    },
    [faculty],
  );

  return { faculty, loading, error, addFaculty, updateFaculty, deleteFaculty, createLogin };
}
