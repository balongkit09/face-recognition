import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  ensureAdminProfile,
  isBootstrapAdminUser,
  signInUser,
} from '../firebase/bootstrap';
import { applyTheme, normalizePreferences } from '../firebase/preferences';

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

  // Keep the role document live so preferences and profile edits stay in sync.
  useEffect(() => {
    if (!user?.uid || !role) return undefined;
    const col = role === 'admin' ? 'admins' : 'users';
    const unsubscribe = onSnapshot(
      doc(db, col, user.uid),
      (snap) => {
        if (snap.exists()) setAccount({ id: snap.id, ...snap.data() });
      },
      () => {},
    );
    return unsubscribe;
  }, [user?.uid, role]);

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

  const updatePreferences = useCallback(
    async (partial) => {
      if (!auth.currentUser || !role) return;
      const next = { ...normalizePreferences(account?.preferences), ...partial };
      applyTheme(!!next.darkMode);
      const col = role === 'admin' ? 'admins' : 'users';
      await setDoc(
        doc(db, col, auth.currentUser.uid),
        { preferences: next, updatedAt: serverTimestamp() },
        { merge: true },
      );
      setAccount((prev) => (prev ? { ...prev, preferences: next } : prev));
    },
    [role, account?.preferences],
  );

  const preferences = normalizePreferences(account?.preferences);

  useEffect(() => {
    if (!user || !account) return;
    if (account.preferences && 'darkMode' in account.preferences) {
      applyTheme(!!account.preferences.darkMode);
    }
  }, [user, account]);

  const value = useMemo(
    () => ({
      user,
      role,
      account,
      profile,
      preferences,
      loading,
      login,
      logout,
      updateDisplayName,
      updatePreferences,
    }),
    [user, role, account, profile, preferences, loading, login, logout, updateDisplayName, updatePreferences],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
