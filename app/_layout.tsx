import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/src/shared/theme';
import { useAppStore } from '@/src/store';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { theme } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    async function prepare() {
      try {
        // Import database and stores
        const { initializeDatabase, initializeIndexes, getDatabase } = await import('@/src/services/database');
        const { SCHEMA_VERSION } = await import('@/src/services/database/schema');
        const { runMigrationIfNeeded } = await import('@/src/services/database/migrations');
        const { runSchemaV2Migration } = await import('@/src/services/database/schema-v2-migration');
        const { runSchemaV4Migration } = await import('@/src/services/database/schema-v4-migration');
        const { runSchemaV5Migration } = await import('@/src/services/database/schema-v5-migration');
        const { useProductStore, useCustomerStore, useSalesStore, useCategoryStore, usePaymentStore, useExpenseStore, useAppStore, useBusinessStore } = await import('@/src/store');

        // 1. Initialize SQLite database tables
        console.log('[App] Initializing database tables...');
        await initializeDatabase();

        // 2. Run AsyncStorage → SQLite migration if needed 
        console.log('[App] Running v1 migration if needed...');
        await runMigrationIfNeeded();

        // 3. Run schema v2 migration 
        console.log('[App] Running schema v2 migration if needed...');
        await runSchemaV2Migration();

        // 4. Run multi-business migration
        console.log('[App] Running multi-business migration if needed...');
        await runSchemaV4Migration();

        // 5. Run partial payment migration
        console.log('[App] Running partial payment migration if needed...');
        await runSchemaV5Migration();

        // 6. Initialize database indexes (after migrations ensure columns exist)
        console.log('[App] Initializing database indexes...');
        await initializeIndexes();

        // 7. Ensure schema version is set to current
        const db = getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
          ['schema_version', SCHEMA_VERSION.toString(), now]
        );

        // 8. Hydrate all stores from SQLite sequentially to avoid contention
        console.log('[App] Hydrating stores...');
        await useAppStore.getState().hydrate();
        await useBusinessStore.getState().hydrate();
        await useProductStore.getState().hydrate();
        await useCategoryStore.getState().hydrate();
        await useCustomerStore.getState().hydrate();
        await useSalesStore.getState().hydrate();
        await usePaymentStore.getState().hydrate();
        await useExpenseStore.getState().hydrate();

        console.log('[App] ✓ App initialization complete');
      } catch (e) {
        console.error('[App] Failed to initialize:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (!appIsReady || !isHydrated) return;

    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboardingGroup) {
      router.replace('/(tabs)');
    }
  }, [appIsReady, isHydrated, segments, hasCompletedOnboarding, router]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing App...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} key={theme.isDark ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }}
      >
        {/* Main app screens (protected) */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
        <Stack.Screen name="customers/[id]" options={{ presentation: 'card', headerShown: true, title: 'Customer Details' }} />
        <Stack.Screen name="sales-history" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="reports" options={{ presentation: 'modal', headerShown: false }} />
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
