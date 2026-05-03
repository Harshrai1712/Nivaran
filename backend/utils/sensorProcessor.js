/**
 * sensorProcessor.js
 * ──────────────────────────────────────────────────────────────
 * Core logic for processing raw sensor data into cigarette counts.
 *
 * RULES:
 *   1. Group sensor entries by date (from their timestamp field).
 *   2. Sort each day's entries chronologically.
 *   3. Walk through sorted entries — when Alarm === true, count +1
 *      cigarette and SKIP all subsequent entries within the next
 *      10 minutes (to avoid double-counting a single cigarette).
 *   4. Store the result in  cigaretteStats/<userId>/daily/<YYYY-MM-DD>
 *      and update  cigaretteStats/<userId>/totalCount.
 *
 * This module exposes:
 *   • processAllPastData(db, userId)  — one-time bulk processor
 *   • processWindow(db, userId)       — real-time 10-min tick
 *   • getCigaretteStats(db, userId)   — read processed stats
 *   • getLatestMaxHR(db)              — max HR from recent sensor data
 */

const TEN_MINUTES_MS = 10 * 60 * 1000; // 600 000 ms

// ─── helpers ──────────────────────────────────────────────────

/**
 * Parse a sensor entry's Alarm field (handles boolean & string).
 */
function isAlarmTrue(entry) {
  const v = entry.Alarm ?? entry.alarm;
  return v === true || v === 'true';
}

/**
 * Safely parse a timestamp string into epoch-ms.
 * Returns null if the value is missing or invalid.
 */
function parseTimestamp(entry) {
  const raw = entry.timestamp ?? entry.Timestamp;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Extract YYYY-MM-DD from epoch-ms.
 */
function dateKeyFromMs(ms) {
  return new Date(ms).toISOString().split('T')[0];
}

// ─── core algorithm ───────────────────────────────────────────

/**
 * Given an array of sensor entries (each with .timestamp and .Alarm),
 * group by date and apply the 10-minute window dedup.
 *
 * @param {Object[]} entries - raw sensor values
 * @returns {Object} { "YYYY-MM-DD": cigaretteCount, ... }
 */
function computeDailyCounts(entries) {
  // 1. Attach parsed ms and filter out entries without a valid timestamp
  const timed = entries
    .map((e) => ({ ...e, _ms: parseTimestamp(e) }))
    .filter((e) => e._ms !== null);

  // 2. Group by date
  const byDate = {};
  timed.forEach((e) => {
    const dk = dateKeyFromMs(e._ms);
    if (!byDate[dk]) byDate[dk] = [];
    byDate[dk].push(e);
  });

  // 3. For each day, sort and apply 10-min skip window
  const result = {};
  Object.keys(byDate).forEach((dk) => {
    const sorted = byDate[dk].sort((a, b) => a._ms - b._ms);
    let count = 0;
    let skipUntil = 0; // epoch-ms; entries before this are ignored

    sorted.forEach((e) => {
      if (e._ms < skipUntil) return; // still inside the skip window
      if (isAlarmTrue(e)) {
        count += 1;
        skipUntil = e._ms + TEN_MINUTES_MS;
      }
    });

    result[dk] = count;
  });

  return result;
}

// ─── Firebase operations ──────────────────────────────────────

/**
 * PHASE 1 — One-time bulk processing of ALL past sensor data.
 * Reads every entry under /sensors, computes daily counts,
 * and writes them to /cigaretteStats/<userId>/daily/<date>.
 *
 * Safe to call multiple times — it always overwrites with
 * freshly computed values so results stay correct even if
 * this function is accidentally called more than once.
 */
async function processAllPastData(db, userId) {
  console.log(`[SensorProcessor] Processing ALL past data for user ${userId} …`);

  const snapshot = await db.ref('sensors').once('value');
  const raw = snapshot.val();
  if (!raw) {
    console.log('[SensorProcessor] No sensor data found.');
    return { dailyCounts: {}, totalCount: 0 };
  }

  const entries = Object.values(raw);
  const dailyCounts = computeDailyCounts(entries);

  // Calculate total
  const totalCount = Object.values(dailyCounts).reduce((s, c) => s + c, 0);

  // Write to Firebase (atomic multi-path update)
  const updates = {};
  Object.keys(dailyCounts).forEach((dk) => {
    updates[`cigaretteStats/${userId}/daily/${dk}`] = dailyCounts[dk];
  });
  updates[`cigaretteStats/${userId}/totalCount`] = totalCount;
  updates[`cigaretteStats/${userId}/lastProcessedAt`] = new Date().toISOString();

  await db.ref().update(updates);

  console.log(
    `[SensorProcessor] ✅  Processed ${entries.length} entries → ` +
      `${Object.keys(dailyCounts).length} days, ${totalCount} total cigarettes.`
  );

  return { dailyCounts, totalCount };
}

/**
 * PHASE 2 — Real-time 10-minute window check.
 * Fetches sensor entries from the last 10 minutes only.
 * If ANY has Alarm === true → increment today's count by 1.
 *
 * Double-counting prevention:
 *   We record `lastAlarmAt` in Firebase. If the most-recent alarm
 *   entry we find in this window is the same moment as the last
 *   recorded alarm (or within the same 10-min block), we skip.
 *
 * Also finds the MAX heart rate in the window and stores it.
 */
async function processWindow(db, userId) {
  const now = Date.now();
  const windowStart = new Date(now - TEN_MINUTES_MS).toISOString();
  const today = new Date(now).toISOString().split('T')[0];

  const snapshot = await db.ref('sensors')
    .orderByChild('timestamp')
    .startAt(windowStart)
    .once('value');

  const raw = snapshot.val();
  if (!raw) return { detected: false, todayCount: null, maxHR: 0 };

  const entries = Object.values(raw);

  // ── Heart rate: pick highest HR in the window ─────────────────
  const hrValues = entries
    .map((e) => Number(e.HR ?? e.hr ?? e.heartRate ?? 0))
    .filter((v) => v > 0);
  const maxHR = hrValues.length > 0 ? Math.max(...hrValues) : 0;

  // Always persist the latest max HR (even if no alarm)
  if (maxHR > 0) {
    await db.ref(`cigaretteStats/${userId}/currentHR`).set(maxHR);
  }

  // Filter to alarm entries only
  const alarmEntries = entries.filter((e) => isAlarmTrue(e));
  if (alarmEntries.length === 0) {
    return { detected: false, todayCount: null, maxHR };
  }

  // Find the earliest alarm timestamp in this window
  const alarmTimes = alarmEntries
    .map((e) => parseTimestamp(e))
    .filter((ms) => ms !== null)
    .sort((a, b) => a - b);

  const firstAlarmMs = alarmTimes[0];

  // ── Double-counting guard ─────────────────────────────────────
  // Read the last alarm timestamp we already counted
  const lastAlarmSnap = await db.ref(`cigaretteStats/${userId}/lastAlarmAt`).once('value');
  const lastAlarmAt = lastAlarmSnap.val(); // ISO string or null

  if (lastAlarmAt) {
    const lastAlarmMs = new Date(lastAlarmAt).getTime();
    // If the first alarm in this window falls within 10 min of the
    // last alarm we already counted, skip to avoid double-counting.
    if (firstAlarmMs - lastAlarmMs < TEN_MINUTES_MS) {
      console.log(
        `[SensorProcessor] ⏭  Alarm already counted within window. ` +
          `Last: ${lastAlarmAt}. Skipping.`
      );
      return { detected: false, todayCount: null, maxHR };
    }
  }

  // Increment today's count
  const dailyRef = db.ref(`cigaretteStats/${userId}/daily/${today}`);
  const totalRef = db.ref(`cigaretteStats/${userId}/totalCount`);

  const currentSnap = await dailyRef.once('value');
  const currentCount = currentSnap.val() || 0;
  const newCount = currentCount + 1;

  const newAlarmAt = new Date(firstAlarmMs).toISOString();

  await Promise.all([
    dailyRef.set(newCount),
    totalRef.transaction((current) => (current || 0) + 1),
    db.ref(`cigaretteStats/${userId}/lastAlarmAt`).set(newAlarmAt),
    db.ref(`cigaretteStats/${userId}/lastProcessedAt`).set(new Date().toISOString()),
  ]);

  console.log(
    `[SensorProcessor] 🚬 Alarm detected! ${today}: ${currentCount} → ${newCount} | Max HR: ${maxHR} BPM`
  );

  return { detected: true, todayCount: newCount, maxHR };
}

/**
 * Get the highest HR from sensor entries in the last 10 minutes.
 * Falls back to ALL sensor data if no recent entries found.
 * Called directly by getTodayData on every API request.
 */
async function getLatestMaxHR(db) {
  const now = Date.now();
  const windowStart = new Date(now - TEN_MINUTES_MS).toISOString();

  // Try last 10 minutes first
  const snapshot = await db.ref('sensors')
    .orderByChild('timestamp')
    .startAt(windowStart)
    .once('value');

  let raw = snapshot.val();

  // If no recent entries, fall back to ALL sensors (take the single latest)
  if (!raw) {
    const allSnap = await db.ref('sensors')
      .orderByChild('timestamp')
      .limitToLast(20)
      .once('value');
    raw = allSnap.val();
  }

  if (!raw) return 0;

  const hrValues = Object.values(raw)
    .map((e) => Number(e.HR ?? e.hr ?? e.heartRate ?? 0))
    .filter((v) => v > 0);

  return hrValues.length > 0 ? Math.max(...hrValues) : 0;
}

/**
 * Read the processed cigarette stats for a user.
 */
async function getCigaretteStats(db, userId) {
  const snapshot = await db.ref(`cigaretteStats/${userId}`).once('value');
  const stats = snapshot.val();
  if (!stats) return { daily: {}, totalCount: 0 };
  return {
    daily: stats.daily || {},
    totalCount: stats.totalCount || 0,
    lastProcessedAt: stats.lastProcessedAt || null,
    lastAlarmAt: stats.lastAlarmAt || null,
  };
}

module.exports = {
  computeDailyCounts,
  processAllPastData,
  processWindow,
  getCigaretteStats,
  getLatestMaxHR,
  TEN_MINUTES_MS,
};
