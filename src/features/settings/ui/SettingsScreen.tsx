import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { useAppStore } from '@/src/store';
import { useI18n } from '@/src/shared/i18n';
import { dropAllTables, initializeDatabase, resetDatabaseState } from '@/src/services/database';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currency, setCurrency, setTheme: setStoreTheme, language, setLanguage } = useAppStore();
  const { t } = useI18n();

  const handleSetTheme = async (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    await setStoreTheme(mode);
  };

  const handleResetApp = () => {
    Alert.alert(
      t('delete'),
      'This will delete all data (products, customers, sales, expenses). This action cannot be undone.',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Drop all tables
              await dropAllTables();

              // Reset database state to clear initialization promise
              resetDatabaseState();

              // Reinitialize database
              await initializeDatabase();

              Alert.alert('Success', 'App has been reset. Please restart the app.');
            } catch (error) {
              console.error('[Settings] Failed to reset app:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', 'Failed to reset app: ' + errorMessage);
            }
          }
        }
      ]
    );
  };

  const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({ 
    icon, 
    title, 
    value, 
    onPress, 
    showChevron = true,
    isLast = false 
  }: { 
    icon: string, 
    title: string, 
    value?: string, 
    onPress?: () => void,
    showChevron?: boolean,
    isLast?: boolean
  }) => (
    <TouchableOpacity 
      style={[styles.item, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '10' }]}>
          <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
        </View>
        <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={[styles.itemValue, { color: theme.colors.textSecondary }]}>{value}</Text>}
        {showChevron && <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />}
      </View>
    </TouchableOpacity>
  );

  const getLanguageLabel = (code: string) => {
    const map: any = { en: 'English', bn: 'Bengali', ar: 'Arabic', hi: 'Hindi', es: 'Spanish', fr: 'French' };
    return map[code] || code;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: t('settings'),
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      }} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <SettingSection title="Appearance">
          <SettingItem 
            icon="color-palette-outline" 
            title="Theme" 
            value={themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
            onPress={() => {
              Alert.alert('Select Theme', '', [
                { text: 'Light', onPress: () => handleSetTheme('light') },
                { text: 'Dark', onPress: () => handleSetTheme('dark') },
                { text: 'System', onPress: () => handleSetTheme('system') },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }}
          />
          <SettingItem 
            icon="language-outline" 
            title={t('select_language')} 
            value={getLanguageLabel(language)}
            onPress={() => {
              Alert.alert(t('select_language'), '', [
                { text: 'English', onPress: () => setLanguage('en') },
                { text: 'বাংলা (Bengali)', onPress: () => setLanguage('bn') },
                { text: 'العربية (Arabic)', onPress: () => setLanguage('ar') },
                { text: 'हिन्दी (Hindi)', onPress: () => setLanguage('hi') },
                { text: 'Español (Spanish)', onPress: () => setLanguage('es') },
                { text: 'Français (French)', onPress: () => setLanguage('fr') },
                { text: t('cancel'), style: 'cancel' }
              ]);
            }}
          />
          <SettingItem 
            icon="cash-outline" 
            title="Currency" 
            value={currency}
            isLast={true}
            onPress={() => {
              Alert.alert('Select Currency', '', [
                { text: 'USD ($)', onPress: () => setCurrency('USD') },
                { text: 'BDT (৳)', onPress: () => setCurrency('BDT') },
                { text: 'EUR (€)', onPress: () => setCurrency('EUR') },
                { text: 'GBP (£)', onPress: () => setCurrency('GBP') },
                { text: 'INR (₹)', onPress: () => setCurrency('INR') },
                { text: 'JPY (¥)', onPress: () => setCurrency('JPY') },
                { text: 'SAR (﷼)', onPress: () => setCurrency('SAR') },
                { text: 'AED (د.إ)', onPress: () => setCurrency('AED') },
                { text: t('cancel'), style: 'cancel' }
              ]);
            }}
          />
        </SettingSection>

        <SettingSection title="Data Management">
          <SettingItem 
            icon="cloud-upload-outline" 
            title="Backup Data" 
            onPress={() => Alert.alert('Coming Soon', 'Cloud backup will be available in a future update.')}
          />
          <SettingItem 
            icon="refresh-outline" 
            title="Reset App" 
            showChevron={false}
            isLast={true}
            onPress={handleResetApp}
          />
        </SettingSection>

        <SettingSection title="About">
          <SettingItem 
            icon="information-circle-outline" 
            title="Version" 
            value="1.0.0" 
            showChevron={false}
          />
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Privacy Policy" 
            onPress={() => router.push('/privacy-policy')}
          />
          <SettingItem 
            icon="star-outline" 
            title="Rate the App" 
            isLast={true}
            onPress={() => {}}
          />
        </SettingSection>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
            Developed by Sohidul Islam Ananto
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  sectionContent: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  itemValue: { fontSize: 15, marginRight: 8 },
  footer: { marginTop: 40, alignItems: 'center', marginBottom: 20 },
  footerText: { fontSize: 12 },
});
