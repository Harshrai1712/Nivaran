import React, { useState, useEffect, useCallback } from 'react';
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

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayData, setTodayData] = useState(null);
  const [monthData, setMonthData] = useState({});
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Try to fetch from API
      try {
        const [todayRes, monthRes] = await Promise.all([
          api.get('/data/today'),
          api.get('/data/month'),
        ]);

        if (todayRes.data.success) {
          setTodayData(todayRes.data.data);
        }
        if (monthRes.data.success) {
          setMonthData(monthRes.data.data.days || {});
        }
      } catch (apiError) {
        // If API fails, use mock data for demo
        console.log('Using mock data (API unavailable):', apiError.message);
        const now = new Date();
        const mockMonth = generateMonthMockData(now.getFullYear(), now.getMonth() + 1);
        setMonthData(mockMonth);

        // Generate today's mock data
        const todayKey = now.toISOString().split('T')[0];
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
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for simulated real-time updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleDatePress = (dateKey) => {
    navigation.navigate('DayDetail', { date: dateKey });
  };

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
        <StatusBanner status={smokingStatus} />

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

        {/* Heart Rate */}
        <HeartRateCard bpm={heartRate} />

        {/* Motivational Text */}
        <MotivationalText status={smokingStatus} message={motivation} />

        {/* Calendar */}
        <CalendarView monthData={monthData} onDatePress={handleDatePress} />

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
