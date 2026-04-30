import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { shadows, borderRadius, spacing } from '../theme/typography';

const screenWidth = Dimensions.get('window').width;

export default function HeartRateChart({ data = [], title = 'Heart Rate Variation' }) {
  const { theme, isDarkMode } = useTheme();

  // Filter to hours that have heart rate data
  const filteredData = data.filter((d) => d.avgHeartRate > 0);
  const displayData = filteredData.length > 0 ? filteredData : [];

  const chartData = {
    labels: displayData.map((d, i) => (i % 3 === 0 ? `${d.hour}h` : '')),
    datasets: [
      {
        data: displayData.length > 0 ? displayData.map((d) => d.avgHeartRate) : [0],
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(230, 237, 243, ${opacity})` : `rgba(45, 52, 54, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#FF6B6B',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
  };

  if (displayData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, shadows.md]}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💓</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No heart rate data
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, shadows.md]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendDot} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>BPM</Text>
        </View>
      </View>
      <LineChart
        data={chartData}
        width={screenWidth - 72}
        height={200}
        chartConfig={chartConfig}
        style={styles.chart}
        bezier
        withInnerLines={true}
        withOuterLines={false}
        fromZero={false}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
