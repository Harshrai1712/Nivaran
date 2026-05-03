const { getDatabase } = require('../config/firebase');
const {
  calculateStatus,
  getHeartRateStatus,
  getMotivationalMessage,
  aggregateByHour,
} = require('../utils/statusCalculator');
const { getCigaretteStats, getLatestMaxHR } = require('../utils/sensorProcessor');

/**
 * POST /data/add
 * Add a health log entry (cigarette count + heart rate)
 */
const addData = async (req, res) => {
  try {
    const { cigaretteCount, heartRate } = req.body;
    const userId = req.user.id;

    if (cigaretteCount === undefined || heartRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide cigaretteCount and heartRate.',
      });
    }

    const db = getDatabase();
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = now.getHours();
    const timestamp = now.getTime();

    const logRef = db.ref(`healthLogs/${userId}/${dateKey}`).push();

    const logEntry = {
      timestamp,
      hour,
      cigaretteCount: Number(cigaretteCount),
      heartRate: Number(heartRate),
      createdAt: now.toISOString(),
    };

    await logRef.set(logEntry);

    res.status(201).json({
      success: true,
      message: 'Health data logged successfully.',
      data: { id: logRef.key, ...logEntry },
    });
  } catch (error) {
    console.error('Add data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging data.',
    });
  }
};

/**
 * GET /data/today
 * Get today's aggregated health data
 * — Cigarette count comes from processed cigaretteStats (sensor-derived)
 * — Heart rate still comes from manual healthLogs
 */
const getTodayData = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    // ── Cigarette count from processed sensor stats ──────────────
    const stats = await getCigaretteStats(db, userId);
    const totalCigarettes = stats.daily[today] || 0;

    // ── Heart rate: max HR from sensor window (last 10 min) ──────
    // getLatestMaxHR queries the last 10 min; falls back to last 20 entries
    const sensorMaxHR = await getLatestMaxHR(db);

    // ── Also read manual healthLogs for any manual heart-rate entries ─
    const logsSnapshot = await db.ref(`healthLogs/${userId}/${today}`).once('value');
    const logs = logsSnapshot.val();

    // Get user's daily limit
    const userSnapshot = await db.ref(`users/${userId}/dailyLimit`).once('value');
    const dailyLimit = userSnapshot.val() || 5;

    // Manual log heart rates (kept as fallback)
    let manualHRValues = [];
    if (logs) {
      Object.values(logs).forEach((log) => {
        if (log.heartRate) manualHRValues.push(log.heartRate);
      });
    }

    // Prefer sensor HR; fall back to manual logs
    const currentHR = sensorMaxHR > 0
      ? sensorMaxHR
      : manualHRValues.length > 0 ? Math.max(...manualHRValues) : 0;

    const avgHeartRate = sensorMaxHR > 0
      ? sensorMaxHR
      : manualHRValues.length > 0
        ? Math.round(manualHRValues.reduce((a, b) => a + b, 0) / manualHRValues.length)
        : 0;

    const maxHeartRate = sensorMaxHR > 0
      ? sensorMaxHR
      : manualHRValues.length > 0 ? Math.max(...manualHRValues) : 0;

    const minHeartRate = manualHRValues.length > 0 ? Math.min(...manualHRValues) : 0;

    const smokingStatus = calculateStatus(totalCigarettes, dailyLimit);
    const heartRateStatus = getHeartRateStatus(currentHR);
    const motivation = getMotivationalMessage(smokingStatus.status);

    // Hourly breakdown from manual logs
    const hourlyData = aggregateByHour(logs);

    res.json({
      success: true,
      data: {
        date: today,
        totalCigarettes,
        dailyLimit,
        smokingStatus,
        heartRate: {
          current: currentHR,
          average: avgHeartRate,
          max: maxHeartRate,
          min: minHeartRate,
          status: heartRateStatus,
        },
        motivation,
        hourlyData,
        logCount: logs ? Object.keys(logs).length : 0,
      },
    });
  } catch (error) {
    console.error('Get today data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * GET /data/date/:date
 * Get detailed data for a specific date
 */
const getDateData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params; // YYYY-MM-DD format
    const db = getDatabase();

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.',
      });
    }

    // ── Cigarette count from processed sensor stats ──────────────
    const stats = await getCigaretteStats(db, userId);
    const totalCigarettes = stats.daily[date] || 0;

    // ── Heart rate from manual healthLogs ─────────────────────────
    const logsSnapshot = await db.ref(`healthLogs/${userId}/${date}`).once('value');
    const logs = logsSnapshot.val();

    // Get user's daily limit
    const userSnapshot = await db.ref(`users/${userId}/dailyLimit`).once('value');
    const dailyLimit = userSnapshot.val() || 5;

    let heartRates = [];

    if (logs) {
      Object.values(logs).forEach((log) => {
        if (log.heartRate) {
          heartRates.push(log.heartRate);
        }
      });
    }

    const avgHeartRate =
      heartRates.length > 0
        ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
        : 0;
    const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;

    const smokingStatus = calculateStatus(totalCigarettes, dailyLimit);
    const hourlyData = aggregateByHour(logs);

    res.json({
      success: true,
      data: {
        date,
        totalCigarettes,
        dailyLimit,
        smokingStatus,
        heartRate: {
          average: avgHeartRate,
          max: maxHeartRate,
        },
        hourlyData,
        rawLogs: logs || {},
      },
    });
  } catch (error) {
    console.error('Get date data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * GET /data/month?month=YYYY-MM
 * Get monthly summary for calendar view
 */
const getMonthData = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    // Get month from query, default to current month
    const now = new Date();
    const month = req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get user's daily limit
    const userSnapshot = await db.ref(`users/${userId}/dailyLimit`).once('value');
    const dailyLimit = userSnapshot.val() || 5;

    // ── Cigarette counts from processed sensor stats ─────────────
    const stats = await getCigaretteStats(db, userId);
    const dailyCounts = stats.daily || {};

    // ── Heart rates from SENSOR data (grouped by date) ────────────
    // healthLogs are never populated in sensor-driven mode, so we
    // read HR directly from the /sensors node and group by date.
    const sensorsSnap = await db.ref('sensors').once('value');
    const allSensors = sensorsSnap.val() || {};

    const sensorDailyHR = {}; // { "YYYY-MM-DD": [hr, hr, ...] }
    Object.values(allSensors).forEach((entry) => {
      const raw = entry.timestamp ?? entry.Timestamp;
      if (!raw) return;
      const ms = new Date(raw).getTime();
      if (isNaN(ms)) return;
      const dk = new Date(ms).toISOString().split('T')[0];
      const hr = Number(entry.HR ?? entry.hr ?? entry.heartRate ?? 0);
      if (hr > 0) {
        if (!sensorDailyHR[dk]) sensorDailyHR[dk] = [];
        sensorDailyHR[dk].push(hr);
      }
    });

    // ── Include ALL days of the month up to today ─────────────────
    // Without this, smoke-free days (0 cigarettes, no logs) are
    // silently omitted and the frontend can't count them.
    const [year, mon] = month.split('-').map(Number);
    const today = now.toISOString().split('T')[0];
    const daysInMonth = new Date(year, mon, 0).getDate(); // total days in this month

    const monthSummary = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = `${month}-${String(d).padStart(2, '0')}`;
      if (dk > today) break; // don't include future days

      const totalCigarettes = dailyCounts[dk] || 0;
      const hrValues = sensorDailyHR[dk] || [];
      const avgHeartRate =
        hrValues.length > 0
          ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
          : 0;

      monthSummary[dk] = {
        totalCigarettes,
        avgHeartRate,
        status: calculateStatus(totalCigarettes, dailyLimit),
      };
    }

    res.json({
      success: true,
      data: {
        month,
        dailyLimit,
        days: monthSummary,
      },
    });
  } catch (error) {
    console.error('Get month data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * GET /data/weekly
 * Get weekly analytics data
 */
const getWeeklyData = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    const userSnapshot = await db.ref(`users/${userId}/dailyLimit`).once('value');
    const dailyLimit = userSnapshot.val() || 5;

    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // ── Cigarette counts from processed sensor stats ─────────────
    const stats = await getCigaretteStats(db, userId);
    const dailyCounts = stats.daily || {};

    // ── Heart rates from SENSOR data (grouped by date) ────────────
    // healthLogs are never populated in sensor-driven mode, so we
    // read HR directly from the /sensors node and group by date.
    const sensorsSnap = await db.ref('sensors').once('value');
    const allSensors = sensorsSnap.val() || {};

    const sensorDailyHR = {}; // { "YYYY-MM-DD": [hr, hr, ...] }
    Object.values(allSensors).forEach((entry) => {
      const raw = entry.timestamp ?? entry.Timestamp;
      if (!raw) return;
      const ms = new Date(raw).getTime();
      if (isNaN(ms)) return;
      const dk = new Date(ms).toISOString().split('T')[0];
      const hr = Number(entry.HR ?? entry.hr ?? entry.heartRate ?? 0);
      if (hr > 0) {
        if (!sensorDailyHR[dk]) sensorDailyHR[dk] = [];
        sensorDailyHR[dk].push(hr);
      }
    });

    const weeklyData = days.map((dateKey) => {
      const totalCigarettes = dailyCounts[dateKey] || 0;

      // Per-day average HR from sensor readings
      const hrValues = sensorDailyHR[dateKey] || [];
      const avgHeartRate =
        hrValues.length > 0
          ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
          : 0;

      return {
        date: dateKey,
        dayName: new Date(dateKey).toLocaleDateString('en', { weekday: 'short' }),
        totalCigarettes,
        avgHeartRate,
        status: calculateStatus(totalCigarettes, dailyLimit),
      };
    });

    // ── Weekly summary ────────────────────────────────────────────
    const totalWeekCigs = weeklyData.reduce((sum, d) => sum + d.totalCigarettes, 0);

    // Avg/Day = average on days the user ACTUALLY smoked (more meaningful)
    const smokingDays = weeklyData.filter((d) => d.totalCigarettes > 0).length;
    const avgWeekCigs =
      smokingDays > 0
        ? Math.round((totalWeekCigs / smokingDays) * 10) / 10
        : 0;

    // Avg BPM = average across days that have HR sensor readings
    const heartRateValues = weeklyData
      .filter((d) => d.avgHeartRate > 0)
      .map((d) => d.avgHeartRate);
    const avgWeekHR =
      heartRateValues.length > 0
        ? Math.round(heartRateValues.reduce((a, b) => a + b, 0) / heartRateValues.length)
        : 0;

    res.json({
      success: true,
      data: {
        days: weeklyData,
        summary: {
          totalCigarettes: totalWeekCigs,
          avgCigarettesPerDay: avgWeekCigs,
          avgHeartRate: avgWeekHR,
          smokeFreeDays: weeklyData.filter((d) => d.totalCigarettes === 0).length,
        },
      },
    });
  } catch (error) {
    console.error('Get weekly data error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /data/stats
 * Return the full processed cigaretteStats for the logged-in user.
 * Used by the frontend to fetch all daily counts at once.
 */
const getCigaretteStatsRaw = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();
    const stats = await getCigaretteStats(db, userId);

    res.json({
      success: true,
      data: {
        userId,
        daily: stats.daily || {},
        totalCount: stats.totalCount || 0,
        lastProcessedAt: stats.lastProcessedAt || null,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { addData, getTodayData, getDateData, getMonthData, getWeeklyData, getCigaretteStatsRaw };
