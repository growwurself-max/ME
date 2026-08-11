import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../lib/api';
import {
  auth,
  ensureUserProfile,
  firebaseSignOut,
  onAuthStateChanged,
  signInWithFirebaseTokenAndGetIdToken,
} from '../lib/firebase.ts';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [databaseSyncing, setDatabaseSyncing] = useState(false);
  const [databaseSyncError, setDatabaseSyncError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    api
      .get('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(async () => {
        clearToken();
        try {
          await firebaseSignOut(auth);
        } catch {
          // Ignore sign-out failures during cleanup.
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setDatabaseSyncError('');
        setDatabaseSyncing(false);
        return;
      }

      setDatabaseSyncing(true);
      const result = await ensureUserProfile(firebaseUser);
      if (!result.ok) {
        setDatabaseSyncError(result.message);
      } else {
        setDatabaseSyncError('');
      }
      setDatabaseSyncing(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });

    if (data.firebaseToken) {
      try {
        const firebaseIdToken = await signInWithFirebaseTokenAndGetIdToken(data.firebaseToken);
        setToken(firebaseIdToken);
      } catch (error) {
        console.warn('Firebase sign-in failed:', error);
        throw new Error('Firebase sign-in failed. Check local Firebase Auth emulator/project configuration.');
      }
    } else if (data.token) {
      setToken(data.token);
    }

    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    clearToken();
    setUser(null);
    setDatabaseSyncError('');
    setDatabaseSyncing(false);

    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore sign-out failures, keep the session cleared locally.
    }
  }, []);

  const refresh = useCallback(async () => {
    const data = await api.get('/api/auth/me');
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refresh,
        databaseSyncing,
        databaseSyncError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
