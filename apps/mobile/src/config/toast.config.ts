import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={[styles.toast, styles.successToast]}>
      <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{text1}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
  
  error: ({ text1, text2 }: any) => (
    <View style={[styles.toast, styles.errorToast]}>
      <Ionicons name="close-circle" size={24} color={theme.colors.error} />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{text1}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
  
  warning: ({ text1, text2 }: any) => (
    <View style={[styles.toast, styles.warningToast]}>
      <Ionicons name="warning" size={24} color={theme.colors.warning} />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{text1}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
  
  info: ({ text1, text2 }: any) => (
    <View style={[styles.toast, styles.infoToast]}>
      <Ionicons name="information-circle" size={24} color={theme.colors.info} />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{text1}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 60,
    ...theme.shadows.md,
  },
  successToast: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  errorToast: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  warningToast: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  infoToast: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  toastContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  toastTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onBackground,
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
