import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { useAppStore } from '@/src/features/settings';
import { useI18n } from '@/src/shared/i18n';
import { PressableScale } from '@/src/shared/components/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const currentLang = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  
  const { t } = useI18n();
  const [step, setStep] = useState(1);

  // Robust redirection
  useEffect(() => {
    if (hasCompletedOnboarding) {
      console.log('[Onboarding] Completion detected, redirecting...');
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, router]);

  const handleFinish = async () => {
    console.log('[Onboarding] Finishing onboarding action...');
    await setOnboardingComplete(true);
  };

  const handleSetLanguage = (code: string) => {
    console.log('[Onboarding] Setting language to:', code);
    setLanguage(code as any);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('select_language')}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Choose your preferred language to continue.
      </Text>
      
      <View style={styles.langGrid}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.langCard,
              { 
                backgroundColor: theme.colors.card, 
                borderColor: currentLang === lang.code ? theme.colors.primary : theme.colors.border 
              },
              currentLang === lang.code && styles.langCardActive
            ]}
            onPress={() => handleSetLanguage(lang.code)}
          >
            <Text style={[styles.langNative, { color: theme.colors.text }]}>{lang.native}</Text>
            <Text style={[styles.langLabel, { color: theme.colors.textSecondary }]}>{lang.label}</Text>
            {currentLang === lang.code && (
              <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <PressableScale
        style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setStep(2)}
      >
        <Text style={styles.nextButtonText}>{t('continue')}</Text>
        <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
      </PressableScale>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <LinearGradient
          colors={theme.gradients.primary as any}
          style={styles.iconGradient}
        >
          <Ionicons name="rocket" size={48} color="white" />
        </LinearGradient>
      </View>
      
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('welcome')}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {t('onboarding_subtitle')}
      </Text>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('feature_pos_title')}</Text>
            <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{t('feature_pos_desc')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="cube-outline" size={24} color="#10B981" />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('feature_inventory_title')}</Text>
            <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{t('feature_inventory_desc')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: '#3B82F615' }]}>
            <Ionicons name="stats-chart-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('feature_analytics_title')}</Text>
            <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{t('feature_analytics_desc')}</Text>
          </View>
        </View>
      </View>

      <PressableScale
        style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleFinish}
      >
        <Text style={styles.nextButtonText}>{t('get_started')}</Text>
      </PressableScale>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 ? renderStep1() : renderStep2()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  stepContainer: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  langCard: { 
    width: '48%', 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 2, 
    marginBottom: 16, 
    alignItems: 'center',
    position: 'relative'
  },
  langCardActive: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  langNative: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  langLabel: { fontSize: 14 },
  checkIcon: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  nextButton: { flexDirection: 'row', width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 24, elevation: 8 },
  iconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  featuresList: { width: '100%', marginBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  featureIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  featureDesc: { fontSize: 14, lineHeight: 20 },
});
