import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getStatusColor } from '../theme/colors';
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/statusHelper';
import { shadows, borderRadius, spacing } from '../theme/typography';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * CalendarView
 *
 * Props:
 *  - monthData   : { "YYYY-MM-DD": { totalCigarettes, status } }
 *  - onDatePress : (dateKey: string) => void
 *  - selectedDate: string | undefined
 *  - onMonthChange: ({ year, month }) => void — called when user navigates months
 */
export default function CalendarView({ monthData = {}, onDatePress, selectedDate, onMonthChange }) {
  const { theme, isDarkMode } = useTheme();
  const themeKey = isDarkMode ? 'dark' : 'light';

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const navigateTo = useCallback(
    (year, month) => {
      setCurrentYear(year);
      setCurrentMonth(month);
      // Notify parent so it can fetch the right month's data
      if (onMonthChange) {
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        onMonthChange({ year, month, monthStr });
      }
    },
    [onMonthChange]
  );

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      navigateTo(currentYear - 1, 12);
    } else {
      navigateTo(currentYear, currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      navigateTo(currentYear + 1, 1);
    } else {
      navigateTo(currentYear, currentMonth + 1);
    }
  };

  const renderDays = () => {
    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = monthData[dateKey];
      const status = dayData?.status?.status || null;
      const isToday =
        day === now.getDate() &&
        currentMonth === now.getMonth() + 1 &&
        currentYear === now.getFullYear();
      const isSelected = dateKey === selectedDate;

      let bgColor = 'transparent';
      if (status) {
        bgColor = getStatusColor(status, themeKey);
      }

      cells.push(
        <TouchableOpacity
          key={dateKey}
          style={[
            styles.dayCell,
            status && { backgroundColor: bgColor + '30' },
            isToday && styles.todayCell,
            isSelected && styles.selectedCell,
          ]}
          onPress={() => onDatePress && onDatePress(dateKey)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayText,
              { color: theme.text },
              status && { color: bgColor, fontWeight: '700' },
              isToday && { color: theme.primary },
              isSelected && { color: '#FFFFFF' },
            ]}
          >
            {day}
          </Text>
          {status && (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: bgColor },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, shadows.md]}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <Text style={[styles.navText, { color: theme.primary }]}>◀</Text>
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.text }]}>{monthName}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Text style={[styles.navText, { color: theme.primary }]}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: theme.textSecondary }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Day Grid */}
      <View style={styles.daysGrid}>{renderDays()}</View>

      {/* Color Legend */}
      <View style={styles.legend}>
        {[
          { label: 'Normal', color: theme.statusNormal },
          { label: 'Very Few', color: theme.statusVeryFew },
          { label: 'Moderate', color: theme.statusModerate },
          { label: 'High', color: theme.statusHigh },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navButton: {
    padding: spacing.sm,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  selectedCell: {
    backgroundColor: '#6C63FF',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
