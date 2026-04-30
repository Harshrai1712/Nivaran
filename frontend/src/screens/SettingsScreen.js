import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SettingsItem from '../components/SettingsItem';
import { shadows, borderRadius, spacing } from '../theme/typography';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, logout, updateUserSettings } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(user?.dailyLimit || 5);

  const handleDailyLimitChange = async (newLimit) => {
    setDailyLimit(newLimit);
    try {
      await api.put('/auth/settings', { dailyLimit: newLimit });
      updateUserSettings({ dailyLimit: newLimit });
    } catch (error) {
      console.log('Settings save error (offline mode)');
    }
  };

  const handleNotificationToggle = async (value) => {
    setNotifications(value);
    try {
      await api.put('/auth/settings', { notifications: value });
    } catch (error) {
      console.log('Settings save error (offline mode)');
    }
  };

  const handleReminderToggle = async (value) => {
    setReminders(value);
    try {
      await api.put('/auth/settings', { reminders: value });
    } catch (error) {
      console.log('Settings save error (offline mode)');
    }
  };

  const handleDarkModeToggle = async () => {
    toggleTheme();
    try {
      await api.put('/auth/settings', { darkMode: !isDarkMode });
    } catch (error) {
      console.log('Settings save error (offline mode)');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Customize your experience
          </Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }, shadows.sm]}>
            <SettingsItem
              icon="🌙"
              label="Dark Mode"
              sublabel="Use dark theme"
              type="toggle"
              value={isDarkMode}
              onValueChange={handleDarkModeToggle}
            />
          </View>
        </View>

        {/* Health Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            HEALTH SETTINGS
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }, shadows.sm]}>
            <SettingsItem
              icon="🚬"
              label="Daily Cigarette Limit"
              sublabel="Set your daily smoking limit"
              type="stepper"
              value={dailyLimit}
              onValueChange={handleDailyLimitChange}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }, shadows.sm]}>
            <SettingsItem
              icon="🔔"
              label="Notifications"
              sublabel="Receive smoking alerts"
              type="toggle"
              value={notifications}
              onValueChange={handleNotificationToggle}
            />
            <SettingsItem
              icon="⏰"
              label="Reminders"
              sublabel="Daily health reminders"
              type="toggle"
              value={reminders}
              onValueChange={handleReminderToggle}
            />
          </View>
        </View>

        {/* Device */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DEVICE</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }, shadows.sm]}>
            <SettingsItem
              icon="⌚"
              label="Wristband Status"
              sublabel="SmokeGuard Band v1.0"
              type="status"
              value="Connected"
              statusColor={theme.success}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SUPPORT</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }, shadows.sm]}>
            <SettingsItem
              icon="❓"
              label="Help Center"
              sublabel="FAQ and support"
              type="action"
              onPress={() => Alert.alert('Help Center', 'Contact us at support@smokeguard.com')}
            />
            <SettingsItem
              icon="🔒"
              label="Privacy Policy"
              type="action"
              onPress={() =>
                Alert.alert('Privacy Policy', 'Your data is stored securely and never shared with third parties.')
              }
            />
            <SettingsItem
              icon="ℹ️"
              label="About"
              sublabel="Version 1.0.0 — EDP Project"
              type="action"
              onPress={() =>
                Alert.alert(
                  'About SmokeGuard',
                  'Cigarette Detecting Wristband System\nVersion 1.0.0\n\nAn EDP Final Year Project'
                )
              }
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }, shadows.sm]}>
            <SettingsItem
              icon="🚪"
              label="Logout"
              type="button"
              destructive
              onPress={handleLogout}
            />
          </View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});
