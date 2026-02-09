/**
 * Skeleton Component
 *
 * Loading placeholder with shimmer animation.
 * SkeletonCard matches the PostCard layout and dimensions exactly.
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_INNER_PAD = 14;
const MEDIA_RADIUS = 14;

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [-1, 1],
          [-200, 200]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { width: 200 }]}
        />
      </Animated.View>
    </View>
  );
});

export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
}: {
  lines?: number;
  lastLineWidth?: DimensionValue;
}) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          style={index < lines - 1 ? styles.textLine : undefined}
        />
      ))}
    </View>
  );
});

export const SkeletonAvatar = memo(function SkeletonAvatar({
  size = 44,
}: {
  size?: number;
}) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
});

/**
 * SkeletonCard - matches PostCard layout exactly:
 * - Same margins (12px horizontal), border-radius (20), border
 * - Header with avatar + two text lines + round more button
 * - Media area with rounded corners inside 8px horizontal padding
 * - Action pills row matching the pill-style buttons
 * - Caption text lines
 * - Bottom gradient accent line
 */
export const SkeletonCard = memo(function SkeletonCard() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      {/* Header - matches PostCard header */}
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={44} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={110} height={14} borderRadius={7} />
          <Skeleton
            width={70}
            height={11}
            borderRadius={6}
            style={{ marginTop: 6 }}
          />
        </View>
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>

      {/* Media - matches PostCard media container with rounded corners */}
      <View style={styles.cardMedia}>
        <Skeleton
          height={SCREEN_WIDTH - CARD_MARGIN * 2 - 16}
          borderRadius={MEDIA_RADIUS}
        />
      </View>

      {/* Action pills - matches PostCard action bar */}
      <View style={styles.cardActions}>
        <View style={styles.cardActionsLeft}>
          <Skeleton width={72} height={34} borderRadius={17} />
          <Skeleton width={72} height={34} borderRadius={17} />
          <Skeleton width={40} height={34} borderRadius={17} />
        </View>
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>

      {/* Caption lines - matches PostCard caption */}
      <View style={styles.cardCaption}>
        <Skeleton width="90%" height={14} borderRadius={7} />
        <Skeleton
          width="55%"
          height={14}
          borderRadius={7}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Bottom accent line - matches PostCard gradient line */}
      <LinearGradient
        colors={theme.gradients.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardAccent}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  textContainer: {},
  textLine: {
    marginBottom: 8,
  },
  card: {
    marginHorizontal: CARD_MARGIN,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CARD_INNER_PAD,
    paddingTop: CARD_INNER_PAD,
    paddingBottom: 10,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardMedia: {
    paddingHorizontal: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_INNER_PAD,
    paddingTop: 10,
    paddingBottom: 4,
  },
  cardActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardCaption: {
    paddingHorizontal: CARD_INNER_PAD,
    paddingTop: 8,
    paddingBottom: 4,
  },
  cardAccent: {
    height: 2,
    marginTop: 12,
    opacity: 0.4,
  },
});