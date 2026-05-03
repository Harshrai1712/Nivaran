/**
 * Calculate smoking status based on cigarette count relative to the user's daily limit.
 *
 * Thresholds are proportional to dailyLimit so the risk level scales
 * correctly regardless of the user's personal goal:
 *
 *   0                      → Normal   (smoke-free)
 *   1 – 33 % of limit      → Very Few (low risk)
 *   34 % – 99 % of limit   → Moderate (approaching limit)
 *   ≥ 100 % of limit       → High     (limit reached / exceeded)
 *
 * @param {number} count      - Number of cigarettes smoked today
 * @param {number} dailyLimit - User's personal daily limit (default 5)
 * @returns {{ status: string, color: string, level: number, percentage: number }}
 */
function calculateStatus(count, dailyLimit = 5) {
  const limit = Math.max(dailyLimit, 1); // guard against 0-limit edge case
  const percentage = Math.round((count / limit) * 100);

  if (count === 0) {
    return { status: 'Normal',   color: '#00B894', level: 0, percentage };
  } else if (percentage <= 33) {
    return { status: 'Very Few', color: '#74B9FF', level: 1, percentage };
  } else if (percentage < 100) {
    return { status: 'Moderate', color: '#FDCB6E', level: 2, percentage };
  } else {
    return { status: 'High',     color: '#E17055', level: 3, percentage };
  }
}

/**
 * Get heart rate status based on BPM
 * @param {number} bpm - Heart rate in beats per minute
 * @returns {{ status: string, isNormal: boolean }}
 */
function getHeartRateStatus(bpm) {
  if (bpm < 60) {
    return { status: 'Low', isNormal: false };
  } else if (bpm <= 100) {
    return { status: 'Normal', isNormal: true };
  } else if (bpm <= 120) {
    return { status: 'Elevated', isNormal: false };
  } else {
    return { status: 'High', isNormal: false };
  }
}

/**
 * Get motivational message based on smoking status
 * @param {string} status - Current smoking status
 * @returns {string}
 */
function getMotivationalMessage(status) {
  const messages = {
    Normal: [
      "🎉 Great job! You're smoke-free today!",
      "💪 Keep it up! Your lungs thank you!",
      "🌟 Amazing! Zero cigarettes today!",
      "🏆 Champion! Stay strong!",
    ],
    'Very Few': [
      "👍 Not bad! Try to cut down more tomorrow.",
      "🌱 Progress is progress! Keep going!",
      "💚 You're doing better than average!",
    ],
    Moderate: [
      "⚠️ Watch out! You're approaching your limit.",
      "🔔 Time to take a break from smoking.",
      "💛 Consider a healthier alternative right now.",
    ],
    High: [
      "🚨 Limit crossed! Please take care of your health.",
      "❤️ Your body needs a break. Stop now.",
      "⛔ Too many today! Try deep breathing instead.",
    ],
  };

  const statusMessages = messages[status] || messages.Normal;
  return statusMessages[Math.floor(Math.random() * statusMessages.length)];
}

/**
 * Group health logs by hour for charting
 * @param {Object} logs - Raw log entries
 * @returns {Array} Hourly aggregated data
 */
function aggregateByHour(logs) {
  const hourly = {};

  // Initialize all 24 hours
  for (let i = 0; i < 24; i++) {
    hourly[i] = { hour: i, cigaretteCount: 0, heartRates: [], avgHeartRate: 0 };
  }

  if (logs) {
    Object.values(logs).forEach((log) => {
      const hour = log.hour || new Date(log.timestamp).getHours();
      if (hourly[hour]) {
        hourly[hour].cigaretteCount += log.cigaretteCount || 0;
        if (log.heartRate) {
          hourly[hour].heartRates.push(log.heartRate);
        }
      }
    });
  }

  // Calculate averages
  Object.values(hourly).forEach((h) => {
    if (h.heartRates.length > 0) {
      h.avgHeartRate = Math.round(
        h.heartRates.reduce((a, b) => a + b, 0) / h.heartRates.length
      );
    }
    delete h.heartRates;
  });

  return Object.values(hourly);
}

module.exports = {
  calculateStatus,
  getHeartRateStatus,
  getMotivationalMessage,
  aggregateByHour,
};
