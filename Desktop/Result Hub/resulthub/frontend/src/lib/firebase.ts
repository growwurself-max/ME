import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  onIdTokenChanged,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

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

if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' &&
  !globalThis.__RESULT_HUB_FIREBASE_EMULATOR_CONNECTED__
) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  globalThis.__RESULT_HUB_FIREBASE_EMULATOR_CONNECTED__ = true;
  console.warn('Using Firebase emulator (Auth: 9099).');
}

export async function signInWithFirebaseToken(customToken: string): Promise<User> {
  const credential = await signInWithCustomToken(auth, customToken);
  return credential.user;
}

export async function signInWithFirebaseTokenAndGetIdToken(customToken: string): Promise<string> {
  const user = await signInWithFirebaseToken(customToken);
  // Force token refresh to ensure custom claims are included
  return user.getIdToken(true);
}

export { auth, onFirebaseAuthStateChanged as onAuthStateChanged, onIdTokenChanged, firebaseSignOut };
