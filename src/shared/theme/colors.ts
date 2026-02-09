/**
 * Color Palette
 *
 * Futuristic design system inspired by Instagram but with
 * glassmorphism, gradients, and next-gen aesthetics.
 */

// Brand colors - gradient-ready
export const brandColors = {
  primary: '#7C3AED', // Violet
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  secondary: '#EC4899', // Pink
  secondaryLight: '#F472B6',
  secondaryDark: '#BE185D',
  accent: '#06B6D4', // Cyan
  accentLight: '#22D3EE',
  accentDark: '#0891B2',
} as const;

// Gradient presets
export const gradients = {
  primary: ['#7C3AED', '#EC4899'],
  sunset: ['#F97316', '#EC4899', '#7C3AED'],
  ocean: ['#06B6D4', '#7C3AED'],
  aurora: ['#22D3EE', '#A78BFA', '#F472B6'],
  night: ['#1E1B4B', '#312E81', '#4C1D95'],
  glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
  glassDark: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)'],
} as const;

// Light theme colors
export const lightColors = {
  // Backgrounds
  background: '#FAFAFA',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#EEEEEE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Glass effect backgrounds
  glass: 'rgba(255, 255, 255, 0.7)',
  glassStrong: 'rgba(255, 255, 255, 0.85)',
  glassSubtle: 'rgba(255, 255, 255, 0.5)',

  // Text
  text: '#0F0F0F',
  textSecondary: '#525252',
  textTertiary: '#737373',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.15)',
  borderSubtle: 'rgba(0, 0, 0, 0.04)',

  // Interactive
  primary: brandColors.primary,
  card: '#FFFFFF',
  interactive: brandColors.primary,
  interactiveHover: brandColors.primaryDark,
  interactivePressed: brandColors.primaryDark,

  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Social actions
  like: '#EF4444',
  comment: brandColors.primary,
  share: brandColors.accent,
  save: '#F59E0B',

  // Misc
  skeleton: '#E5E5E5',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowStrong: 'rgba(0, 0, 0, 0.2)',

  // Tab bar
  tabBar: 'rgba(255, 255, 255, 0.9)',
  tabBarBorder: 'rgba(0, 0, 0, 0.05)',
  tabBarActive: brandColors.primary,
  tabBarInactive: '#737373',
} as const;

// Dark theme colors
export const darkColors = {
  // Backgrounds
  background: '#0A0A0A',
  backgroundSecondary: '#141414',
  backgroundTertiary: '#1F1F1F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',

  // Glass effect backgrounds (darker, more dramatic)
  glass: 'rgba(30, 30, 30, 0.7)',
  glassStrong: 'rgba(40, 40, 40, 0.85)',
  glassSubtle: 'rgba(20, 20, 20, 0.5)',

  // Text
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textTertiary: '#737373',
  textInverse: '#0F0F0F',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',

  // Interactive
  primary: brandColors.primaryLight,
  card: '#1A1A1A',
  interactive: brandColors.primaryLight,
  interactiveHover: brandColors.primary,
  interactivePressed: brandColors.primary,

  // Status
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.15)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.15)',

  // Social actions
  like: '#F87171',
  comment: brandColors.primaryLight,
  share: brandColors.accentLight,
  save: '#FBBF24',

  // Misc
  skeleton: '#2A2A2A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowStrong: 'rgba(0, 0, 0, 0.5)',

  // Tab bar
  tabBar: 'rgba(20, 20, 20, 0.9)',
  tabBarBorder: 'rgba(255, 255, 255, 0.05)',
  tabBarActive: brandColors.primaryLight,
  tabBarInactive: '#737373',
} as const;

export type ThemeColors = typeof lightColors;
