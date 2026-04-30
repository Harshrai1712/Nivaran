import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing } from '../theme/typography';

export default function MotivationalText({ status = 'Normal', message }) {
  const { theme } = useTheme();

  const getDefaultMessage = () => {
    switch (status) {
      case 'Normal':
        return "🎉 Great job! You're smoke-free today! Keep it up!";
      case 'Very Few':
        return '👍 Not bad! Try to cut down even more tomorrow.';
      case 'Moderate':
        return '⚠️ Watch your intake! Consider taking a break.';
      case 'High':
        return '🚨 Limit crossed! Please take care of your health.';
      default:
        return '💪 Stay strong and stay healthy!';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'Normal': return theme.statusNormalLight;
      case 'Very Few': return theme.statusVeryFewLight;
      case 'Moderate': return theme.statusModerateLight;
      case 'High': return theme.statusHighLight;
      default: return theme.statusNormalLight;
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'Normal': return theme.statusNormal;
      case 'Very Few': return theme.statusVeryFew;
      case 'Moderate': return theme.statusModerate;
      case 'High': return theme.statusHigh;
      default: return theme.statusNormal;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBgColor(),
          borderLeftColor: getBorderColor(),
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.text }]}>
        {message || getDefaultMessage()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
});
