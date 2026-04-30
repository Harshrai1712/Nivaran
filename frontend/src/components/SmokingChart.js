import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { shadows, borderRadius, spacing } from '../theme/typography';

const screenWidth = Dimensions.get('window').width;

export default function SmokingChart({ data = [], title = 'Cigarette Intake' }) {
  const { theme, isDarkMode } = useTheme();

  // Prepare chart data - show hours with data
  const filteredData = data.filter((d) => d.cigaretteCount > 0 || d.avgHeartRate > 0);
  const displayData = filteredData.length > 0 ? filteredData : data.slice(2, 14); // 8AM-8PM

  const chartData = {
    labels: displayData.map((d, i) => (i % 3 === 0 ? `${d.hour}h` : '')),
    datasets: [
      {
        data: displayData.map((d) => d.cigaretteCount || 0),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => isDarkMode ? `rgba(162, 155, 254, ${opacity})` : `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(230, 237, 243, ${opacity})` : `rgba(45, 52, 54, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.6,
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
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, shadows.md]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 72}
        height={200}
        chartConfig={chartConfig}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
        withInnerLines={true}
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
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
