/**
 * ErrorState Component
 *
 * Error display with retry action.
 */

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { Text } from './Text';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState = memo(function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this content. Please try again.',
  onRetry,
  style,
}: ErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.errorLight },
        ]}
      >
        <Ionicons name="warning-outline" size={48} color={theme.colors.error} />
      </View>

      <Text variant="h4" align="center" style={styles.title}>
        {title}
      </Text>

      <Text
        variant="body"
        align="center"
        color={theme.colors.textSecondary}
        style={styles.message}
      >
        {message}
      </Text>

      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          leftIcon={<Ionicons name="refresh" size={18} color={theme.colors.interactive} />}
          style={styles.button}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    minWidth: 140,
  },
});
