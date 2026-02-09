/**
 * Button Component
 *
 * Versatile button with multiple variants, sizes, and states.
 * Supports loading state and icon placement.
 */

import React, { memo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/shared/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, theme.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.spring.snappy);
  };

  const sizeStyles = getSizeStyles(size, theme);
  const variantStyles = getVariantStyles(variant, theme, disabled);

  const isDisabled = disabled || loading;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost'
            ? theme.colors.interactive
            : '#FFFFFF'}
        />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          animatedStyle,
          fullWidth && styles.fullWidth,
          { opacity: isDisabled ? 0.5 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={theme.gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles.button,
            { borderRadius: theme.componentRadius.button },
            theme.shadows.md,
          ]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        styles.button,
        sizeStyles.button,
        variantStyles.button,
        fullWidth && styles.fullWidth,
        { opacity: isDisabled ? 0.5 : 1 },
        variant === 'primary' && theme.shadows.sm,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
});

const getSizeStyles = (
  size: ButtonSize,
  theme: ReturnType<typeof useTheme>['theme']
) => {
  const sizes = {
    sm: {
      button: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.componentRadius.buttonSmall,
      },
      text: {
        ...theme.textStyles.buttonSmall,
      },
    },
    md: {
      button: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.componentRadius.button,
      },
      text: {
        ...theme.textStyles.button,
      },
    },
    lg: {
      button: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.componentRadius.button,
      },
      text: {
        ...theme.textStyles.button,
        fontSize: theme.fontSize.lg,
      },
    },
  };

  return sizes[size];
};

const getVariantStyles = (
  variant: ButtonVariant,
  theme: ReturnType<typeof useTheme>['theme'],
  disabled: boolean
) => {
  const variants = {
    primary: {
      button: {
        backgroundColor: disabled
          ? theme.colors.textTertiary
          : theme.colors.interactive,
      },
      text: {
        color: '#FFFFFF',
      },
    },
    secondary: {
      button: {
        backgroundColor: theme.colors.backgroundSecondary,
      },
      text: {
        color: theme.colors.text,
      },
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.interactive,
      },
      text: {
        color: theme.colors.interactive,
      },
    },
    ghost: {
      button: {
        backgroundColor: 'transparent',
      },
      text: {
        color: theme.colors.interactive,
      },
    },
    gradient: {
      button: {},
      text: {
        color: '#FFFFFF',
      },
    },
  };

  return variants[variant];
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
