/**
 * Input Component
 *
 * Themed text input with glassmorphism styling.
 */

import React, { memo, useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/src/shared/theme';
import { Text } from './Text';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: IoniconsName;
  rightIcon?: IoniconsName;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input = memo(
  forwardRef<TextInput, InputProps>(function Input(
    {
      label,
      error,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      style,
      ...props
    },
    ref
  ) {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const borderColor = useSharedValue<string>(theme.colors.border);

    const animatedBorderStyle = useAnimatedStyle(() => ({
      borderColor: borderColor.value,
    }));

    const handleFocus = () => {
      setIsFocused(true);
      borderColor.value = withTiming(theme.colors.interactive, { duration: 200 });
    };

    const handleBlur = () => {
      setIsFocused(false);
      borderColor.value = withTiming(
        error ? theme.colors.error : theme.colors.border,
        { duration: 200 }
      );
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            variant="label"
            style={[styles.label, { color: theme.colors.textSecondary }]}
          >
            {label}
          </Text>
        )}

        <AnimatedView
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.glass,
              borderRadius: theme.componentRadius.input,
              borderWidth: 1.5,
            },
            animatedBorderStyle,
            isFocused && theme.glows.subtle,
          ]}
        >
          {leftIcon && (
            <View style={styles.leftIcon}>
              <Ionicons
                name={leftIcon}
                size={20}
                color={isFocused ? theme.colors.interactive : theme.colors.textTertiary}
              />
            </View>
          )}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                ...theme.textStyles.body,
              },
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              style,
            ]}
            placeholderTextColor={theme.colors.textTertiary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor={theme.colors.interactive}
            {...props}
          />

          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIcon}
              hitSlop={8}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={theme.colors.textTertiary}
              />
            </Pressable>
          )}
        </AnimatedView>

        {error && (
          <Text
            variant="caption"
            style={[styles.error, { color: theme.colors.error }]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  })
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    paddingLeft: 14,
  },
  rightIcon: {
    paddingRight: 14,
  },
  error: {
    marginTop: 6,
  },
});
