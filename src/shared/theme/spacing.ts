/**
 * Spacing System
 *
 * Consistent spacing scale for margins, paddings, and gaps.
 * Based on 4px base unit for precise alignment.
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

// Semantic spacing aliases
export const layoutSpacing = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  sectionGap: spacing['2xl'],
  itemGap: spacing.md,
  inlineGap: spacing.sm,
  listItemGap: spacing.sm,
} as const;

export type Spacing = keyof typeof spacing;
