<!-- 69662593-8152-4a9c-8032-1362101b2980 ef3d22f8-ba5f-46c5-b211-52dcfa0f307f -->
# Phase 5: Venue Owner Features Implementation

## Overview
Build comprehensive venue owner functionality including venue management, QR ticket scanning with encryption and signature verification, and team management using react-native-vision-camera and react-native-maps.

## 1. Update Venue Navigator (apps/mobile/src/navigation/VenueNavigator.tsx)

Replace placeholder with complete navigation structure:
- VenueListScreen - List all owned venues
- VenueDetailsScreen - View venue info and upcoming events
- CreateVenueScreen - Add new venue with react-native-maps location picker
- EditVenueScreen - Update venue details and photos
- QRScannerScreen - Camera-based QR scanner with vision-camera
- ScanHistoryScreen - Log of all scanned tickets
- EventCheckInScreen - Check-in stats for specific event
- VenueTeamScreen - Team member management
- TeamPermissionsScreen - Assign scanning permissions

Define VenueStackParamList TypeScript types for navigation params.

## 2. Venue List Screen (apps/mobile/src/screens/venue/VenueListScreen.tsx)

Create comprehensive venue list with:
- FlatList of venue cards showing name, address, capacity, upcoming events
- Segmented buttons for filtering (all/active/inactive)
- Pull-to-refresh functionality
- Stats cards showing total venues, total capacity, active events
- FAB button to create new venue
- Navigation to venue details on card press
- Empty state with "Create First Venue" CTA

Integration: Use venuesService.getMyVenues() from existing services.

## 3. Create Venue Screen (apps/mobile/src/screens/venue/CreateVenueScreen.tsx)

Multi-step venue creation form:

**Step 1: Basic Information**
- Venue name input
- Venue type selection (chips: theater, stadium, conference center, etc.)
- Capacity input (numeric)
- Description textarea

**Step 2: Location**
- Address input fields (street, city, country)
- react-native-maps MapView with draggable marker
- Geocoding integration to convert address to coordinates
- "Use Current Location" button

**Step 3: Amenities & Features**
- Checkboxes for amenities (parking, wifi, accessibility, etc.)
- Upload venue photos using react-native-image-picker
- Photo gallery preview

**Step 4: Contact & Settings**
- Contact phone and email
- Operating hours
- Special instructions
- Review summary before submission

Use venuesService.createVenue() to submit data.

## 4. QR Scanner Screen (apps/mobile/src/screens/venue/QRScannerScreen.tsx)

Implement full-featured QR scanner:

**Camera Setup**
- Use react-native-vision-camera with useFrameProcessor
- Scan QR codes using vision-camera-code-scanner
- Real-time barcode detection with BarcodeFormat.QR_CODE
- Torch/flash toggle button
- Camera permission handling

**QR Validation**
- Parse encrypted QR payload
- Verify ticket signature using cryptographic validation
- Check ticket status (valid/used/cancelled/expired)
- Validate against event and venue
- Handle offline validation with cached ticket data

**Validation Flow**
```typescript
1. Scan QR code → Extract encrypted payload
2. Decrypt using shared secret key
3. Verify signature (HMAC or RSA)
4. Check ticket status via API (or offline cache)
5. Show success/error with haptic feedback
6. Log scan result
```

**UI Elements**
- Scanning frame overlay with corner markers
- Status indicator (scanning/validating/success/error)
- Ticket holder information on successful scan
- Error messages for invalid tickets
- Scan history button
- Manual entry fallback

Use qrService.scanQRCode() and implement encryption/decryption utilities.

## 5. QR Encryption Service (apps/mobile/src/services/qr-encryption.service.ts)

Create new service for QR security:

```typescript
class QREncryptionService {
  // Generate encrypted QR payload
  encryptTicketData(ticketId, eventId, timestamp, signature)
  
  // Decrypt and validate QR payload
  decryptAndValidate(qrData)
  
  // Verify signature using HMAC-SHA256
  verifySignature(payload, signature, secretKey)
  
  // Generate ticket signature
  generateSignature(ticketData, secretKey)
}
```

Use react-native-crypto for encryption operations.

## 6. Scan History Screen (apps/mobile/src/screens/venue/ScanHistoryScreen.tsx)

Display scan log:
- FlatList of scan records with timestamp, ticket holder, status
- Filter by date range and status (successful/failed)
- Search by ticket holder name or ticket ID
- Export scan history as CSV
- Stats summary (total scans, successful, failed)
- Pull-to-refresh

Use qrService.getScanHistory() from existing services.

## 7. Event Check-In Screen (apps/mobile/src/screens/venue/EventCheckInScreen.tsx)

Event-specific check-in dashboard:
- Event header with title, date, venue
- Real-time check-in stats (checked in / total attendees)
- Progress bar showing attendance percentage
- Recent check-ins list with timestamps
- Quick scan button to open QR scanner
- Attendee search and manual check-in
- Export attendee list

Integration with eventsService.getEventCheckIns(eventId).

## 8. Venue Team Screen (apps/mobile/src/screens/venue/VenueTeamScreen.tsx)

Team member management:
- List of team members with name, email, role, status
- Add team member form (email invitation)
- Remove team member with confirmation
- Role badges (admin, scanner, viewer)
- Pending invitations section
- Team member search
- FAB to add new member

Use venuesService.getVenueTeam() and venuesService.inviteTeamMember().

## 9. Team Permissions Screen (apps/mobile/src/screens/venue/TeamPermissionsScreen.tsx)

Permission management:
- Team member selector
- Permission checkboxes:
  - Scan tickets
  - View analytics
  - Manage events
  - Edit venue
  - Manage team
- Save permissions button
- Permission presets (Scanner, Manager, Admin)

Use venuesService.updateTeamPermissions().

## 10. Offline QR Validation (apps/mobile/src/services/offline-qr.service.ts)

Implement offline scanning:

```typescript
class OfflineQRService {
  // Cache valid tickets for event
  cacheEventTickets(eventId, tickets)
  
  // Validate QR offline using cached data
  validateOffline(qrData, eventId)
  
  // Queue scan result for later sync
  queueScanResult(scanData)
  
  // Sync queued scans when online
  syncQueuedScans()
  
  // Check if ticket already scanned offline
  isTicketScanned(ticketId)
}
```

Store encrypted ticket data in AsyncStorage, validate signatures locally.

## 11. Venue Details Screen (apps/mobile/src/screens/venue/VenueDetailsScreen.tsx)

Comprehensive venue view:
- Venue header with photo, name, address
- Stats cards (capacity, upcoming events, total check-ins)
- Upcoming events list for this venue
- Quick actions (edit venue, scan tickets, view team)
- Map showing venue location
- Amenities and features list
- Contact information
- Edit button in header

## 12. Edit Venue Screen (apps/mobile/src/screens/venue/EditVenueScreen.tsx)

Similar to CreateVenueScreen but pre-populated:
- Load existing venue data
- Same multi-step form structure
- Update photos (add/remove)
- Update location on map
- Save changes with venuesService.updateVenue()

## 13. Install Required Dependencies

Add to apps/mobile/package.json:
```json
{
  "react-native-vision-camera": "^4.0.0",
  "vision-camera-code-scanner": "^0.2.0",
  "react-native-maps": "^1.10.0",
  "react-native-geolocation-service": "^5.3.0",
  "react-native-image-picker": "^7.1.0",
  "react-native-crypto": "^2.2.0",
  "@react-native-community/netinfo": "^11.0.0"
}
```

## 14. Configure Native Permissions

**iOS (apps/mobile/ios/Tazkartak/Info.plist)**
Add camera and location permissions:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required to scan QR codes for ticket validation</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is needed to set venue location on map</string>
```

**Android (apps/mobile/android/app/src/main/AndroidManifest.xml)**
Add permissions:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 15. Create QR Types (apps/mobile/src/types/qr.types.ts)

Define TypeScript interfaces:
```typescript
interface QRPayload {
  ticketId: string;
  eventId: string;
  timestamp: number;
  signature: string;
}

interface QRScanResult {
  id: string;
  ticketId: string;
  eventId: string;
  venueId: string;
  scannedBy: string;
  scannedAt: string;
  status: 'success' | 'failed' | 'duplicate';
  ticketHolder: string;
  offline: boolean;
}

interface QRValidationResult {
  isValid: boolean;
  ticket?: Ticket;
  error?: string;
  alreadyScanned?: boolean;
}
```

## Implementation Order

1. Update VenueNavigator with all routes
2. Create VenueListScreen with basic layout
3. Implement CreateVenueScreen with map integration
4. Build QRScannerScreen with vision-camera
5. Create QREncryptionService for security
6. Implement offline QR validation
7. Build ScanHistoryScreen and EventCheckInScreen
8. Create team management screens
9. Add VenueDetailsScreen and EditVenueScreen
10. Test camera permissions and QR scanning flow
11. Test offline validation with cached data
12. Integrate with existing backend services

## Testing Checklist

- [ ] Camera permissions work on iOS and Android
- [ ] QR scanning detects codes in real-time
- [ ] Encrypted QR validation works correctly
- [ ] Offline scanning with cached tickets
- [ ] Map location picker saves coordinates
- [ ] Team member invitations send correctly
- [ ] Scan history displays and filters properly
- [ ] Check-in stats update in real-time

### To-dos

- [ ] Initialize React Native project with TypeScript, configure Metro bundler, setup monorepo integration
- [ ] Create API service layer, offline storage, Redux store with persist, navigation structure
- [ ] Implement authentication screens, auth service with biometrics, protected navigation
- [ ] Build event discovery, ticket purchase flow, my tickets screens with QR display
- [ ] Create organizer dashboard, event management, ticket management, analytics screens
- [ ] Build venue management, QR scanner for check-in, team management screens
- [ ] Implement admin dashboard, user management, verification workflows, system settings
- [ ] Integrate PayMob and Fawry native SDKs, implement WebView fallback, handle payment callbacks
- [ ] Implement offline data caching, sync queue, background sync, conflict resolution
- [ ] Setup Firebase Cloud Messaging, implement notification handling, deep linking
- [ ] Build QR generation with encryption, camera-based scanner, offline QR validation
- [ ] Create design system, implement theming, add loading states, optimize performance
- [ ] Write unit tests, integration tests, E2E tests with Detox for critical flows
- [ ] Configure Android/iOS builds, setup code signing, prepare App Store assets, implement CI/CD
- [ ] Write setup guides, API documentation, user guides, deployment instructions