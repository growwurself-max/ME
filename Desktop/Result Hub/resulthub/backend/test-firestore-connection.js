/**
 * Test script to verify Firebase Admin can connect to Firestore
 */
const { admin, db } = require('./src/config/firebase');

async function testConnection() {
  try {
    console.log('Testing Firebase Admin connection to Firestore...');
    
    // Test a simple query
    const snapshot = await db.collection('super_admins').limit(1).get();
    console.log('✓ Successfully connected to Firestore');
    console.log(`  - super_admins collection exists: ${!snapshot.empty}`);
    
    // List all collections
    const collections = await db.listCollections();
    console.log(`  - Total collections: ${collections.length}`);
    collections.forEach(col => console.log(`    • ${col.id}`));
    
    console.log('\n✓ Firestore connection test passed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Firestore connection test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
