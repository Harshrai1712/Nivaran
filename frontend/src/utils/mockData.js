/**
 * Mock Data Generator
 * Simulates wristband sensor data for demo purposes
 */

/**
 * Generate a random heart rate (simulating wristband sensor)
 * Normal range: 60-100 BPM
 * Elevated (after smoking): 85-120 BPM
 */
export function generateHeartRate(isSmoking = false) {
  if (isSmoking) {
    return Math.floor(85 + Math.random() * 35); // 85-120 BPM
  }
  return Math.floor(60 + Math.random() * 40); // 60-100 BPM
}

/**
 * Generate mock cigarette detection event
 * Probability-based: ~15% chance per check
 */
export function detectCigarette() {
  return Math.random() < 0.15;
}

/**
 * Generate a full day's worth of mock data for demonstration
 */
export function generateDayMockData() {
  const hourlyData = [];
  let totalCigarettes = 0;

  for (let hour = 6; hour <= 23; hour++) {
    const isSmoking = detectCigarette();
    const cigaretteCount = isSmoking ? Math.ceil(Math.random() * 2) : 0;
    totalCigarettes += cigaretteCount;

    hourlyData.push({
      hour,
      cigaretteCount,
      heartRate: generateHeartRate(isSmoking),
      label: `${hour}:00`,
    });
  }

  return { hourlyData, totalCigarettes };
}

/**
 * Calculate smoking status from count
 */
export function getSmokingStatus(count, limit = 5) {
  if (count === 0) return { status: 'Normal', color: '#00B894', level: 0 };
  if (count <= 2) return { status: 'Very Few', color: '#74B9FF', level: 1 };
  if (count <= 5) return { status: 'Moderate', color: '#FDCB6E', level: 2 };
  return { status: 'High', color: '#E17055', level: 3 };
}

/**
 * Get motivational message
 */
export function getMotivation(status) {
  const messages = {
    Normal: [
      "🎉 Great job! You're smoke-free today!",
      "💪 Keep it up! Your lungs thank you!",
      "🌟 Amazing willpower! Zero cigarettes!",
    ],
    'Very Few': [
      "👍 Not bad! Try even fewer tomorrow.",
      "🌱 Progress is progress! Keep going!",
    ],
    Moderate: [
      "⚠️ Watch your intake. Take a break.",
      "🔔 Approaching your limit. Stay mindful.",
    ],
    High: [
      "🚨 Limit crossed! Your health matters.",
      "❤️ Time to stop. Try deep breathing.",
    ],
  };
  const list = messages[status] || messages.Normal;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate month mock data for calendar
 */
export function generateMonthMockData(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const pattern = Math.random();
    let totalCigarettes;

    if (pattern < 0.3) totalCigarettes = 0;
    else if (pattern < 0.55) totalCigarettes = Math.ceil(Math.random() * 2);
    else if (pattern < 0.85) totalCigarettes = 3 + Math.floor(Math.random() * 3);
    else totalCigarettes = 6 + Math.floor(Math.random() * 4);

    const status = getSmokingStatus(totalCigarettes);
    days[dateKey] = {
      totalCigarettes,
      avgHeartRate: 65 + Math.floor(Math.random() * 25),
      status,
    };
  }

  return days;
}
