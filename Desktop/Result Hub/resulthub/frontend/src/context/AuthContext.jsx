import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../lib/api';
import { auth, firebaseSignOut, onIdTokenChanged, signInWithFirebaseTokenAndGetIdToken } from '../lib/firebase.ts';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Keep the stored Firebase ID token fresh. Firebase refreshes the ID token
    // automatically while a session is active, and onIdTokenChanged fires on
    // every refresh — so protected requests never send an expired token.
    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      if (cancelled) return;
      if (!firebaseUser) {
        clearToken();
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const freshIdToken = await firebaseUser.getIdToken(true);
        setToken(freshIdToken);
        if (cancelled) return;
        const data = await api.get('/api/auth/me');
        if (cancelled) return;
        setUser(data.user);
      } catch {
        if (!cancelled) {
          clearToken();
          try {
            await firebaseSignOut(auth);
          } catch {
            // Ignore sign-out failures during cleanup.
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });

    if (data.firebaseToken) {
      try {
        const firebaseIdToken = await signInWithFirebaseTokenAndGetIdToken(data.firebaseToken);
        setToken(firebaseIdToken);
      } catch (error) {
        console.warn('Firebase sign-in failed:', error);
        throw new Error('Firebase sign-in failed. Check Firebase project configuration.');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
