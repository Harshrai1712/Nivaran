/**
 * Seed Data Script
 * Populates Firebase with 30 days of realistic dummy health data
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const { initializeFirebase } = require('../config/firebase');

async function seedData() {
  console.log('🌱 Starting data seeding...\n');

  const db = initializeFirebase();

  if (!db) {
    console.error('❌ Cannot seed: Firebase not initialized.');
    console.log('💡 Make sure your .env file and firebase-service-account.json are configured.');
    process.exit(1);
  }

  // Create a demo user
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('demo123', salt);

  const userId = 'demo_user_001';

  await db.ref(`users/${userId}`).set({
    id: userId,
    name: 'Demo User',
    email: 'demo@smoke-detector.com',
    password: hashedPassword,
    dailyLimit: 5,
    createdAt: new Date().toISOString(),
  });

  await db.ref(`userSettings/${userId}`).set({
    darkMode: false,
    notifications: true,
    reminders: true,
    dailyLimit: 5,
  });

  console.log('✅ Demo user created: demo@smoke-detector.com / demo123\n');

  // Generate 30 days of health data
  const today = new Date();

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateKey = date.toISOString().split('T')[0];

    // Randomize: some days are smoke-free, some are heavy
    const dayPattern = Math.random();
    let maxCigarettesForDay;

    if (dayPattern < 0.25) {
      maxCigarettesForDay = 0; // Smoke-free day
    } else if (dayPattern < 0.5) {
      maxCigarettesForDay = 2; // Very few
    } else if (dayPattern < 0.8) {
      maxCigarettesForDay = 5; // Moderate
    } else {
      maxCigarettesForDay = 8; // High
    }

    // Generate hourly entries (8 AM to 10 PM)
    let cigarettesLeft = maxCigarettesForDay;

    for (let hour = 8; hour <= 22; hour++) {
      const entryDate = new Date(date);
      entryDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

      // Randomly assign cigarettes to hours
      let cigaretteCount = 0;
      if (cigarettesLeft > 0 && Math.random() > 0.5) {
        cigaretteCount = Math.min(Math.ceil(Math.random() * 2), cigarettesLeft);
        cigarettesLeft -= cigaretteCount;
      }

      // Heart rate: base 70-80, higher when smoking
      const baseHR = 70 + Math.floor(Math.random() * 10);
      const smokingBoost = cigaretteCount > 0 ? 10 + Math.floor(Math.random() * 20) : 0;
      const heartRate = baseHR + smokingBoost + Math.floor(Math.random() * 10);

      const logRef = db.ref(`healthLogs/${userId}/${dateKey}`).push();
      await logRef.set({
        timestamp: entryDate.getTime(),
        hour,
        cigaretteCount,
        heartRate,
        createdAt: entryDate.toISOString(),
      });
    }

    const status = maxCigarettesForDay === 0 ? '🟢 Normal' :
      maxCigarettesForDay <= 2 ? '🔵 Very Few' :
      maxCigarettesForDay <= 5 ? '🟡 Moderate' : '🔴 High';

    console.log(`  📅 ${dateKey}: ${maxCigarettesForDay} cigarettes → ${status}`);
  }

  console.log('\n✅ Seed data complete! 30 days of health data generated.');
  console.log('🔑 Login with: demo@smoke-detector.com / demo123');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
