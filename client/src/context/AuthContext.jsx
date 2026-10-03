import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  ensureAdminProfile,
  isBootstrapAdminUser,
  signInUser,
} from '../firebase/bootstrap';

export const AuthContext = createContext(null);

/**
 * Resolve the role for a signed-in Firebase user.
 *  - admins/{uid} exists  -> 'admin'
 *  - users/{uid}.role === 'faculty' -> 'faculty' (with the users doc as profile)
 *  - otherwise -> null (no access)
 */
async function resolveRole(firebaseUser) {
  if (isBootstrapAdminUser(firebaseUser)) {
    try {
      await ensureAdminProfile(firebaseUser);
    } catch (err) {
      console.warn('Could not create admin profile:', err.message);
    }
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
    if (adminSnap.exists()) return { role: 'admin', account: { id: adminSnap.id, ...adminSnap.data() } };
  } catch {
    /* not an admin */
  }
  try {
    const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userSnap.exists() && userSnap.data().role === 'faculty') {
      return { role: 'faculty', account: { id: userSnap.id, ...userSnap.data() } };
    }
  } catch {
    /* not faculty */
  }
  return { role: null, account: null };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null); // faculty document for faculty users
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (cancelled) return;
        setUser(null);
        setRole(null);
        setAccount(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      // Resolve role BEFORE exposing the user so pages never mount their
      // Firestore listeners without permission.
      const resolved = await resolveRole(firebaseUser);
      if (cancelled) return;
      setUser(firebaseUser);
      setRole(resolved.role);
      setAccount(resolved.account);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Keep the faculty record live for faculty users.
  useEffect(() => {
    if (role !== 'faculty' || !account?.facultyId) {
      setProfile(null);
      return undefined;
    }
    const unsubscribe = onSnapshot(
      doc(db, 'faculty', account.facultyId),
      (snap) => setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setProfile(null),
    );
    return unsubscribe;
  }, [role, account?.facultyId]);

  const login = useCallback(async (username, password) => {
    const credential = await signInUser(username, password);
    const resolved = await resolveRole(credential.user);
    if (!resolved.role) {
      await signOut(auth);
      const err = new Error('This account has no access to the system. Ask an administrator to register you as faculty.');
      err.code = 'app/no-role';
      throw err;
    }
    setUser(credential.user);
    setRole(resolved.role);
    setAccount(resolved.account);
    return resolved.role;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  /** Update the display name on Auth and on the role document. */
  const updateDisplayName = useCallback(
    async (displayName) => {
      if (!auth.currentUser) return;
      const name = displayName.trim();
      await updateProfile(auth.currentUser, { displayName: name });
      const col = role === 'admin' ? 'admins' : 'users';
      await setDoc(
        doc(db, col, auth.currentUser.uid),
        role === 'admin' ? { displayName: name, updatedAt: serverTimestamp() } : { name, updatedAt: serverTimestamp() },
        { merge: true },
      );
      if (role === 'faculty' && account?.facultyId) {
        // Keep the faculty directory record in sync for the admin.
        await setDoc(
          doc(db, 'faculty', account.facultyId),
          { name, updatedAt: serverTimestamp() },
          { merge: true },
        ).catch(() => {});
      }
      // Force a re-render with the refreshed user object.
      setUser({ ...auth.currentUser });
      setAccount((prev) => (prev ? { ...prev, displayName: name, name } : prev));
    },
    [role, account?.facultyId],
  );

  const value = useMemo(
    () => ({ user, role, account, profile, loading, login, logout, updateDisplayName }),
    [user, role, account, profile, loading, login, logout, updateDisplayName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
