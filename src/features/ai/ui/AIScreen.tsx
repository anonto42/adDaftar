import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { useI18n } from '@/src/shared/i18n';
import { useBusinessStore } from '@/src/features/business';
import { ScreenHeader, Text } from '@/src/shared/components';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.4;

export default function AIScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeBusiness } = useBusinessStore();
  const { t } = useI18n();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const drawerAnimation = useSharedValue(0);

  const dummyHistory = [
    { id: '1', title: 'Sales forecast for March', date: '2h ago' },
    { id: '2', title: 'Top selling products analysis', date: 'Yesterday' },
    { id: '3', title: 'Inventory restock suggestions', date: 'Feb 15' },
    { id: '4', title: 'Profit margin comparison', date: 'Feb 12' },
    { id: '5', title: 'Customer loyalty report', date: 'Feb 10' },
  ];

  const toggleHistory = () => {
    const newValue = isHistoryOpen ? 0 : 1;
    drawerAnimation.value = withSpring(newValue, {
      damping: 30,
      stiffness: 90,
    });
    setIsHistoryOpen(!isHistoryOpen);
  };

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(drawerAnimation.value, [0, 1], [DRAWER_WIDTH, 0]) }]
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drawerAnimation.value, [0, 1], [0, 1]),
    display: drawerAnimation.value > 0 ? 'flex' : 'none',
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ 
        headerShown: false, 
      }} />

      <View style={{ flex: 1, paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <ScreenHeader 
          title="AI Assistant"
          subtitle="Business Intelligence"
          topTitle={activeBusiness?.name}
          rightElement={
            <TouchableOpacity 
              style={[styles.historyButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={toggleHistory}
            >
              <Ionicons name="time-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          }
        />

        <ScrollView 
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.primary} />
          </View>
          
          <Text variant="h2" style={{ marginTop: 24, textAlign: 'center' }}>
            Ad-Daftar AI
          </Text>
          
          <Text variant="bodyLarge" style={{ marginTop: 8, textAlign: 'center', color: theme.colors.textSecondary, paddingHorizontal: 32 }}>
            Your intelligent business companion is being prepared. Soon you'll be able to ask questions about your sales, inventory, and profit.
          </Text>

          <View style={[styles.placeholderCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text variant="label" style={{ color: theme.colors.primary, marginBottom: 8 }}>
              COMING SOON
            </Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              • Sales Forecasting{"\n"}
              • Inventory Optimization{"\n"}
              • Customer Insights{"\n"}
              • Voice Commands
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* History Drawer Overlay */}
      <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
        <Pressable style={styles.flex} onPress={toggleHistory}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
      </Animated.View>

      {/* History Drawer */}
      <Animated.View style={[styles.drawer, animatedDrawerStyle, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.border, paddingTop: insets.top + 16 }]}>
        <View style={styles.drawerHeader}>
          <Text variant="label" style={{ fontWeight: 'bold' }}>History</Text>
          <TouchableOpacity 
            onPress={toggleHistory}
            style={[styles.closeButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
          {dummyHistory.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.historyItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                // Future: Load chat
                toggleHistory();
              }}
            >
              <View style={styles.historyIcon}>
                <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" style={{ fontSize: 13, color: theme.colors.text }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text variant="label" style={{ fontSize: 10, color: theme.colors.textTertiary, marginTop: 2 }}>
                  {item.date}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {dummyHistory.length === 0 && (
            <View style={styles.emptyHistoryContainer}>
              <Ionicons name="chatbox-ellipses-outline" size={32} color={theme.colors.textTertiary} style={{ marginBottom: 12 }} />
              <Text variant="body" style={{ color: theme.colors.textTertiary, textAlign: 'center' }}>
                No history yet.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  historyButton: {
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1, 
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, 
    shadowRadius: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyIcon: {
    marginRight: 10,
    opacity: 0.7,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCard: {
    marginTop: 40,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    maxWidth: 300,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 1001,
    borderLeftWidth: 1,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  drawerContent: {
    padding: 16,
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  }
});
