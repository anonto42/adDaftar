import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text } from './Text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  topTitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
}

export const ScreenHeader = ({ title, subtitle, topTitle, icon, rightElement }: ScreenHeaderProps) => {
  const { theme } = useTheme();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleContainer}>
        {topTitle && (
          <Text style={[styles.topTitle, { color: theme.colors.primary }]}>
            {topTitle}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      </View>
      
      {rightElement ? (
        rightElement
      ) : icon ? (
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name={icon} size={24} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
  },
  topTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  iconContainer: {
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
});
