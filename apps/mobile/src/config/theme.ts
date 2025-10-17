import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const colors = {
  // Primary colors
  primary: '#1976D2',
  primaryVariant: '#1565C0',
  secondary: '#FF4081',
  secondaryVariant: '#F50057',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Background colors
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceVariant: '#E0E0E0',
  
  // Text colors
  onBackground: '#212121',
  onSurface: '#424242',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  
  // Border colors
  outline: '#BDBDBD',
  outlineVariant: '#E0E0E0',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
  
  // Dark theme colors
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    onBackground: '#FFFFFF',
    onSurface: '#E0E0E0',
    outline: '#4A4A4A',
    outlineVariant: '#3A3A3A',
  },
  
  // QR Code colors
  qr: {
    background: '#FFFFFF',
    foreground: '#000000',
    errorCorrectionLevel: 'M' as const,
  },
  
  // Payment colors
  payment: {
    paymob: '#1E88E5',
    fawry: '#4CAF50',
  },
  
  // Event categories
  categories: {
    music: '#E91E63',
    sports: '#4CAF50',
    conference: '#2196F3',
    exhibition: '#FF9800',
    workshop: '#9C27B0',
    festival: '#FF5722',
    wedding: '#E91E63',
    corporate: '#607D8B',
    education: '#795548',
    other: '#9E9E9E',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...colors,
    ...colors.dark,
  },
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Navigation themes
export const navigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.onBackground,
    border: colors.outline,
    notification: colors.error,
  },
};

export const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.dark.background,
    card: colors.dark.surface,
    text: colors.dark.onBackground,
    border: colors.dark.outline,
    notification: colors.error,
  },
};

export const theme = lightTheme;
