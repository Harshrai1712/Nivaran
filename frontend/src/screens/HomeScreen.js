import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { generateMonthMockData, getSmokingStatus, getMotivation } from '../utils/mockData';

import StatusBanner from '../components/StatusBanner';
import CalendarView from '../components/CalendarView';
import HeartRateCard from '../components/HeartRateCard';
import TodaySummaryCard from '../components/TodaySummaryCard';
import MotivationalText from '../components/MotivationalText';
import HealthTree from '../components/HealthTree';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayData, setTodayData] = useState(null);
  const [monthData, setMonthData] = useState({});
  const [error, setError] = useState(null);

  // Track which month the calendar is currently showing
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [calendarMonth, setCalendarMonth] = useState(currentMonthStr);

  // Cache of month data already fetched — avoids redundant API calls
  const monthCache = useRef({});

  /**
   * Fetch month data for a specific YYYY-MM string.
   * Uses an in-memory cache so navigating back to a visited month is instant.
   */
  const fetchMonthData = useCallback(async (monthStr) => {
    // Return cached result if available
    if (monthCache.current[monthStr]) {
      setMonthData(monthCache.current[monthStr]);
      return;
    }

    try {
      const res = await api.get(`/data/month?month=${monthStr}`);
      if (res.data.success) {
        const days = res.data.data.days || {};
        monthCache.current[monthStr] = days;
        setMonthData(days);
      }
    } catch {
      // Silently fall back — keep showing whatever was there
      console.log(`[HomeScreen] Could not fetch month ${monthStr}, using cached/mock data`);
    }
  }, []);

  /**
   * Fetch today's stats and the current calendar month data.
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      try {
        const [todayRes, monthRes] = await Promise.all([
          api.get('/data/today'),
          api.get(`/data/month?month=${currentMonthStr}`),
        ]);

        if (todayRes.data.success) {
          setTodayData(todayRes.data.data);
        }
        if (monthRes.data.success) {
          const days = monthRes.data.data.days || {};
          monthCache.current[currentMonthStr] = days;
          // Only update the displayed month data if calendar is still on current month
          setCalendarMonth((cm) => {
            if (cm === currentMonthStr) setMonthData(days);
            return cm;
          });
        }
      } catch (apiError) {
        // API unavailable — use mock data for demo
        console.log('Using mock data (API unavailable):', apiError.message);
        const nowDate = new Date();
        const mockMonth = generateMonthMockData(nowDate.getFullYear(), nowDate.getMonth() + 1);
        monthCache.current[currentMonthStr] = mockMonth;
        setMonthData(mockMonth);

        const todayKey = nowDate.toISOString().split('T')[0];
        const todayMock = mockMonth[todayKey] || { totalCigarettes: 0, avgHeartRate: 72 };
        const status = getSmokingStatus(todayMock.totalCigarettes);

        setTodayData({
          date: todayKey,
          totalCigarettes: todayMock.totalCigarettes,
          dailyLimit: user?.dailyLimit || 5,
          smokingStatus: status,
          heartRate: {
            current: todayMock.avgHeartRate,
            average: todayMock.avgHeartRate,
            max: todayMock.avgHeartRate + 15,
            min: todayMock.avgHeartRate - 10,
            status: { status: 'Normal', isNormal: true },
          },
          motivation: getMotivation(status.status),
        });
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentMonthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll every 30 seconds for fresh today's data
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear cache for current month so we get fresh data
    delete monthCache.current[calendarMonth];
    await fetchData();
    setRefreshing(false);
  };

  const handleDatePress = (dateKey) => {
    navigation.navigate('DayDetail', { date: dateKey });
  };

  /**
   * Called by CalendarView when the user taps ◀ or ▶.
   * Fetches (or loads from cache) the new month's data.
   */
  const handleMonthChange = useCallback(
    ({ monthStr }) => {
      setCalendarMonth(monthStr);
      fetchMonthData(monthStr);
    },
    [fetchMonthData]
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your health data...
        </Text>
      </View>
    );
  }

  const smokingStatus = todayData?.smokingStatus?.status || 'Normal';
  const heartRate = todayData?.heartRate?.current || 0;
  const totalCigarettes = todayData?.totalCigarettes || 0;
  const dailyLimit = todayData?.dailyLimit || user?.dailyLimit || 5;
  const motivation = todayData?.motivation || getMotivation(smokingStatus);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Status Banner */}
        <StatusBanner
          status={smokingStatus}
          cigarettes={totalCigarettes}
          dailyLimit={dailyLimit}
        />

        {/* Welcome text */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            Hello, {user?.name || 'User'} 👋
          </Text>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Today's Summary */}
        <TodaySummaryCard
          cigarettes={totalCigarettes}
          dailyLimit={dailyLimit}
          riskLevel={smokingStatus}
        />

        {/* Health Tree */}
        <HealthTree
          riskLevel={smokingStatus}
          cigarettes={totalCigarettes}
          dailyLimit={dailyLimit}
        />

        {/* Heart Rate */}
        <HeartRateCard bpm={heartRate} />

        {/* Motivational Text */}
        <MotivationalText status={smokingStatus} message={motivation} />

        {/* Calendar — now supports multi-month navigation with lazy fetch */}
        <CalendarView
          monthData={monthData}
          onDatePress={handleDatePress}
          onMonthChange={handleMonthChange}
        />

        {/* Bottom spacer */}
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 14,
    marginTop: 2,
  },
});
