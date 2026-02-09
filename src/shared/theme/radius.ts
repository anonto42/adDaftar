/**
 * Border Radius System
 *
 * Consistent border radius values for rounded corners.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999, // For circles and pills
} as const;

// Semantic radius aliases
export const componentRadius = {
  button: radius.lg,
  buttonSmall: radius.md,
  card: radius.xl,
  input: radius.md,
  avatar: radius.full,
  avatarSquare: radius.md,
  modal: radius['2xl'],
  bottomSheet: radius['3xl'],
  tag: radius.full,
  toast: radius.lg,
} as const;

export type Radius = keyof typeof radius;
