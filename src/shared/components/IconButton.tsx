/**
 * IconButton Component
 *
 * Pressable icon with optional background and animation.
 */

import React, { memo } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/shared/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps {
  icon: IoniconsName;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  variant?: 'default' | 'filled' | 'tinted';
  disabled?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const IconButton = memo(function IconButton({
  icon,
  onPress,
  size = 24,
  color,
  backgroundColor,
  variant = 'default',
  disabled = false,
  style,
}: IconButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, theme.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.spring.snappy);
  };

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    switch (variant) {
      case 'filled':
        return theme.colors.interactive;
      case 'tinted':
        return theme.isDark
          ? 'rgba(124, 58, 237, 0.15)'
          : 'rgba(124, 58, 237, 0.1)';
      default:
        return 'transparent';
    }
  };

  const getIconColor = () => {
    if (color) return color;
    switch (variant) {
      case 'filled':
        return '#FFFFFF';
      case 'tinted':
        return theme.colors.interactive;
      default:
        return theme.colors.text;
    }
  };

  const containerSize = size + (variant === 'default' ? 8 : 16);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        animatedStyle,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: getBackgroundColor(),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={getIconColor()} />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
