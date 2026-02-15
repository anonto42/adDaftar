import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { useI18n } from '@/src/shared/i18n';
import { useBusinessStore } from '@/src/features/business';
import { ScreenHeader } from '@/src/shared/components';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeBusiness } = useBusinessStore();
  const { t } = useI18n();

  const PolicySection = ({ title, content }: { title: string; content: string }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.sectionContent, { color: theme.colors.textSecondary }]}>{content}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16, paddingHorizontal: 16 }]}>
      <Stack.Screen options={{ 
        headerShown: false, 
      }} />

      <ScreenHeader 
        title={t('privacy_policy')}
        subtitle="Security"
        topTitle={activeBusiness?.name}
        icon="shield-checkmark"
      />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: theme.colors.textSecondary }]}>
          Last Updated: February 2026
        </Text>
        
        <PolicySection 
          title="1. Information Collection" 
          content="We collect minimal information required to provide our shop management services. This includes product details, customer names, and transaction records which are stored locally on your device." 
        />

        <PolicySection 
          title="2. Data Storage" 
          content="All your business data (inventory, sales, expenses) is stored securely in a local SQLite database on your mobile device. We do not upload this data to our servers unless you explicitly use a cloud backup feature (if available)." 
        />

        <PolicySection 
          title="3. Data Usage" 
          content="Your data is used solely for the purpose of generating analytics, managing inventory, and providing you with business insights within the Hisab Rakho application." 
        />

        <PolicySection 
          title="4. Data Security" 
          content="We implement industry-standard security measures to protect your information. Since data is local, its security also depends on your device's security settings (PIN, biometric lock)." 
        />

        <PolicySection 
          title="5. Third-Party Services" 
          content="We do not sell, trade, or otherwise transfer your personally identifiable information to third parties." 
        />

        <PolicySection 
          title="6. Contact Us" 
          content="If you have any questions regarding this privacy policy, you may contact us through the app feedback system or our official support email." 
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
            © 2026 Hisab Rakho. All Rights Reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  greeting: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  header: { fontSize: 28, fontWeight: 'bold' },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  intro: { fontSize: 14, marginBottom: 24, fontStyle: 'italic' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  sectionContent: { fontSize: 15, lineHeight: 22 },
  footer: { marginTop: 16, alignItems: 'center' },
  footerText: { fontSize: 12 },
});
