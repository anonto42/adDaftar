/**
 * GlassCard Component
 *
 * Glassmorphism card with blur effect, subtle border, and soft glow.
 * Core component for the futuristic design system.
 */

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/shared/theme';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  withGlow?: boolean;
  glowColor?: string;
  noPadding?: boolean;
  style?: ViewStyle;
}

export const GlassCard = memo(function GlassCard({
  children,
  intensity = 'medium',
  withGlow = false,
  glowColor,
  noPadding = false,
  style,
}: GlassCardProps) {
  const { theme } = useTheme();

  const intensityMap = {
    subtle: { blur: 10, opacity: 0.3 },
    medium: { blur: 20, opacity: 0.5 },
    strong: { blur: 40, opacity: 0.7 },
  };

  const { blur, opacity } = intensityMap[intensity];

  const glowStyle = withGlow
    ? {
        ...theme.glows.subtle,
        shadowColor: glowColor || theme.brandColors.primary,
      }
    : {};

  // On Android, BlurView doesn't work as well, so we use a semi-transparent background
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.isDark
              ? `rgba(30, 30, 30, ${opacity})`
              : `rgba(255, 255, 255, ${opacity})`,
            borderRadius: theme.componentRadius.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
          },
          glowStyle,
          style,
        ]}
      >
        <View style={[styles.content, !noPadding && styles.padding]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.componentRadius.card,
          overflow: 'hidden',
        },
        glowStyle,
        style,
      ]}
    >
      <BlurView
        intensity={blur}
        tint={theme.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Gradient overlay for extra depth */}
      <LinearGradient
        colors={
          theme.isDark
            ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
            : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.4)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: theme.componentRadius.card,
            borderWidth: 1,
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.5)',
          },
        ]}
      />

      <View style={[styles.content, !noPadding && styles.padding]}>
        {children}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },
  padding: {
    padding: 16,
  },
});
