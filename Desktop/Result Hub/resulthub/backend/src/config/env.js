require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const emulator = process.env.EMULATOR === 'true';

module.exports = {
  firebaseProjectId: required('FIREBASE_PROJECT_ID'),
  firebaseClientEmail: emulator ? process.env.FIREBASE_CLIENT_EMAIL : required('FIREBASE_CLIENT_EMAIL'),
  firebasePrivateKey: emulator ? process.env.FIREBASE_PRIVATE_KEY : required('FIREBASE_PRIVATE_KEY'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  emulator,
  firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',
  authEmulatorHost: (process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099').replace(/^https?:\/\//, ''),
};
