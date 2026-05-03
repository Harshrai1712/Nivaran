import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { shadows, borderRadius, spacing } from '../theme/typography';

// ─── helpers ─────────────────────────────────────────────────────────────────

function lerpColor(a, b, t) {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return '#' + ((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0');
}

/**
 * Map risk level → a damage ratio in [0, 1].
 *
 *   Normal   →  0.00  (perfectly healthy)
 *   Very Few →  0.25  (lightly stressed)
 *   Moderate →  0.60  (visibly stressed)
 *   High     →  0.95  (near-dead / struggling)
 */
function damageFromRisk(riskLevel) {
  switch (riskLevel) {
    case 'High':     return 0.95;
    case 'Moderate': return 0.60;
    case 'Very Few': return 0.25;
    case 'Normal':
    default:         return 0.00;
  }
}

/**
 * Tree health percentage shown in the bar (inverse of damage).
 */
function healthPct(damage) {
  return Math.max(1, Math.round((1 - damage) * 100));
}

// ─── Falling Leaf ─────────────────────────────────────────────────────────────

function FallingLeaf({ delay, startX, leafColor, size }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate    = useRef(new Animated.Value(0)).current;
  const opacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 3000 + Math.random() * 2000;
    const swayAmp  = 25  + Math.random() * 20;
    const swayDir  = Math.random() > 0.5 ? 1 : -1;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity,     { toValue: 0.9, duration: 300,      useNativeDriver: true }),
          Animated.timing(translateY,  { toValue: 170, duration, easing: Easing.linear,              useNativeDriver: true }),
          Animated.timing(translateX,  { toValue: swayAmp * swayDir, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(rotate,      { toValue: 1,   duration, easing: Easing.linear,              useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(rotate,     { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 20,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: spin }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 10 10">
        <Ellipse cx="5" cy="5" rx="4" ry="2.5" fill={leafColor} />
      </Svg>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * HealthTree
 *
 * Props:
 *  - riskLevel  : 'Normal' | 'Very Few' | 'Moderate' | 'High'
 *  - cigarettes : number  (used only for fine-tuning the damage within a tier)
 *  - dailyLimit : number
 */
export default function HealthTree({ riskLevel = 'Normal', cigarettes = 0, dailyLimit = 5 }) {
  const { theme, isDarkMode } = useTheme();

  // ── Derive damage from the risk level (primary driver) ──────────────────────
  const baseDamage = damageFromRisk(riskLevel);

  // Fine-tune: within a tier, add a small extra nudge based on how far through
  // the tier the user is (max ±0.10 extra damage), so the tree animates subtly
  // as the count increases even within the same label.
  const limit = Math.max(dailyLimit, 1);
  const pct   = Math.min((cigarettes / limit) * 100, 100);
  const nudge = (pct / 100) * 0.10;
  const damage = Math.min(baseDamage + nudge, 0.98);

  // ── Derived booleans ────────────────────────────────────────────────────────
  const isHealthy  = riskLevel === 'Normal';
  const isDying    = riskLevel === 'High';
  const isModerate = riskLevel === 'Moderate';
  const isVeryFew  = riskLevel === 'Very Few';

  // ── Colors (lerp healthy green → dead brown based on damage) ───────────────
  const trunkColor  = lerpColor('#6D4C41', '#4E342E', damage);
  const canopyTop   = lerpColor('#66BB6A', '#A0522D', damage);
  const canopyBot   = lerpColor('#388E3C', '#6B3A2A', damage);
  const groundColor = lerpColor('#81C784', '#A0845C', damage);
  const leafColor   = lerpColor('#4CAF50', '#8D4A15', damage);

  // ── Status label / colour ───────────────────────────────────────────────────
  const statusLabel = isHealthy  ? '🌳 Thriving'
                    : isVeryFew  ? '🌿 Lightly Stressed'
                    : isModerate ? '🌿 Stressed'
                    : '🍂 Struggling';

  const statusColor = isHealthy  ? '#4CAF50'
                    : isVeryFew  ? '#74B9FF'
                    : isModerate ? '#FDCB6E'
                    : '#E17055';

  const subtitle = isHealthy  ? 'Keep going! Your tree is flourishing 🌱'
                 : isVeryFew  ? 'A little smoke — your tree can still recover 🌿'
                 : isModerate ? 'Cut back to help your tree recover 🍃'
                 : 'Reduce smoking to save your tree! 🍂';

  // ── Gentle sway animation ───────────────────────────────────────────────────
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1,  duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const swayDeg = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });

  // ── Falling leaves: more leaves = worse risk ────────────────────────────────
  const leafCount = isDying ? 8 : isModerate ? 4 : isVeryFew ? 2 : 0;
  const leaves = useMemo(
    () =>
      Array.from({ length: leafCount }, (_, i) => ({
        id: i,
        delay:  i * 700,
        startX: 25 + Math.random() * 95,
        size:   8  + Math.random() * 5,
      })),
    [leafCount]
  );

  const canopyScale = 1 - damage * 0.30; // canopy shrinks as damage increases

  return (
    <View style={[styles.card, { backgroundColor: theme.card }, shadows.md]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Your Health Tree</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '25' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>

      {/* Tree */}
      <View style={styles.treeCanvas}>
        {leaves.map((l) => (
          <FallingLeaf
            key={l.id}
            delay={l.delay}
            startX={l.startX}
            leafColor={leafColor}
            size={l.size}
          />
        ))}

        <Animated.View style={{ transform: [{ rotate: swayDeg }] }}>
          <Svg width={160} height={190} viewBox="0 0 160 190">
            <Defs>
              <RadialGradient id="cg" cx="50%" cy="40%" r="50%">
                <Stop offset="0%"   stopColor={canopyTop} stopOpacity="1" />
                <Stop offset="100%" stopColor={canopyBot} stopOpacity="1" />
              </RadialGradient>
              <LinearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%"   stopColor={trunkColor} stopOpacity="0.7" />
                <Stop offset="50%"  stopColor={trunkColor} stopOpacity="1"   />
                <Stop offset="100%" stopColor={trunkColor} stopOpacity="0.6" />
              </LinearGradient>
              <LinearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%"   stopColor={groundColor} stopOpacity="1"   />
                <Stop offset="100%" stopColor={groundColor} stopOpacity="0.3" />
              </LinearGradient>
            </Defs>

            {/* Ground */}
            <Ellipse cx="80" cy="178" rx="55" ry="10" fill="url(#gg)" />

            {/* Trunk */}
            <Path
              d="M 68 178 Q 66 155 70 130 Q 72 115 75 100 Q 78 88 80 80 Q 82 88 85 100 Q 88 115 90 130 Q 94 155 92 178 Z"
              fill="url(#tg)"
            />

            {/* Roots */}
            <Path d="M 70 172 Q 55 180 45 178" stroke={trunkColor} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
            <Path d="M 90 172 Q 105 180 115 178" stroke={trunkColor} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />

            {/* Canopy — shrinks with damage */}
            <G transform={`translate(80,80) scale(${canopyScale}) translate(-80,-80)`}>
              <Ellipse cx="80" cy="105" rx="52" ry="32" fill={canopyBot}    opacity="0.9"  />
              <Ellipse cx="80" cy="85"  rx="48" ry="35" fill="url(#cg)"     opacity="0.95" />
              <Ellipse cx="80" cy="60"  rx="36" ry="30" fill={canopyTop}    opacity="1"    />
              <Ellipse cx="80" cy="38"  rx="22" ry="20" fill={canopyTop}    opacity="0.95" />
            </G>

            {/* Bark cracks — appear from Moderate upward */}
            {(isModerate || isDying) && (
              <>
                <Path d="M 76 145 Q 78 138 76 130" stroke={isDarkMode ? '#3E2723' : '#4E342E'} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
                <Path d="M 83 158 Q 85 150 83 142" stroke={isDarkMode ? '#3E2723' : '#4E342E'} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
              </>
            )}

            {/* Bare branches — only when High risk */}
            {isDying && (
              <>
                <Path d="M 80 90 Q 60 78 50 65" stroke={trunkColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                <Path d="M 80 90 Q 100 78 110 65" stroke={trunkColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                <Path d="M 80 75 Q 72 62 68 52"  stroke={trunkColor} strokeWidth="2" strokeLinecap="round" fill="none" />
                <Path d="M 80 75 Q 88 62 92 52"  stroke={trunkColor} strokeWidth="2" strokeLinecap="round" fill="none" />
              </>
            )}

            {/* Fruits — only when Normal (smoke-free) */}
            {isHealthy && (
              <>
                <Circle cx="62" cy="72" r="4"   fill="#FF5252" opacity="0.85" />
                <Circle cx="95" cy="68" r="3"   fill="#FF5252" opacity="0.8"  />
                <Circle cx="78" cy="52" r="3.5" fill="#FF7043" opacity="0.8"  />
              </>
            )}
          </Svg>
        </Animated.View>
      </View>

      {/* Health bar */}
      <View style={styles.barRow}>
        <Text style={[styles.barLabel, { color: theme.textSecondary }]}>Tree{'\n'}Health</Text>
        <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.barFill,
              { width: `${healthPct(damage)}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
        <Text style={[styles.barPct, { color: statusColor }]}>
          {healthPct(damage)}%
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 17,
  },
  treeCanvas: {
    alignItems: 'center',
    height: 190,
    marginVertical: 4,
    overflow: 'hidden',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 70,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPct: {
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
});
