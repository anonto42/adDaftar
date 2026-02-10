/**
 * Root Layout
 *
 * Main app layout with theme, navigation, and auth protection.
 */

import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/src/shared/theme';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Custom Animated Splash Screen
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide after delay
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <View style={[styles.splashContainer, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.splashContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.gradients.primary as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.splashIcon}
        >
          <Text style={styles.splashIconText}>S</Text>
        </LinearGradient>
        <Text style={[styles.splashTitle, { color: theme.colors.text }]}>
          ShopManager
        </Text>
      </Animated.View>
    </View>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Import database and stores
        const { initializeDatabase } = await import('@/src/services/database');
        const { runMigrationIfNeeded } = await import('@/src/services/database/migrations');
        const { runSchemaV2Migration } = await import('@/src/services/database/schema-v2-migration');
        const { useProductStore } = await import('@/src/store/product.store');
        const { useCustomerStore } = await import('@/src/store/customer.store');
        const { useSalesStore } = await import('@/src/store/sales.store');
        const { useAppStore } = await import('@/src/store/app.store');
        const { useCategoryStore } = await import('@/src/store/category.store');
        const { usePaymentStore } = await import('@/src/store/payment.store');
        const { useExpenseStore } = await import('@/src/store/expense.store');

        // 1. Initialize SQLite database
        console.log('[App] Initializing database...');
        await initializeDatabase();

        // 2. Run AsyncStorage → SQLite migration if needed (first launch after v1 update)
        console.log('[App] Running v1 migration if needed...');
        await runMigrationIfNeeded();

        // 3. Run schema v2 migration (add new columns and tables)
        console.log('[App] Running schema v2 migration if needed...');
        await runSchemaV2Migration();

        // 4. Hydrate all stores from SQLite
        console.log('[App] Hydrating stores...');
        await Promise.all([
          useProductStore.getState().hydrate(),
          useCustomerStore.getState().hydrate(),
          useSalesStore.getState().hydrate(),
          useAppStore.getState().hydrate(),
          useCategoryStore.getState().hydrate(),
          usePaymentStore.getState().hydrate(),
          useExpenseStore.getState().hydrate(),
        ]);

        console.log('[App] ✓ App initialization complete');
      } catch (e) {
        console.error('[App] Failed to initialize:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing App...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {/* Main app screens (protected) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="customers/[id]" options={{ presentation: 'card', headerShown: true, title: 'Customer Details' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIconText: {
    fontSize: 60,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  splashTitle: {
    marginTop: 24,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  splashTagline: {
    marginTop: 8,
    fontSize: 16,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 50,
    fontSize: 14,
  },
});
