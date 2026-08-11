import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' &&
  !globalThis.__RESULT_HUB_FIREBASE_EMULATOR_CONNECTED__
) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  globalThis.__RESULT_HUB_FIREBASE_EMULATOR_CONNECTED__ = true;
  console.warn('Using Firebase emulators (Auth: 9099, Firestore: 8080).');
}

export async function signInWithFirebaseToken(customToken: string): Promise<void> {
  await signInWithCustomToken(auth, customToken);
}

export async function signInWithFirebaseTokenAndGetIdToken(customToken: string): Promise<string> {
  const credential = await signInWithCustomToken(auth, customToken);
  // Force token refresh to ensure custom claims are included
  return credential.user.getIdToken(true);
}

export async function ensureUserProfile(
  user: User,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const userDocRef = doc(db, 'users', user.uid);
  const timestamp = serverTimestamp();

  try {
    const snapshot = await getDoc(userDocRef);
    const profileUpdate = {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      lastActive: timestamp,
    };

    if (snapshot.exists()) {
      await updateDoc(userDocRef, {
        ...profileUpdate,
        updatedAt: timestamp,
      });
    } else {
      await setDoc(userDocRef, {
        ...profileUpdate,
        createdAt: timestamp,
        providerId: user.providerData?.[0]?.providerId ?? null,
      });
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown Firestore error occurred.';
    console.warn('Firestore user profile sync failed:', message, error);
    return {
      ok: false,
      message:
        'Unable to complete database synchronization right now. Your session will continue in degraded mode.',
    };
  }
}

export { app, auth, db, onFirebaseAuthStateChanged as onAuthStateChanged, firebaseSignOut };
