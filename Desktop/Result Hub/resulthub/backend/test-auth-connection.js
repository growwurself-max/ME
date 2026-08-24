/**
 * Test script to verify Firebase Auth connection
 */
const { admin } = require('./src/config/firebase');

async function testAuth() {
  try {
    console.log('Testing Firebase Auth connection...');
    
    // Try to list users
    const listUsersResult = await admin.auth().listUsers(1);
    console.log('✓ Successfully connected to Firebase Auth');
    console.log(`  - Total users: ${listUsersResult.users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Firebase Auth connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testAuth();
