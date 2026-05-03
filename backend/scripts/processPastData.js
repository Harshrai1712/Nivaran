#!/usr/bin/env node
/**
 * processPastData.js
 * ──────────────────────────────────────────────────────────────
 * ONE-TIME SCRIPT — Run this manually to process ALL past sensor
 * data and populate the cigaretteStats node in Firebase.
 *
 * Usage:
 *   cd backend
 *   node scripts/processPastData.js
 *
 * What it does:
 *   1. Fetches ALL entries under /sensors
 *   2. Groups them by date (from .timestamp field)
 *   3. For each day: sorts entries and applies 10-minute skip window
 *      (Alarm === true → count +1, skip next 10 min of data)
 *   4. Writes results to:
 *        cigaretteStats/<userId>/daily/<YYYY-MM-DD>  → count
 *        cigaretteStats/<userId>/totalCount           → total
 *        cigaretteStats/<userId>/lastProcessedAt      → ISO timestamp
 *
 * SAFE TO RE-RUN — overwrites with correct computed values each time.
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { initializeFirebase, getDatabase } = require('../config/firebase');
const { processAllPastData } = require('../utils/sensorProcessor');

async function run() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SmokeGuard — Past Data Processor (One-Time Script)');
  console.log('═══════════════════════════════════════════════════\n');

  // Initialize Firebase
  initializeFirebase();
  const db = getDatabase();

  if (!db) {
    console.error('❌  Could not connect to Firebase. Check your .env configuration.');
    process.exit(1);
  }

  // Resolve the target userId — use the first registered user
  console.log('🔍  Looking up registered users …');
  const usersSnap = await db.ref('users').limitToFirst(1).once('value');
  const usersVal = usersSnap.val();

  if (!usersVal) {
    console.error('❌  No users found in Firebase. Register a user first, then re-run.');
    process.exit(1);
  }

  const userId = Object.keys(usersVal)[0];
  const userName = usersVal[userId]?.name || userId;
  console.log(`👤  Processing data for user: ${userName} (${userId})\n`);

  // Run the bulk processor
  const { dailyCounts, totalCount } = await processAllPastData(db, userId);

  // Summary
  const days = Object.keys(dailyCounts);
  console.log('\n══════════════════ RESULTS ════════════════════════');
  if (days.length === 0) {
    console.log('ℹ️   No sensor data with Alarm=true was found.');
    console.log('    This is normal if your sensor data has no alarms yet.');
  } else {
    console.log(`📅  Days processed : ${days.length}`);
    console.log(`🚬  Total cigarettes: ${totalCount}`);
    console.log('\nBreakdown:');
    days.sort().forEach((dk) => {
      const bar = '█'.repeat(dailyCounts[dk]);
      console.log(`  ${dk}  ${bar}  (${dailyCounts[dk]})`);
    });
  }
  console.log('\n✅  Firebase updated successfully.');
  console.log('    Path: cigaretteStats/' + userId);
  console.log('═══════════════════════════════════════════════════\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
