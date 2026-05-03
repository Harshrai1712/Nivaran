/**
 * realtimeUpdater.js
 * ──────────────────────────────────────────────────────────────
 * Starts a background interval that runs every 10 minutes.
 *
 * On FIRST run it also triggers a one-time bulk processing of
 * all past sensor data (Phase 1). If Phase 1 has already been
 * completed (detected by the presence of `lastProcessedAt` in
 * Firebase), it is skipped and Phase 2 runs immediately.
 *
 * Subsequent ticks only look at the last 10 minutes of sensor
 * entries (Phase 2).
 *
 * Usage:  require('./utils/realtimeUpdater').startRealtimeUpdater();
 */

const { getDatabase } = require('../config/firebase');
const {
  processAllPastData,
  processWindow,
  TEN_MINUTES_MS,
} = require('./sensorProcessor');

let intervalHandle = null;

// Runtime flag — set to true once Phase 1 finishes (or is skipped)
let pastDataProcessed = false;

/**
 * Resolve the "default" userId to use for sensor processing.
 * Since sensors are global (not per-user), we pick the first user
 * found in /users — or fall back to 'default'.
 */
async function resolveUserId(db) {
  const snap = await db.ref('users').limitToFirst(1).once('value');
  const val = snap.val();
  if (val) {
    const firstKey = Object.keys(val)[0];
    return firstKey;
  }
  return 'default';
}

/**
 * Check whether Phase 1 has already been run by looking for
 * the `lastProcessedAt` marker in Firebase.
 *
 * @returns {boolean}
 */
async function isAlreadyProcessed(db, userId) {
  const snap = await db.ref(`cigaretteStats/${userId}/lastProcessedAt`).once('value');
  return snap.val() !== null;
}

/**
 * Single tick of the real-time updater.
 */
async function tick() {
  try {
    const db = getDatabase();
    if (!db) {
      console.log('[RealtimeUpdater] Firebase not available, skipping tick.');
      return;
    }

    const userId = await resolveUserId(db);

    // Phase 1: process all past data (runs only once per deployment)
    if (!pastDataProcessed) {
      const alreadyDone = await isAlreadyProcessed(db, userId);

      if (alreadyDone) {
        // Past data was processed in a previous session — skip bulk pass
        console.log(
          '[RealtimeUpdater] ⏭  Phase 1 already done (found lastProcessedAt). ' +
            'Skipping bulk pass.'
        );
        pastDataProcessed = true;
        // Fall through to immediately run Phase 2 on this tick
      } else {
        // First time — run the full bulk processor
        await processAllPastData(db, userId);
        pastDataProcessed = true;
        console.log('[RealtimeUpdater] ✅ Phase 1 (past data) complete.');
        return; // first tick is the bulk pass; next tick starts real-time
      }
    }

    // Phase 2: check last 10 minutes
    const result = await processWindow(db, userId);
    if (result.detected) {
      console.log(`[RealtimeUpdater] 🚬 Cigarette detected. Today total: ${result.todayCount}`);
    } else {
      console.log('[RealtimeUpdater] ✔ No new alarm in the last 10 minutes.');
    }
  } catch (err) {
    console.error('[RealtimeUpdater] Error during tick:', err.message);
  }
}

/**
 * Start the real-time updater.
 * Runs the first tick immediately, then every 10 minutes.
 */
function startRealtimeUpdater() {
  if (intervalHandle) {
    console.log('[RealtimeUpdater] Already running.');
    return;
  }

  console.log('[RealtimeUpdater] 🚀 Starting (interval = 10 min) …');

  // Immediate first tick (processes past data or skips if already done)
  tick();

  // Then every 10 minutes
  intervalHandle = setInterval(tick, TEN_MINUTES_MS);
}

/**
 * Stop the real-time updater (useful for testing / graceful shutdown).
 */
function stopRealtimeUpdater() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    pastDataProcessed = false;
    console.log('[RealtimeUpdater] Stopped.');
  }
}

module.exports = { startRealtimeUpdater, stopRealtimeUpdater };
