import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Pressable, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useTheme } from '../theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useBusinessStore } from '@/src/features/business';

const SIDEBAR_WIDTH = 85;
const TAG_WIDTH = 12;
const TAG_HEIGHT = 70;

export const SideTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { businesses, activeBusiness, setActiveBusinessId } = useBusinessStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitchModalVisible, setIsSwitchModalVisible] = useState(false);
  
  const animation = useSharedValue(0);

  // Helper to sync React state from Reanimated thread
  const updateState = (open: boolean) => {
    setIsOpen(open);
  };

  const toggleSidebar = useCallback(() => {
    const newValue = isOpen ? 0 : 1;
    animation.value = withSpring(newValue, {
      damping: 40,
      stiffness: 90,
    });
    setIsOpen(!isOpen);
  }, [isOpen, animation]);

  const closeSidebar = useCallback(() => {
    animation.value = withSpring(0);
    setIsOpen(false);
  }, [animation]);

  const handleSwitchBusiness = async (id: string) => {
    await setActiveBusinessId(id);
    setIsSwitchModalVisible(false);
    closeSidebar();
  };

  // --- Gesture Logic ---
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow activation if sidebar is closed
      if (!isOpen && e.translationX < 0) return;

      const progress = isOpen 
        ? 1 + e.translationX / SIDEBAR_WIDTH 
        : e.translationX / SIDEBAR_WIDTH;
      
      animation.value = Math.min(Math.max(progress, 0), 1);
    })
    .onEnd((e) => {
      // Snap logic: Open if swiped > 40px or fast velocity
      if (e.translationX > 40 || e.velocityX > 500) {
        animation.value = withSpring(1);
        runOnJS(updateState)(true);
      } else {
        animation.value = withSpring(0);
        runOnJS(updateState)(false);
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(animation.value, [0, 1], [-SIDEBAR_WIDTH, 0]) }]
  }));

  const animatedTagStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(animation.value, [0, 1], [0, SIDEBAR_WIDTH]) }],
    opacity: interpolate(animation.value, [0, 0.1], [1, 0]),
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0, 1], [0, 0.4]),
    display: animation.value > 0 ? 'flex' : 'none',
  }));

  const renderTab = (route: any, index: number, isSettings = false) => {
    const { options } = descriptors[route.key] || {};
    const isFocused = isSettings ? false : state.index === index;

    const onPress = () => {
      if (isSettings) {
        router.push('/settings');
      } else {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      }
      closeSidebar();
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.tabItem,
          isFocused && { backgroundColor: theme.colors.primary + '15' }
        ]}
      >
        <View style={styles.iconContainer}>
          {options?.tabBarIcon ? options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
            size: 24
          }) : (
            <Ionicons 
              name={isSettings ? "settings-outline" : "help-circle-outline"} 
              size={24} 
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary} 
            />
          )}
        </View>
        <Text
          style={[
            styles.label,
            { 
              color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
              fontWeight: isFocused ? '700' : '500',
            }
          ]}
          numberOfLines={1}
        >
          {options?.title || (isSettings ? 'Settings' : route.name)}
        </Text>
        {isFocused && <View style={[styles.activePill, { backgroundColor: theme.colors.primary }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <GestureDetector gesture={panGesture}>
        {/* box-none ensures the container doesn't block touches to the main screen content */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
            <Pressable style={styles.flex} onPress={closeSidebar} />
          </Animated.View>

                  <Animated.View style={[styles.tagContainer, animatedTagStyle]}>
                    <TouchableOpacity 
                      onPress={toggleSidebar}
                      activeOpacity={0.8}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 60 }}
                      style={[styles.tag, { backgroundColor: theme.colors.primary }]}
                    >
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                    </TouchableOpacity>
                  </Animated.View>
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            <BlurView 
              intensity={80} 
              tint={theme.isDark ? 'dark' : 'light'} 
              style={[
                StyleSheet.absoluteFill, 
                { backgroundColor: theme.isDark ? 'rgba(29, 40, 60, 0.92)' : 'rgba(255, 255, 255, 0.8)' }
              ]} 
            />
            
            <View style={[styles.innerContainer, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 20) }]}>
              {activeBusiness && (
                <TouchableOpacity 
                  style={styles.businessContainer}
                  onPress={() => setIsSwitchModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.businessInitial, { color: theme.colors.primary }]}>
                    {activeBusiness.name.charAt(0).toUpperCase()}
                  </Text>
                  <Text style={[styles.businessSmallName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {activeBusiness.name}
                  </Text>
                  <Ionicons name="swap-vertical" size={14} color={theme.colors.textTertiary} style={{ marginTop: 2 }} />
                </TouchableOpacity>
              )}

              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                style={styles.mainScroll}
              >
                {state.routes.filter(r => r.name !== 'settings').map((route) => {
                  const actualIndex = state.routes.findIndex(r => r.name === route.name);
                  return renderTab(route, actualIndex);
                })}
              </ScrollView>

              <View style={styles.footerContainer}>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                {renderTab({ key: 'manual-settings', name: 'settings' }, -1, true)}
              </View>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Business Switch Modal */}
      <Modal
        visible={isSwitchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSwitchModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsSwitchModalVisible(false)}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Switch Business</Text>
            <FlatList
              data={businesses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.businessOption,
                    activeBusiness?.id === item.id && { backgroundColor: theme.colors.primary + '15' }
                  ]}
                  onPress={() => handleSwitchBusiness(item.id)}
                >
                  <View style={[
                    styles.optionIcon, 
                    { backgroundColor: activeBusiness?.id === item.id ? theme.colors.primary : theme.colors.border }
                  ]}>
                    <Text style={styles.optionIconText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.optionName, { color: theme.colors.text }]}>{item.name}</Text>
                    {item.description ? (
                      <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  {activeBusiness?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={[styles.manageButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setIsSwitchModalVisible(false);
                closeSidebar();
                router.push('/business');
              }}
            >
              <Text style={styles.manageButtonText}>Manage All Businesses</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 99,
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 101,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.26)',
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  businessContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  businessInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessSmallName: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  tagContainer: {
    position: 'absolute',
    left: 0,
    top: '42%',
    width: TAG_WIDTH,
    height: TAG_HEIGHT,
    zIndex: 100,
  },
  tag: {
    width: TAG_WIDTH,
    height: TAG_HEIGHT,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#000',
  },
  mainScroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabItem: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 6,
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
  activePill: {
    position: 'absolute',
    left: 1,
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  divider: {
    width: 30,
    height: 3,
    borderRadius: 2,
    marginBottom: 15,
    opacity: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  businessOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionDesc: {
    fontSize: 12,
  },
  manageButton: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
