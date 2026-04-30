import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing } from '../theme/typography';

/**
 * Reusable settings row component
 *
 * Types:
 * - 'toggle': Shows a Switch
 * - 'stepper': Shows +/- buttons with a value
 * - 'action': Shows a chevron (navigable)
 * - 'status': Shows a status indicator
 * - 'button': Shows as a tappable button
 */
export default function SettingsItem({
  icon,
  label,
  sublabel,
  type = 'action',
  value,
  onPress,
  onValueChange,
  destructive = false,
  statusColor,
}) {
  const { theme } = useTheme();

  const renderRight = () => {
    switch (type) {
      case 'toggle':
        return (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: theme.border, true: theme.primary + '60' }}
            thumbColor={value ? theme.primary : theme.textTertiary}
          />
        );

      case 'stepper':
        return (
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[styles.stepperButton, { backgroundColor: theme.background }]}
              onPress={() => onValueChange && onValueChange(Math.max(1, (value || 5) - 1))}
            >
              <Text style={[styles.stepperText, { color: theme.primary }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepperValue, { color: theme.text }]}>{value || 0}</Text>
            <TouchableOpacity
              style={[styles.stepperButton, { backgroundColor: theme.background }]}
              onPress={() => onValueChange && onValueChange((value || 5) + 1)}
            >
              <Text style={[styles.stepperText, { color: theme.primary }]}>+</Text>
            </TouchableOpacity>
          </View>
        );

      case 'status':
        return (
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusColor || theme.success }]} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {value || 'Unknown'}
            </Text>
          </View>
        );

      case 'action':
        return <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>;

      case 'button':
        return null;

      default:
        return null;
    }
  };

  const Container = type === 'button' || type === 'action' ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        { backgroundColor: theme.card, borderBottomColor: theme.divider },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              { color: destructive ? theme.error : theme.text },
            ]}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={[styles.sublabel, { color: theme.textSecondary }]}>{sublabel}</Text>
          )}
        </View>
      </View>
      {renderRight()}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 22,
    marginRight: spacing.md,
    width: 30,
    textAlign: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  sublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 20,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
