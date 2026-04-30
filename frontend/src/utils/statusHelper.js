/**
 * Status helper utilities
 */

export function getStatusEmoji(status) {
  switch (status) {
    case 'Normal': return '✅';
    case 'Very Few': return '💙';
    case 'Moderate': return '⚠️';
    case 'High': return '🚨';
    default: return '✅';
  }
}

export function getHeartRateEmoji(bpm) {
  if (bpm < 60) return '💙';
  if (bpm <= 100) return '💚';
  if (bpm <= 120) return '💛';
  return '❤️';
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(hour) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}
