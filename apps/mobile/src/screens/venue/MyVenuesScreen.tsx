import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MyVenuesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Venues</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

