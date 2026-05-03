import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadows, borderRadius, spacing } from '../theme/typography';

/**
 * TodaySummaryCard
 *
 * Displays:
 *  - Cigarette count for today
 *  - Daily limit
 *  - Risk level:
 *      Normal   → 0 cigarettes (smoke-free)
 *      Very Few → 1–2 (within limit)
 *      Moderate → 3–5 (within limit)
 *      High     → count >= dailyLimit (limit reached/exceeded)
 *
 * The `riskLevel` prop should be one of: 'Normal' | 'Very Few' | 'Moderate' | 'High'
 * It is computed by the backend's calculateStatus() function.
 */
export default function TodaySummaryCard({ cigarettes = 0, dailyLimit = 5, riskLevel }) {
  const { theme } = useTheme();

  /**
   * Derive risk level proportionally to dailyLimit.
   *
   *   0              → Normal   (smoke-free)
   *   1–33% of limit → Very Few
   *   34–99%         → Moderate
   *   ≥ 100%         → High     (limit reached / exceeded)
   *
   * If the backend already sent a computed riskLevel AND the count is
   * still under the limit, trust the backend value. Otherwise recompute.
   */
  const derivedRisk = (() => {
    const limit = Math.max(dailyLimit, 1);
    const pct = (cigarettes / limit) * 100;

    if (cigarettes === 0)  return 'Normal';
    if (pct >= 100)        return 'High';       // limit reached / exceeded
    if (pct >= 34)         return 'Moderate';   // 34–99 % of limit
    return 'Very Few';                          // 1–33 % of limit
  })();

  const getRiskColor = () => {
    switch (derivedRisk) {
      case 'Normal':   return theme.statusNormal;
      case 'Very Few': return theme.statusVeryFew;
      case 'Moderate': return theme.statusModerate;
      case 'High':     return theme.statusHigh;
      default:         return theme.statusNormal;
    }
  };

  const getRiskIcon = () => {
    switch (derivedRisk) {
      case 'Normal':   return '✅';
      case 'Very Few': return '🟡';
      case 'Moderate': return '🟠';
      case 'High':     return '🔴';
      default:         return '✅';
    }
  };

  const percentage = dailyLimit > 0
    ? Math.min((cigarettes / dailyLimit) * 100, 100)
    : 0;

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
          <Text style={styles.statIcon}>{getRiskIcon()}</Text>
          <Text style={[styles.statValue, { color: getRiskColor() }]}>{derivedRisk}</Text>
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
          {cigarettes}/{dailyLimit} ({Math.round(percentage)}% of daily limit)
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
