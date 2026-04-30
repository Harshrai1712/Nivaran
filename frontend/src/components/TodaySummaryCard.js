import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadows, borderRadius, spacing } from '../theme/typography';

export default function TodaySummaryCard({ cigarettes = 0, dailyLimit = 5, riskLevel = 'Normal' }) {
  const { theme } = useTheme();

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'Normal': return theme.statusNormal;
      case 'Very Few': return theme.statusVeryFew;
      case 'Moderate': return theme.statusModerate;
      case 'High': return theme.statusHigh;
      default: return theme.statusNormal;
    }
  };

  const percentage = Math.min((cigarettes / dailyLimit) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, shadows.md]}>
      <Text style={[styles.title, { color: theme.text }]}>Today's Summary</Text>

      <View style={styles.statsRow}>
        {/* Cigarettes Count */}
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🚬</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{cigarettes}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Cigarettes</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Daily Limit */}
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{dailyLimit}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Limit</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Risk Level */}
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={[styles.statValue, { color: getRiskColor() }]}>{riskLevel}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Risk Level</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getRiskColor(),
                width: `${percentage}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {cigarettes}/{dailyLimit} ({Math.round(percentage)}%)
        </Text>
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 50,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
});
