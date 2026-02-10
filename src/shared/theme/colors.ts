/**
 * Color Palette
 *
 * Futuristic design system inspired by Instagram but with
 * glassmorphism, gradients, and next-gen aesthetics.
 */

// Brand colors - professional indigo-based palette
export const brandColors = {
  primary: '#4F46E5', // Indigo-600
  primaryLight: '#818CF8', // Indigo-400
  primaryDark: '#3730A3', // Indigo-800
  secondary: '#10B981', // Emerald-500
  secondaryLight: '#34D399', // Emerald-400
  secondaryDark: '#065F46', // Emerald-800
  accent: '#06B6D4', // Cyan-500
  accentLight: '#22D3EE', // Cyan-400
  accentDark: '#0891B2', // Cyan-600
} as const;

// Gradient presets
export const gradients = {
  primary: ['#4F46E5', '#818CF8'],
  success: ['#10B981', '#34D399'],
  danger: ['#EF4444', '#F87171'],
  ocean: ['#06B6D4', '#4F46E5'],
  night: ['#0F172A', '#1E293B'],
  glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
  glassDark: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)'],
} as const;

// Light theme colors
export const lightColors = {
  // Backgrounds
  background: '#F8FAFC', // Slate-50
  backgroundSecondary: '#F1F5F9', // Slate-100
  backgroundTertiary: '#E2E8F0', // Slate-200
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Glass effect backgrounds
  glass: 'rgba(255, 255, 255, 0.7)',
  glassStrong: 'rgba(255, 255, 255, 0.85)',
  glassSubtle: 'rgba(255, 255, 255, 0.5)',

  // Text
  text: '#0F172A', // Slate-900
  textSecondary: '#475569', // Slate-600
  textTertiary: '#94A3B8', // Slate-400
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E2E8F0', // Slate-200
  borderStrong: '#CBD5E1', // Slate-300
  borderSubtle: '#F1F5F9', // Slate-100

  // Interactive
  primary: brandColors.primary,
  card: '#FFFFFF',
  interactive: brandColors.primary,
  interactiveHover: brandColors.primaryDark,
  interactivePressed: brandColors.primaryDark,

  // Status
  success: '#059669', // Emerald-600
  successLight: '#D1FAE5',
  warning: '#D97706', // Amber-600
  warningLight: '#FEF3C7',
  error: '#DC2626', // Red-600
  errorLight: '#FEE2E2',
  info: '#2563EB', // Blue-600
  infoLight: '#DBEAFE',

  // Social actions
  like: '#EF4444',
  comment: brandColors.primary,
  share: brandColors.accent,
  save: '#F59E0B',

  // Misc
  skeleton: '#E2E8F0',
  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowStrong: 'rgba(15, 23, 42, 0.12)',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: brandColors.primary,
  tabBarInactive: '#94A3B8',
} as const;

// Dark theme colors
export const darkColors = {
  // Backgrounds
  background: '#020617', // Slate-950
  backgroundSecondary: '#0F172A', // Slate-900
  backgroundTertiary: '#1E293B', // Slate-800
  surface: '#1E293B', // Slate-800
  surfaceElevated: '#334155', // Slate-700

  // Glass effect backgrounds (darker, more dramatic)
  glass: 'rgba(15, 23, 42, 0.7)',
  glassStrong: 'rgba(30, 41, 59, 0.85)',
  glassSubtle: 'rgba(2, 6, 23, 0.5)',

  // Text
  text: '#F8FAFC', // Slate-50
  textSecondary: '#94A3B8', // Slate-400
  textTertiary: '#64748B', // Slate-500
  textInverse: '#0F172A',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#334155', // Slate-700
  borderStrong: '#475569', // Slate-600
  borderSubtle: '#1E293B', // Slate-800

  // Interactive
  primary: brandColors.primaryLight,
  card: '#0F172A', // Slate-900
  interactive: brandColors.primaryLight,
  interactiveHover: brandColors.primary,
  interactivePressed: brandColors.primary,

  // Status
  success: '#10B981', // Emerald-500
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B', // Amber-500
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444', // Red-500
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6', // Blue-500
  infoLight: 'rgba(59, 130, 246, 0.15)',

  // Social actions
  like: '#F87171',
  comment: brandColors.primaryLight,
  share: brandColors.accentLight,
  save: '#FBBF24',

  // Misc
  skeleton: '#1E293B',
  overlay: 'rgba(2, 6, 23, 0.8)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowStrong: 'rgba(0, 0, 0, 0.6)',

  // Tab bar
  tabBar: '#0F172A',
  tabBarBorder: '#1E293B',
  tabBarActive: brandColors.primaryLight,
  tabBarInactive: '#64748B',
} as const;

export type ThemeColors = typeof lightColors;
