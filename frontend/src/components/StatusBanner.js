import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { getStatusGradient } from '../theme/colors';
import { getStatusEmoji } from '../utils/statusHelper';

export default function StatusBanner({ status = 'Normal', subtitle = "Today's Smoking Status" }) {
  const { theme } = useTheme();
  const gradientColors = getStatusGradient(status);
  const emoji = getStatusEmoji(status);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <Text style={styles.description}>
          {status === 'Normal' && 'No cigarettes detected today'}
          {status === 'Very Few' && '1-2 cigarettes detected'}
          {status === 'Moderate' && '3-5 cigarettes detected'}
          {status === 'High' && 'Limit exceeded! Take care'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  overlay: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 28,
    marginRight: 10,
  },
  statusText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
});
