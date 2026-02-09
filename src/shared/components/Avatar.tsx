/**
 * Avatar Component
 *
 * Displays user avatar with various sizes and optional ring/border styles.
 * Supports story ring indicator and verification badge.
 */

import React, { memo } from 'react';
import { View, StyleSheet, Image, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  uri: string | null;
  size?: AvatarSize;
  showStoryRing?: boolean;
  hasUnseenStory?: boolean;
  showVerified?: boolean;
  showAddButton?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72,
  '2xl': 96,
};

const ringWidthMap: Record<AvatarSize, number> = {
  xs: 1.5,
  sm: 2,
  md: 2.5,
  lg: 3,
  xl: 3.5,
  '2xl': 4,
};

export const Avatar = memo(function Avatar({
  uri,
  size = 'md',
  showStoryRing = false,
  hasUnseenStory = false,
  showVerified = false,
  showAddButton = false,
  onPress,
  style,
}: AvatarProps) {
  const { theme } = useTheme();
  const dimension = sizeMap[size];
  const ringWidth = ringWidthMap[size];
  const ringGap = 2;
  const totalSize = showStoryRing ? dimension + (ringWidth + ringGap) * 2 : dimension;

  const content = (
    <View
      style={[
        styles.container,
        { width: totalSize, height: totalSize },
        style,
      ]}
    >
      {/* Story ring */}
      {showStoryRing && (
        <LinearGradient
          colors={
            hasUnseenStory
              ? (theme.gradients.primary as [string, string])
              : [theme.colors.border, theme.colors.border]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.storyRing,
            {
              width: totalSize,
              height: totalSize,
              borderRadius: totalSize / 2,
            },
          ]}
        />
      )}

      {/* Avatar image container */}
      <View
        style={[
          styles.imageContainer,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: theme.colors.backgroundSecondary,
            borderWidth: showStoryRing ? ringGap : 0,
            borderColor: theme.colors.background,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={[
              styles.image,
              {
                width: dimension - (showStoryRing ? ringGap * 2 : 0),
                height: dimension - (showStoryRing ? ringGap * 2 : 0),
                borderRadius: (dimension - (showStoryRing ? ringGap * 2 : 0)) / 2,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: dimension - (showStoryRing ? ringGap * 2 : 0),
                height: dimension - (showStoryRing ? ringGap * 2 : 0),
                borderRadius: (dimension - (showStoryRing ? ringGap * 2 : 0)) / 2,
                backgroundColor: theme.colors.backgroundTertiary,
              },
            ]}
          >
            <Ionicons
              name="person"
              size={dimension * 0.5}
              color={theme.colors.textTertiary}
            />
          </View>
        )}
      </View>

      {/* Verified badge */}
      {showVerified && size !== 'xs' && (
        <View
          style={[
            styles.verifiedBadge,
            {
              backgroundColor: theme.colors.background,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={size === 'sm' ? 12 : size === 'md' ? 14 : 18}
            color={theme.brandColors.primary}
          />
        </View>
      )}

      {/* Add button (for current user story) */}
      {showAddButton && (
        <LinearGradient
          colors={theme.gradients.primary as [string, string]}
          style={[
            styles.addButton,
            {
              width: dimension * 0.35,
              height: dimension * 0.35,
              borderRadius: (dimension * 0.35) / 2,
              borderWidth: 2,
              borderColor: theme.colors.background,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Ionicons
            name="add"
            size={dimension * 0.2}
            color="#FFFFFF"
          />
        </LinearGradient>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRing: {
    position: 'absolute',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    borderRadius: 10,
    padding: 1,
  },
  addButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
