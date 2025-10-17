module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/store': './src/store',
          '@/utils': './src/utils',
          '@/types': './src/types',
          '@/hooks': './src/hooks',
          '@/assets': './src/assets',
          '@/config': './src/config',
          '@/navigation': './src/navigation',
          '@/shared': '../../packages/shared',
          '@/backend-types': '../../apps/backend/src/types',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
