import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { theme } from '@/config/theme';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size={size} 
        color={theme.colors.primary} 
        style={styles.indicator}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  indicator: {
    marginBottom: theme.spacing.lg,
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onBackground,
    textAlign: 'center',
    opacity: 0.7,
  },
});
