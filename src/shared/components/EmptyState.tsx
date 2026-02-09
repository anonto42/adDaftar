/**
 * EmptyState Component
 *
 * Placeholder for empty lists and screens.
 */

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/shared/theme';
import { Text } from './Text';
import { Button } from './Button';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon?: IoniconsName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState = memo(function EmptyState({
  icon = 'albums-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <LinearGradient
          colors={theme.gradients.primary as [string, string]}
          style={styles.iconGradient}
        >
          <Ionicons name={icon} size={40} color="#FFFFFF" />
        </LinearGradient>
      </View>

      <Text variant="h4" align="center" style={styles.title}>
        {title}
      </Text>

      {description && (
        <Text
          variant="body"
          align="center"
          color={theme.colors.textSecondary}
          style={styles.description}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="gradient"
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
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    minWidth: 160,
  },
});
