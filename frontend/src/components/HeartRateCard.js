import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadows, borderRadius, spacing } from '../theme/typography';

export default function HeartRateCard({ bpm = 0, status = 'Normal' }) {
  const { theme } = useTheme();

  const getStatusText = () => {
    if (bpm === 0) return 'No data';
    if (bpm < 60) return 'Below Normal';
    if (bpm <= 100) return 'Normal';
    if (bpm <= 120) return 'Elevated';
    return 'High';
  };

  const getStatusColor = () => {
    if (bpm === 0) return theme.textTertiary;
    if (bpm < 60) return theme.info;
    if (bpm <= 100) return theme.success;
    if (bpm <= 120) return theme.warning;
    return theme.error;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, shadows.md]}>
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: theme.heartRateLight }]}>
          <Text style={styles.heartIcon}>❤️</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Heart Rate</Text>
          <Text style={[styles.statusBadge, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.bpmValue, { color: theme.heartRate }]}>
          {bpm || '--'}
        </Text>
        <Text style={[styles.bpmUnit, { color: theme.textSecondary }]}>BPM</Text>
      </View>

      {/* Simple pulse animation dots */}
      <View style={styles.pulseRow}>
        {[...Array(8)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.pulseDot,
              {
                backgroundColor: theme.heartRate,
                height: 4 + Math.sin(i * 0.8) * 12,
                opacity: 0.3 + Math.sin(i * 0.8) * 0.7,
              },
            ]}
          />
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heartIcon: {
    fontSize: 22,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  bpmValue: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  bpmUnit: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 24,
    paddingHorizontal: spacing.lg,
  },
  pulseDot: {
    width: 3,
    borderRadius: 2,
  },
});
