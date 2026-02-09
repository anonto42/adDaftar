/**
 * Divider Component
 *
 * Horizontal or vertical separator line.
 */

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/shared/theme';

interface DividerProps {
  vertical?: boolean;
  spacing?: number;
  color?: string;
  thickness?: number;
  style?: ViewStyle;
}

export const Divider = memo(function Divider({
  vertical = false,
  spacing = 0,
  color,
  thickness = 1,
  style,
}: DividerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        {
          backgroundColor: color || theme.colors.border,
          [vertical ? 'width' : 'height']: thickness,
          [vertical ? 'marginHorizontal' : 'marginVertical']: spacing,
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});
