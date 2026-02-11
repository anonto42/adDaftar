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

const SIDEBAR_WIDTH = 80;
const TAG_WIDTH = 12;
const TAG_HEIGHT = 80;

export const SideTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  
  // Animation value: 0 is closed, 1 is open
  const animation = useSharedValue(0);

  const toggleSidebar = useCallback(() => {
    const newValue = isOpen ? 0 : 1;
    animation.value = withSpring(newValue, {
      damping: 40,
      stiffness: 150,
    });
    setIsOpen(!isOpen);
  }, [isOpen]);

  const closeSidebar = useCallback(() => {
    animation.value = withSpring(0);
    setIsOpen(false);
  }, []);

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
      opacity: interpolate(animation.value, [0, 1], [0, 0.5]),
      display: animation.value > 0 ? 'flex' : 'none',
    };
  });

  return (
    <>
      {/* Overlay to close when clicking outside */}
      <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
        <Pressable style={styles.flex} onPress={closeSidebar} />
      </Animated.View>

      {/* Toggle Tag - Now a thin bar in the middle */}
      <Animated.View style={[styles.tagContainer, animatedTagStyle]}>
        <TouchableOpacity 
          onPress={toggleSidebar}
          activeOpacity={0.7}
          style={[
            styles.tag, 
            { 
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            }
          ]}
        />
      </Animated.View>

      <Animated.View style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.tabBar,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: theme.colors.tabBarBorder,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom,
        },
        animatedContainerStyle
      ]}>
        {/* Close Area at top of sidebar */}
        <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.tabBarActive} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
              
              closeSidebar();
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabItem,
                  isFocused && { backgroundColor: theme.colors.primary + '15' }
                ]}
              >
                <View style={styles.iconContainer}>
                  {options.tabBarIcon && options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? theme.colors.tabBarActive : theme.colors.tabBarInactive,
                    size: 24
                  })}
                </View>
                <Text
                  style={[
                    styles.label,
                    { 
                      color: isFocused ? theme.colors.tabBarActive : theme.colors.tabBarInactive,
                      fontSize: 10,
                    }
                  ]}
                  numberOfLines={1}
                >
                  {options.title || route.name}
                </Text>
                {isFocused && <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 99,
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 101,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  closeButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  tagContainer: {
    position: 'absolute',
    left: 0,
    top: '40%', // Centered vertically
    width: TAG_WIDTH,
    height: TAG_HEIGHT,
    justifyContent: 'center',
    zIndex: 100,
  },
  tag: {
    width: TAG_WIDTH,
    height: TAG_HEIGHT,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 4,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabItem: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 4,
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: 30,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  }
});