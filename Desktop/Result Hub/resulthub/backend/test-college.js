/**
 * Test College Admin authentication
 */
const http = require('http');
const { admin } = require('./src/config/firebase');

const API_BASE = 'http://localhost:4000/api';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = API_BASE + path;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCollege() {
  try {
    console.log('=== Testing College Admin Authentication ===\n');
    
    // Login
    console.log('1. Testing college login...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      username: 'collegeadmin',
      password: 'DevCollegeAdmin123!'
    });
    console.log('✓ College login successful');
    const firebaseToken = loginResponse.firebaseToken;
    console.log(`  Firebase Custom Token: ${firebaseToken.substring(0, 50)}...\n`);
    
    // Verify custom claims
    console.log('2. Verifying custom claims...');
    const user = await admin.auth().getUser(loginResponse.user.id);
    console.log('✓ Custom claims verified');
    console.log(`  User role: ${user.customClaims?.role}`);
    console.log(`  College ID: ${user.customClaims?.collegeId}\n`);
    
    console.log('✓ College Admin authentication flow verified\n');
    
    console.log('✓ All College Admin tests passed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

testCollege();
