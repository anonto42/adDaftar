import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useTheme } from '../theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const SIDEBAR_WIDTH = 85;
const TAG_WIDTH = 12;
const TAG_HEIGHT = 70;

export const SideTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const animation = useSharedValue(0);

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

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(animation.value, [0, 1], [-SIDEBAR_WIDTH, 0]) }
      ],
    };
  });

  const animatedTagStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(animation.value, [0, 1], [0, SIDEBAR_WIDTH]) },
      ],
      opacity: interpolate(animation.value, [0, 0.1], [1, 0]),
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animation.value, [0, 1], [0, 0.4]),
      display: animation.value > 0 ? 'flex' : 'none',
    };
  });

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
      <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
        <Pressable style={styles.flex} onPress={closeSidebar} />
      </Animated.View>

      <Animated.View style={[styles.tagContainer, animatedTagStyle]}>
        <TouchableOpacity 
          onPress={toggleSidebar}
          activeOpacity={0.8}
          style={[styles.tag, { backgroundColor: theme.colors.primary }]}
        />
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
        
        <View style={[styles.innerContainer, { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
            <Ionicons name="chevron-back" size={26} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            style={styles.mainScroll}
          >
            {state.routes.filter(r => r.name !== 'settings').map((route, idx) => {
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
  closeButton: {
    height: 50,
    width: SIDEBAR_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
});
