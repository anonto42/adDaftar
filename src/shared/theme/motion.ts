/**
 * Motion System
 *
 * Animation durations, easings, and spring configs
 * for consistent micro-interactions.
 */

import { Easing } from 'react-native-reanimated';

// Duration presets (in milliseconds)
export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  slower: 500,
  slowest: 700,
} as const;

// Easing curves
export const easing = {
  // Standard easings
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Custom curves for specific effects
  accelerate: Easing.bezier(0.4, 0, 1, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  standard: Easing.bezier(0.4, 0, 0.2, 1),

  // Emphasis curves
  emphasize: Easing.bezier(0.2, 0, 0, 1),
  bounce: Easing.bezier(0.68, -0.55, 0.27, 1.55),
} as const;

// Spring configurations for react-native-reanimated
export const spring = {
  // Gentle, natural movement
  gentle: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },

  // Default spring
  default: {
    damping: 20,
    mass: 1,
    stiffness: 200,
  },

  // Snappy, responsive feel
  snappy: {
    damping: 25,
    mass: 0.8,
    stiffness: 300,
  },

  // Bouncy effect
  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 180,
  },

  // Stiff, precise movement
  stiff: {
    damping: 30,
    mass: 0.8,
    stiffness: 400,
  },
} as const;

// Predefined animation configs
export const animations = {
  fadeIn: {
    duration: duration.normal,
    easing: easing.easeOut,
  },
  fadeOut: {
    duration: duration.fast,
    easing: easing.easeIn,
  },
  slideUp: {
    duration: duration.normal,
    easing: easing.decelerate,
  },
  slideDown: {
    duration: duration.normal,
    easing: easing.accelerate,
  },
  scale: {
    duration: duration.fast,
    easing: easing.standard,
  },
  press: {
    duration: duration.instant,
    easing: easing.easeOut,
  },
} as const;

export type Duration = keyof typeof duration;
export type Spring = keyof typeof spring;
