import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/config/theme';

export const SplashScreen: React.FC = () => {
  useEffect(() => {
    // Hide splash screen after a delay
    const timer = setTimeout(() => {
      // Splash screen will be automatically hidden by the navigation
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Tazkartak</Text>
        <Text style={styles.subtitle}>Event Ticket Platform</Text>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loader}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xl,
  },
  loader: {
    marginTop: theme.spacing.lg,
  },
});

