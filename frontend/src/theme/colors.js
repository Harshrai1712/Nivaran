/**
 * Color palette for Smoke Detector App
 * Pastel health-app design inspired by modern fitness trackers
 */

export const colors = {
  light: {
    primary: '#6C63FF',
    primaryLight: '#A29BFE',
    primaryDark: '#5A52D5',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#2D3436',
    textSecondary: '#636E72',
    textTertiary: '#B2BEC3',
    border: '#E8ECF0',
    divider: '#F0F2F5',

    // Status colors
    statusNormal: '#00B894',
    statusNormalLight: '#E8F8F5',
    statusVeryFew: '#74B9FF',
    statusVeryFewLight: '#EBF5FB',
    statusModerate: '#FDCB6E',
    statusModerateLight: '#FEF9E7',
    statusHigh: '#E17055',
    statusHighLight: '#FDEDEC',

    // Functional
    heartRate: '#FF6B6B',
    heartRateLight: '#FFE0E0',
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#E17055',
    info: '#74B9FF',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E8ECF0',
    tabActive: '#6C63FF',
    tabInactive: '#B2BEC3',

    // Shadows
    shadow: '#000000',
    shadowOpacity: 0.08,

    // Input
    inputBackground: '#F5F7FA',
    inputBorder: '#E8ECF0',
    placeholder: '#B2BEC3',
  },
  dark: {
    primary: '#A29BFE',
    primaryLight: '#6C63FF',
    primaryDark: '#C4C0FF',
    background: '#0D1117',
    surface: '#161B22',
    card: '#1C2333',
    text: '#E6EDF3',
    textSecondary: '#8B949E',
    textTertiary: '#484F58',
    border: '#30363D',
    divider: '#21262D',

    // Status colors (slightly brighter for dark mode)
    statusNormal: '#2ECC71',
    statusNormalLight: '#1A3A2A',
    statusVeryFew: '#74B9FF',
    statusVeryFewLight: '#1A2D3D',
    statusModerate: '#F1C40F',
    statusModerateLight: '#3D3A1A',
    statusHigh: '#E74C3C',
    statusHighLight: '#3D1A1A',

    // Functional
    heartRate: '#FF6B6B',
    heartRateLight: '#3D1A1A',
    success: '#2ECC71',
    warning: '#F1C40F',
    error: '#E74C3C',
    info: '#74B9FF',

    // Tab bar
    tabBar: '#161B22',
    tabBarBorder: '#30363D',
    tabActive: '#A29BFE',
    tabInactive: '#484F58',

    // Shadows
    shadow: '#000000',
    shadowOpacity: 0.3,

    // Input
    inputBackground: '#161B22',
    inputBorder: '#30363D',
    placeholder: '#484F58',
  },
};

/**
 * Get status color based on smoking status
 */
export function getStatusColor(status, theme = 'light') {
  const palette = colors[theme];
  switch (status) {
    case 'Normal':
      return palette.statusNormal;
    case 'Very Few':
      return palette.statusVeryFew;
    case 'Moderate':
      return palette.statusModerate;
    case 'High':
      return palette.statusHigh;
    default:
      return palette.statusNormal;
  }
}

/**
 * Get status background color
 */
export function getStatusBgColor(status, theme = 'light') {
  const palette = colors[theme];
  switch (status) {
    case 'Normal':
      return palette.statusNormalLight;
    case 'Very Few':
      return palette.statusVeryFewLight;
    case 'Moderate':
      return palette.statusModerateLight;
    case 'High':
      return palette.statusHighLight;
    default:
      return palette.statusNormalLight;
  }
}

/**
 * Get gradient colors for status banner
 */
export function getStatusGradient(status) {
  switch (status) {
    case 'Normal':
      return ['#00B894', '#00CEC9'];
    case 'Very Few':
      return ['#74B9FF', '#0984E3'];
    case 'Moderate':
      return ['#FDCB6E', '#E17055'];
    case 'High':
      return ['#E17055', '#D63031'];
    default:
      return ['#00B894', '#00CEC9'];
  }
}
