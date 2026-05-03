import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { shadows, borderRadius, spacing } from '../theme/typography';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { theme, isDarkMode } = useTheme();
  const [period, setPeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [weeklyData, setWeeklyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      if (period === 'weekly') {
        const res = await api.get('/data/weekly');
        if (res.data.success) {
          setWeeklyData(res.data.data);
        }
      } else {
        const res = await api.get('/data/month');
        if (res.data.success) {
          // Transform month data
          const days = res.data.data.days || {};
          const dayArray = Object.entries(days)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({
              date,
              dayName: new Date(date).getDate().toString(),
              totalCigarettes: data.totalCigarettes || 0,
              avgHeartRate: data.avgHeartRate || 0,
            }));

          const totalMonthCigs = dayArray.reduce((s, d) => s + d.totalCigarettes, 0);
          const smokingDaysInMonth = dayArray.filter((d) => d.totalCigarettes > 0).length;

          setWeeklyData({
            days: dayArray,
            summary: {
              totalCigarettes: totalMonthCigs,
              // Avg on days actually smoked (consistent with weekly view)
              avgCigarettesPerDay:
                smokingDaysInMonth > 0
                  ? Math.round((totalMonthCigs / smokingDaysInMonth) * 10) / 10
                  : 0,
              avgHeartRate: Math.round(
                dayArray.filter((d) => d.avgHeartRate > 0).reduce((s, d) => s + d.avgHeartRate, 0) /
                  Math.max(dayArray.filter((d) => d.avgHeartRate > 0).length, 1)
              ),
              // Now correct: backend includes ALL days up to today, so 0-cig days are in dayArray
              smokeFreeDays: dayArray.filter((d) => d.totalCigarettes === 0).length,
            },
          });
        }
      }
    } catch (error) {
      console.log('Using mock analytics data');
      // Generate mock weekly data
      const days = [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (let i = 0; i < 7; i++) {
        days.push({
          dayName: dayNames[i],
          totalCigarettes: Math.floor(Math.random() * 8),
          avgHeartRate: 65 + Math.floor(Math.random() * 25),
        });
      }
      setWeeklyData({
        days,
        summary: {
          totalCigarettes: days.reduce((s, d) => s + d.totalCigarettes, 0),
          avgCigarettesPerDay:
            Math.round((days.reduce((s, d) => s + d.totalCigarettes, 0) / 7) * 10) / 10,
          avgHeartRate: Math.round(
            days.reduce((s, d) => s + d.avgHeartRate, 0) / 7
          ),
          smokeFreeDays: days.filter((d) => d.totalCigarettes === 0).length,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      isDarkMode ? `rgba(162, 155, 254, ${opacity})` : `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) =>
      isDarkMode ? `rgba(230, 237, 243, ${opacity})` : `rgba(45, 52, 54, ${opacity})`,
    style: { borderRadius: 16 },
    barPercentage: 0.6,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const days = weeklyData?.days || [];
  const summary = weeklyData?.summary || {};

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your smoking & health trends
          </Text>
        </View>

        {/* Period Toggle */}
        <View style={[styles.toggleContainer, { backgroundColor: theme.card }, shadows.sm]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              period === 'weekly' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setPeriod('weekly')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: period === 'weekly' ? '#FFF' : theme.textSecondary },
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              period === 'monthly' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setPeriod('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: period === 'monthly' ? '#FFF' : theme.textSecondary },
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={styles.statIcon}>🚬</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {summary.totalCigarettes || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {summary.avgCigarettesPerDay || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg/Day</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={styles.statIcon}>💚</Text>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {summary.smokeFreeDays || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Smoke-Free</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={[styles.statValue, { color: theme.heartRate }]}>
              {summary.avgHeartRate || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg BPM</Text>
          </View>
        </View>

        {/* Smoking Trend Chart */}
        {days.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>🚬 Smoking Trend</Text>
            <BarChart
              data={{
                labels: days.slice(-7).map((d) => d.dayName || ''),
                datasets: [{ data: days.slice(-7).map((d) => d.totalCigarettes || 0) }],
              }}
              width={screenWidth - 72}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        )}

        {/* Heart Rate Trend Chart */}
        {days.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>❤️ Heart Rate Trend</Text>
            <LineChart
              data={{
                labels: days.slice(-7).map((d) => d.dayName || ''),
                datasets: [
                  {
                    data: days.slice(-7).map((d) => d.avgHeartRate || 70),
                    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                  },
                ],
              }}
              width={screenWidth - 72}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
              }}
              style={styles.chart}
              bezier
              fromZero={false}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    width: (screenWidth - 54) / 2,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  chartCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
});
