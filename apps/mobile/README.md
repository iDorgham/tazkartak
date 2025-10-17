# Tazkartak Mobile App

React Native mobile application for the Tazkartak event ticket platform, supporting iOS and Android.

## Features

- **Multi-Role Support**: Ticket Buyers, Event Organizers, Venue Owners, and Administrators
- **Offline Functionality**: View cached events and tickets without internet connection
- **Biometric Authentication**: Fingerprint and Face ID support
- **QR Code Integration**: Generate and scan QR codes for ticket validation
- **Payment Integration**: Native PayMob and Fawry SDK integration
- **Push Notifications**: Real-time event updates and reminders
- **Dark Mode**: System preference-based theming

## Prerequisites

- Node.js 18+ 
- React Native CLI
- Xcode 14+ (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

## Installation

1. **Install dependencies**:
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Install iOS dependencies**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoints and configuration
   ```

## Development

### Running on iOS Simulator
```bash
npm run ios
```

### Running on Android Emulator
```bash
npm run android
```

### Running Metro Bundler
```bash
npm start
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── forms/          # Form components
│   ├── modals/         # Modal components
│   ├── navigation/     # Navigation components
│   ├── payment/        # Payment components
│   └── qr/             # QR code components
├── config/             # App configuration
├── hooks/              # Custom React hooks
├── navigation/         # Navigation setup
├── screens/            # Screen components
│   ├── admin/          # Admin screens
│   ├── auth/           # Authentication screens
│   ├── buyer/          # Ticket buyer screens
│   ├── organizer/      # Event organizer screens
│   └── venue/          # Venue owner screens
├── services/           # API and utility services
│   ├── offline/        # Offline functionality
│   └── payment/        # Payment integrations
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── assets/             # Images, fonts, icons
```

## Key Technologies

- **React Native 0.74+**: Cross-platform mobile framework
- **TypeScript**: Type-safe development
- **React Navigation 6**: Navigation library
- **Redux Toolkit**: State management
- **React Query**: Server state management
- **React Native Paper**: Material Design components
- **React Native Reanimated**: Smooth animations
- **React Native Keychain**: Secure storage
- **React Native Biometrics**: Biometric authentication

## Configuration

### API Configuration
Update `src/config/api.config.ts` with your backend API endpoints:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.tazkartak.com/api',
  TIMEOUT: 30000,
};
```

### Payment Configuration
Configure payment gateways in `src/services/payment/`:
- PayMob integration
- Fawry integration
- WebView fallback

### Push Notifications
Configure Firebase Cloud Messaging in `src/services/notification.service.ts`.

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
cd ios
xcodebuild -workspace Tazkartak.xcworkspace -scheme Tazkartak -configuration Release
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e:ios
npm run test:e2e:android
```

## Deployment

### App Store (iOS)
1. Configure code signing in Xcode
2. Archive the app
3. Upload to App Store Connect
4. Submit for review

### Google Play Store (Android)
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Submit for review

## Offline Functionality

The app supports offline functionality with:
- Cached event data (last 30 days)
- Offline ticket viewing with QR codes
- Queued actions for later sync
- Background synchronization

## Security Features

- Secure token storage using Keychain
- Biometric authentication
- Encrypted QR codes
- Certificate pinning for API calls
- Code obfuscation in production builds

## Performance Targets

- App launch: < 2 seconds
- Screen transitions: 60 FPS
- API response rendering: < 100ms
- QR code generation: < 500ms
- Camera QR scan: < 1 second

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **iOS build issues**: Clean build folder in Xcode
3. **Android build issues**: Clean project with `cd android && ./gradlew clean`

### Debugging

- Use React Native Debugger for Redux state inspection
- Enable Flipper for network debugging
- Use console logs in development mode

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit pull requests for review

## License

This project is part of the Tazkartak platform. See the main project LICENSE file for details.
