/**
 * Shadow System
 *
 * Elevation shadows for depth and hierarchy.
 * Includes glow effects for the futuristic aesthetic.
 */

import { Platform, ViewStyle } from 'react-native';
import { brandColors } from './colors';

// Standard elevation shadows
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }) as ViewStyle,

  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as ViewStyle,

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as ViewStyle,

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }) as ViewStyle,

  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }) as ViewStyle,

  '2xl': Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 32,
    },
    android: {
      elevation: 16,
    },
    default: {},
  }) as ViewStyle,
};

// Glow effects for futuristic aesthetic (iOS only, Android uses elevation)
export const glows = {
  primary: Platform.select({
    ios: {
      shadowColor: brandColors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as ViewStyle,

  secondary: Platform.select({
    ios: {
      shadowColor: brandColors.secondary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as ViewStyle,

  accent: Platform.select({
    ios: {
      shadowColor: brandColors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as ViewStyle,

  subtle: Platform.select({
    ios: {
      shadowColor: brandColors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as ViewStyle,
};

export type Shadow = keyof typeof shadows;
export type Glow = keyof typeof glows;
