const { getDatabase } = require('../config/firebase');
const {
  calculateStatus,
  getHeartRateStatus,
  getMotivationalMessage,
  aggregateByHour,
} = require('../utils/statusCalculator');

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
 */
const getTodayData = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    // Get today's logs
    const logsSnapshot = await db.ref(`healthLogs/${userId}/${today}`).once('value');
    const logs = logsSnapshot.val();

    // Get user's daily limit
    const userSnapshot = await db.ref(`users/${userId}/dailyLimit`).once('value');
    const dailyLimit = userSnapshot.val() || 5;

    // Calculate aggregates
    let totalCigarettes = 0;
    let heartRates = [];
    let latestHeartRate = 0;

    if (logs) {
      Object.values(logs).forEach((log) => {
        totalCigarettes += log.cigaretteCount || 0;
        if (log.heartRate) {
          heartRates.push(log.heartRate);
          latestHeartRate = log.heartRate;
        }
      });
    }

    const avgHeartRate =
      heartRates.length > 0
        ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
        : 0;
    const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;
    const minHeartRate = heartRates.length > 0 ? Math.min(...heartRates) : 0;

    const smokingStatus = calculateStatus(totalCigarettes, dailyLimit);
    const heartRateStatus = getHeartRateStatus(latestHeartRate || avgHeartRate);
    const motivation = getMotivationalMessage(smokingStatus.status);

    // Get hourly breakdown
    const hourlyData = aggregateByHour(logs);

    res.json({
      success: true,
      data: {
        date: today,
        totalCigarettes,
        dailyLimit,
        smokingStatus,
        heartRate: {
          current: latestHeartRate,
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

    // Get logs for the date
    const logsSnapshot = await db.ref(`healthLogs/${userId}/${date}`).once('value');
    const logs = logsSnapshot.val();

    // Get user's daily limit
    const userSnapshot = await db.ref(`users/${userId}/dailyLimit`).once('value');
    const dailyLimit = userSnapshot.val() || 5;

    // Calculate aggregates
    let totalCigarettes = 0;
    let heartRates = [];

    if (logs) {
      Object.values(logs).forEach((log) => {
        totalCigarettes += log.cigaretteCount || 0;
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

    // Get all health logs for the user
    const logsSnapshot = await db.ref(`healthLogs/${userId}`).once('value');
    const allLogs = logsSnapshot.val() || {};

    // Filter and aggregate by date for the requested month
    const monthSummary = {};

    Object.keys(allLogs).forEach((dateKey) => {
      if (dateKey.startsWith(month)) {
        const dayLogs = allLogs[dateKey];
        let totalCigarettes = 0;
        let heartRates = [];

        Object.values(dayLogs).forEach((log) => {
          totalCigarettes += log.cigaretteCount || 0;
          if (log.heartRate) heartRates.push(log.heartRate);
        });

        const avgHeartRate =
          heartRates.length > 0
            ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
            : 0;

        monthSummary[dateKey] = {
          totalCigarettes,
          avgHeartRate,
          status: calculateStatus(totalCigarettes, dailyLimit),
        };
      }
    });

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

    const logsSnapshot = await db.ref(`healthLogs/${userId}`).once('value');
    const allLogs = logsSnapshot.val() || {};

    const weeklyData = days.map((dateKey) => {
      const dayLogs = allLogs[dateKey] || {};
      let totalCigarettes = 0;
      let heartRates = [];

      Object.values(dayLogs).forEach((log) => {
        totalCigarettes += log.cigaretteCount || 0;
        if (log.heartRate) heartRates.push(log.heartRate);
      });

      const avgHeartRate =
        heartRates.length > 0
          ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
          : 0;

      return {
        date: dateKey,
        dayName: new Date(dateKey).toLocaleDateString('en', { weekday: 'short' }),
        totalCigarettes,
        avgHeartRate,
        status: calculateStatus(totalCigarettes, dailyLimit),
      };
    });

    // Calculate weekly averages
    const totalWeekCigs = weeklyData.reduce((sum, d) => sum + d.totalCigarettes, 0);
    const avgWeekCigs = Math.round((totalWeekCigs / 7) * 10) / 10;
    const heartRateValues = weeklyData.filter((d) => d.avgHeartRate > 0).map((d) => d.avgHeartRate);
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
          smokeFreedays: weeklyData.filter((d) => d.totalCigarettes === 0).length,
        },
      },
    });
  } catch (error) {
    console.error('Get weekly data error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { addData, getTodayData, getDateData, getMonthData, getWeeklyData };
