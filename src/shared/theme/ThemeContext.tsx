/**
 * Theme Context
 *
 * Provides theme state and utilities throughout the app.
 * Supports light/dark mode with system preference detection.
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors, brandColors, gradients } from './colors';
import { spacing, layoutSpacing } from './spacing';
import { textStyles, fontSize, fontWeight, lineHeight } from './typography';
import { radius, componentRadius } from './radius';
import { shadows, glows } from './shadows';
import { duration, easing, spring, animations } from './motion';

// Theme modes
export type ThemeMode = 'light' | 'dark' | 'system';

// Full theme object
export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  brandColors: typeof brandColors;
  gradients: typeof gradients;
  spacing: typeof spacing;
  layoutSpacing: typeof layoutSpacing;
  textStyles: typeof textStyles;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  radius: typeof radius;
  componentRadius: typeof componentRadius;
  shadows: typeof shadows;
  glows: typeof glows;
  duration: typeof duration;
  easing: typeof easing;
  spring: typeof spring;
  animations: typeof animations;
}

// Context value type
interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@app_theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch {
        // Silently fail, use default
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Silently fail
    }
  }, []);

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, setThemeMode]);

  // Determine if we should use dark mode
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Build theme object
  const theme: Theme = useMemo(
    () => ({
      mode: themeMode,
      isDark,
      colors: (isDark ? darkColors : lightColors) as ThemeColors,
      brandColors,
      gradients,
      spacing,
      layoutSpacing,
      textStyles,
      fontSize,
      fontWeight,
      lineHeight,
      radius,
      componentRadius,
      shadows,
      glows,
      duration,
      easing,
      spring,
      animations,
    }),
    [isDark, themeMode]
  );

  const value: ThemeContextValue = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, setThemeMode, toggleTheme]
  );

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Theme...</Text>
      </View>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook to use theme
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to get just colors (convenience)
export function useColors(): ThemeColors {
  const { theme } = useTheme();
  return theme.colors;
}
