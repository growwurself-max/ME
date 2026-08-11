const fetch = require('node-fetch');
require('dotenv').config();

(async () => {
  try {
    const username = process.env.SEED_SUPER_ADMIN_USERNAME || 'superadmin';
    const password = process.env.SEED_SUPER_ADMIN_PASSWORD || 'DevSuperAdmin123!';
    const loginResp = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const loginData = await loginResp.json();
    console.log('login status', loginResp.status);
    console.log('login user', loginData.user);
    if (!loginData.firebaseToken) {
      console.error('missing firebaseToken', loginData);
      return;
    }
    const customToken = loginData.firebaseToken;

    const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
    const signResp = await fetch(`http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });
    const signData = await signResp.json();
    console.log('sign status', signResp.status);
    console.log('signData keys', Object.keys(signData));
    if (!signData.idToken) {
      console.error('missing idToken', signData);
      return;
    }
    const idToken = signData.idToken;
    const createResp = await fetch('http://localhost:4000/api/super-admin/colleges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        name: 'Test College Fix',
        principal_name: 'Fix Tester',
        email: 'fix@testcollege.local',
        phone: '+1234567890',
        username: 'fixcollegeadmin',
        password: 'FixPass123',
        subscription_status: 'active',
        is_active: true,
      }),
    });
    const createBody = await createResp.text();
    console.log('create status', createResp.status);
    console.log('create body', createBody);
  } catch (error) {
    console.error(error);
  }
})();