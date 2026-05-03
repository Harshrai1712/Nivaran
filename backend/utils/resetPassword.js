/**
 * resetPassword.js
 * Run with: node utils/resetPassword.js
 * 
 * Resets hr@gmail.com password to: hr123456
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initializeFirebase, getDatabase } = require('../config/firebase');

async function resetPassword() {
  initializeFirebase();
  const db = getDatabase();

  const email = 'hr@gmail.com';
  const newPassword = 'hr123456';

  console.log(`\n🔑 Resetting password for: ${email}`);

  // Find user by email
  const snapshot = await db
    .ref('users')
    .orderByChild('email')
    .equalTo(email)
    .once('value');

  if (!snapshot.exists()) {
    console.error('❌ User not found with email:', email);
    process.exit(1);
  }

  let userId = null;
  snapshot.forEach((child) => {
    userId = child.key;
  });

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update in Firebase
  await db.ref(`users/${userId}/password`).set(hashedPassword);

  console.log('✅ Password reset successfully!');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${newPassword}`);
  console.log('\n👉 Now login with these credentials in the app.\n');

  process.exit(0);
}

resetPassword().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
