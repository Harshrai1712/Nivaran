import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSmokingStatus, generateDayMockData } from '../utils/mockData';
import { formatDate, getStatusEmoji } from '../utils/statusHelper';
import { getStatusColor, getStatusGradient } from '../theme/colors';
import { shadows, borderRadius, spacing } from '../theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import SmokingChart from '../components/SmokingChart';
import HeartRateChart from '../components/HeartRateChart';

export default function DayDetailScreen({ route, navigation }) {
  const { date } = route.params;
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDateData();
  }, [date]);

  const fetchDateData = async () => {
    try {
      const response = await api.get(`/data/date/${date}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      // Use mock data
      console.log('Using mock data for day detail');
      const mockDay = generateDayMockData();
      const status = getSmokingStatus(mockDay.totalCigarettes);

      setData({
        date,
        totalCigarettes: mockDay.totalCigarettes,
        dailyLimit: user?.dailyLimit || 5,
        smokingStatus: status,
        heartRate: {
          average: 78,
          max: 102,
        },
        hourlyData: mockDay.hourlyData,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const status = data?.smokingStatus?.status || 'Normal';
  const gradientColors = getStatusGradient(status);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Date Header */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerDate}>{formatDate(date)}</Text>
          <Text style={styles.headerStatus}>
            {getStatusEmoji(status)} {status}
          </Text>
        </LinearGradient>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={styles.summaryIcon}>🚬</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {data?.totalCigarettes || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Total Cigarettes
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={styles.summaryIcon}>❤️</Text>
            <Text style={[styles.summaryValue, { color: theme.heartRate }]}>
              {data?.heartRate?.max || '--'}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Max Heart Rate
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.card }, shadows.md]}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={[styles.summaryValue, { color: getStatusColor(status, isDarkMode ? 'dark' : 'light') }]}>
              {status}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Risk Level
            </Text>
          </View>
        </View>

        {/* Average HR Card */}
        <View style={[styles.avgCard, { backgroundColor: theme.card }, shadows.md]}>
          <View style={styles.avgRow}>
            <View style={styles.avgItem}>
              <Text style={[styles.avgLabel, { color: theme.textSecondary }]}>Avg Heart Rate</Text>
              <Text style={[styles.avgValue, { color: theme.text }]}>
                {data?.heartRate?.average || '--'} BPM
              </Text>
            </View>
            <View style={[styles.avgDivider, { backgroundColor: theme.border }]} />
            <View style={styles.avgItem}>
              <Text style={[styles.avgLabel, { color: theme.textSecondary }]}>Daily Limit</Text>
              <Text style={[styles.avgValue, { color: theme.text }]}>
                {data?.dailyLimit || 5} cigs
              </Text>
            </View>
          </View>
        </View>

        {/* Charts */}
        <SmokingChart
          data={data?.hourlyData || []}
          title="Cigarette Intake by Hour"
        />

        <HeartRateChart
          data={data?.hourlyData || []}
          title="Heart Rate Throughout Day"
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  headerDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerStatus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -10,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: 14,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },
  avgCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgItem: {
    flex: 1,
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  avgValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  avgDivider: {
    width: 1,
    height: 40,
  },
});
