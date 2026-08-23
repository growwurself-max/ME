/**
 * Verify seed data in Firebase Auth and Firestore
 */
const { admin, db } = require('./src/config/firebase');

async function verifySeedData() {
  try {
    console.log('=== Verifying Seed Data ===\n');
    
    // List Firebase Auth users
    console.log('Firebase Auth Users:');
    const listUsersResult = await admin.auth().listUsers(10);
    listUsersResult.users.forEach(user => {
      console.log(`  - UID: ${user.uid}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Email Verified: ${user.emailVerified}`);
      console.log(`    Disabled: ${user.disabled}`);
    });
    console.log(`  Total users: ${listUsersResult.users.length}\n`);
    
    // Check super_admins collection
    console.log('Firestore - super_admins collection:');
    const superAdminsSnapshot = await db.collection('super_admins').get();
    superAdminsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}`);
      console.log(`    Username: ${data.username}`);
      console.log(`    Email: ${data.email}`);
      console.log(`    Name: ${data.name}`);
    });
    console.log(`  Total super_admins: ${superAdminsSnapshot.docs.length}\n`);
    
    // Check colleges collection
    console.log('Firestore - colleges collection:');
    const collegesSnapshot = await db.collection('colleges').get();
    collegesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}`);
      console.log(`    Username: ${data.username}`);
      console.log(`    Name: ${data.name}`);
      console.log(`    Email: ${data.email}`);
      console.log(`    Principal: ${data.principal_name}`);
      console.log(`    Active: ${data.is_active}`);
      console.log(`    Subscription: ${data.subscription_status}`);
    });
    console.log(`  Total colleges: ${collegesSnapshot.docs.length}\n`);
    
    // Check subscriptions collection
    console.log('Firestore - subscriptions collection:');
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    subscriptionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}`);
      console.log(`    College ID: ${data.college_id}`);
      console.log(`    Status: ${data.status}`);
      console.log(`    Plan: ${data.plan}`);
    });
    console.log(`  Total subscriptions: ${subscriptionsSnapshot.docs.length}\n`);
    
    // List all collections
    console.log('All Firestore Collections:');
    const collections = await db.listCollections();
    collections.forEach(col => console.log(`  - ${col.id}`));
    console.log(`  Total collections: ${collections.length}\n`);
    
    console.log('✓ Seed data verification complete');
    process.exit(0);
  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

verifySeedData();
