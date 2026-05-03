import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { shadows, borderRadius, spacing } from '../theme/typography';
import api from '../services/api';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [profileStats, setProfileStats] = useState({
    daysTracked: 0,
    avgCigarettes: 0,
    bestStreak: 0,
    avgHeartRate: 0,
  });

  useEffect(() => {
    fetchProfileStats();
  }, []);

  const fetchProfileStats = async () => {
    try {
      // Fetch today + weekly data in parallel
      const [todayRes, weeklyRes] = await Promise.allSettled([
        api.get('/data/today'),
        api.get('/data/weekly'),
      ]);

      let avgCigarettes = 0;
      let avgHeartRate = 0;
      let daysTracked = 0;
      let bestStreak = 0;

      // Weekly data for avg cigarettes, days tracked, streak
      if (weeklyRes.status === 'fulfilled' && weeklyRes.value.data.success) {
        const { days, summary } = weeklyRes.value.data.data;
        avgCigarettes = summary.avgCigarettesPerDay || 0;
        avgHeartRate = summary.avgHeartRate || 0;
        daysTracked = days.filter((d) => d.totalCigarettes > 0 || d.avgHeartRate > 0).length;

        // Calculate best streak: consecutive days with cigarettes < dailyLimit
        const dailyLimit = user?.dailyLimit || 5;
        let currentStreak = 0;
        let maxStreak = 0;
        [...days].reverse().forEach((d) => {
          if (d.totalCigarettes < dailyLimit) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        });
        bestStreak = maxStreak;
      }

      // Today's heart rate (more accurate if available)
      if (todayRes.status === 'fulfilled' && todayRes.value.data.success) {
        const today = todayRes.value.data.data;
        if (today.heartRate?.average > 0) {
          avgHeartRate = today.heartRate.average;
        }
      }

      setProfileStats({
        daysTracked,
        avgCigarettes: Math.round(avgCigarettes * 10) / 10,
        bestStreak,
        avgHeartRate,
      });
    } catch (err) {
      console.log('Profile stats fetch error:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const stats = [
    { icon: '📅', label: 'Days Tracked', value: statsLoading ? '…' : String(profileStats.daysTracked) },
    { icon: '🚬', label: 'Avg Cigarettes', value: statsLoading ? '…' : String(profileStats.avgCigarettes) },
    { icon: '💚', label: 'Best Streak', value: statsLoading ? '…' : `${profileStats.bestStreak} days` },
    { icon: '❤️', label: 'Avg Heart Rate', value: statsLoading ? '…' : profileStats.avgHeartRate > 0 ? `${profileStats.avgHeartRate} BPM` : '--' },
  ];


  const achievements = [
    { icon: '🌟', title: 'First Day', desc: 'Completed your first day' },
    { icon: '🏆', title: 'Smoke Free', desc: '3 consecutive smoke-free days' },
    { icon: '💪', title: 'Under Limit', desc: 'Stayed under limit for a week' },
    { icon: '🎯', title: 'Consistent', desc: 'Tracked for 30 days' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#6C63FF', '#A29BFE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>🏅 Active Member</Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View
                key={index}
                style={[styles.statCard, { backgroundColor: theme.card }, shadows.md]}
              >
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
          {achievements.map((achievement, index) => (
            <View
              key={index}
              style={[styles.achievementCard, { backgroundColor: theme.card }, shadows.sm]}
            >
              <View style={[styles.achievementIcon, { backgroundColor: theme.primaryLight + '20' }]}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, { color: theme.text }]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDesc, { color: theme.textSecondary }]}>
                  {achievement.desc}
                </Text>
              </View>
              <Text style={styles.checkmark}>✅</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: 70,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  memberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  statsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  achievementsSection: {
    paddingHorizontal: spacing.lg,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 10,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 22,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  achievementDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
  },
});
