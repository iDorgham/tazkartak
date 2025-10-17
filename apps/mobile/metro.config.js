const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Monorepo configuration
const monorepoConfig = {
  watchFolders: [
    path.resolve(__dirname, '../../packages'),
    path.resolve(__dirname, '../../apps/backend/src/types'),
  ],
  resolver: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/screens': path.resolve(__dirname, 'src/screens'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/assets': path.resolve(__dirname, 'src/assets'),
      '@/config': path.resolve(__dirname, 'src/config'),
      '@/navigation': path.resolve(__dirname, 'src/navigation'),
      '@/shared': path.resolve(__dirname, '../../packages/shared'),
      '@/backend-types': path.resolve(__dirname, '../../apps/backend/src/types'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, monorepoConfig);
