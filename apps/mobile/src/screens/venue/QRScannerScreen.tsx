import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useCameraDevices, useFrameProcessor, Camera } from 'react-native-vision-camera';
import { scanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { runOnJS } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { QRValidationResult } from '@/types/qr.types';
import { QREncryptionService } from '@/services/qr-encryption.service';
import { OfflineQRService } from '@/services/offline-qr.service';

type QRScannerScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'QRScanner'>;
type QRScannerScreenRouteProp = RouteProp<VenueStackParamList, 'QRScanner'>;

const { width, height } = Dimensions.get('window');

interface ScanResultModalProps {
  visible: boolean;
  result: QRValidationResult;
  onClose: () => void;
  onScanAgain: () => void;
}

const ScanResultModal: React.FC<ScanResultModalProps> = ({
  visible,
  result,
  onClose,
  onScanAgain,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.resultHeader,
            { backgroundColor: result.isValid ? '#4CAF50' : '#FF5722' },
          ]}
        >
          <Icon
            name={result.isValid ? 'check-circle' : 'error'}
            size={48}
            color="#fff"
          />
          <Text style={styles.resultTitle}>
            {result.isValid ? 'Valid Ticket' : 'Invalid Ticket'}
          </Text>
        </View>

        <View style={styles.resultContent}>
          {result.isValid && result.ticket ? (
            <>
              <Text style={styles.ticketHolder}>
                {result.ticket.holderName}
              </Text>
              <Text style={styles.ticketInfo}>
                Event: {result.ticket.eventName}
              </Text>
              <Text style={styles.ticketInfo}>
                Ticket Type: {result.ticket.type}
              </Text>
              <Text style={styles.ticketInfo}>
                Status: {result.ticket.status}
              </Text>
              {result.alreadyScanned && (
                <View style={styles.warningContainer}>
                  <Icon name="warning" size={20} color="#FF9800" />
                  <Text style={styles.warningText}>
                    This ticket has already been scanned
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.errorText}>{result.error}</Text>
          )}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.scanAgainButton} onPress={onScanAgain}>
            <Icon name="qr-code-scanner" size={20} color="#fff" />
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation<QRScannerScreenNavigationProp>();
  const route = useRoute<QRScannerScreenRouteProp>();
  const { eventId, venueId } = route.params;

  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef<Camera>(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [scanResult, setScanResult] = useState<QRValidationResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  const scanAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestCameraPermission();
  }, []);

  useEffect(() => {
    if (isScanning) {
      startScanAnimation();
    }
  }, [isScanning]);

  const requestCameraPermission = async () => {
    try {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'authorized');
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Permission Error', 'Camera permission is required to scan QR codes');
    }
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const validateQRCode = async (qrData: string): Promise<QRValidationResult> => {
    try {
      // Parse and decrypt QR payload
      const payload = await QREncryptionService.decryptAndValidate(qrData);
      
      if (!payload) {
        return { isValid: false, error: 'Invalid QR code format' };
      }

      // Check if ticket already scanned (offline check first)
      const alreadyScanned = await OfflineQRService.isTicketScanned(payload.ticketId);
      if (alreadyScanned) {
        return {
          isValid: true,
          ticket: payload.ticket,
          alreadyScanned: true,
        };
      }

      // Validate ticket status and event
      if (payload.ticket.status !== 'active') {
        return { isValid: false, error: 'Ticket is not active' };
      }

      if (eventId && payload.ticket.eventId !== eventId) {
        return { isValid: false, error: 'Ticket is not for this event' };
      }

      // Mark as scanned in offline cache
      await OfflineQRService.queueScanResult({
        ticketId: payload.ticketId,
        eventId: payload.ticket.eventId,
        venueId: venueId || '',
        scannedBy: 'current_user', // Get from auth state
        scannedAt: new Date().toISOString(),
        status: 'success',
        ticketHolder: payload.ticket.holderName,
        offline: false,
      });

      return { isValid: true, ticket: payload.ticket };
    } catch (error) {
      console.error('QR validation error:', error);
      return { isValid: false, error: 'Failed to validate ticket' };
    }
  };

  const handleBarcodeScanned = async (barcodes: any[]) => {
    if (!isScanning || barcodes.length === 0) return;

    const barcode = barcodes[0];
    if (barcode.format !== BarcodeFormat.QR_CODE) return;

    setIsScanning(false);
    setScanCount(prev => prev + 1);

    // Haptic feedback
    Vibration.vibrate(100);

    try {
      const result = await validateQRCode(barcode.rawValue || '');
      setScanResult(result);
      setShowResult(true);

      if (result.isValid) {
        Vibration.vibrate([0, 100, 100, 100]); // Success pattern
      } else {
        Vibration.vibrate([0, 200]); // Error pattern
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      setScanResult({
        isValid: false,
        error: 'Failed to process QR code',
      });
      setShowResult(true);
    }
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const barcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE], {
      checkInverted: true,
    });
    
    if (barcodes.length > 0) {
      runOnJS(handleBarcodeScanned)(barcodes);
    }
  }, []);

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const handleScanAgain = () => {
    setShowResult(false);
    setScanResult(null);
    setIsScanning(true);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Manual Entry',
      'Enter ticket ID or QR code data:',
      async (text) => {
        if (text) {
          const result = await validateQRCode(text);
          setScanResult(result);
          setShowResult(true);
        }
      }
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-alt" size={64} color={theme.colors.outline} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          Please allow camera access to scan QR codes
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="error" size={64} color={theme.colors.error} />
        <Text style={styles.permissionTitle}>Camera Not Available</Text>
        <Text style={styles.permissionText}>
          No camera device found on this device
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isScanning}
        frameProcessor={frameProcessor}
        torch={torchOn ? 'on' : 'off'}
      />

      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.scanInfo}>
            <Text style={styles.scanCount}>Scans: {scanCount}</Text>
            <Text style={styles.scanStatus}>
              {isScanning ? 'Scanning...' : 'Processing...'}
            </Text>
          </View>
          <TouchableOpacity style={styles.torchButton} onPress={toggleTorch}>
            <Icon name={torchOn ? 'flash-on' : 'flash-off'} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          
          {/* Animated scanning line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 200],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <Text style={styles.scanInstructions}>
            Position the QR code within the frame
          </Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
              <Icon name="keyboard" size={20} color="#fff" />
              <Text style={styles.manualText}>Manual Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyButton} onPress={() => {
              navigation.navigate('ScanHistory', { venueId, eventId });
            }}>
              <Icon name="history" size={20} color="#fff" />
              <Text style={styles.historyText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Result Modal */}
      <ScanResultModal
        visible={showResult}
        result={scanResult!}
        onClose={handleClose}
        onScanAgain={handleScanAgain}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInfo: {
    alignItems: 'center',
  },
  scanCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scanStatus: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  torchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    width: 250,
    height: 2,
    backgroundColor: theme.colors.primary,
    top: 0,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  scanInstructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  manualText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  historyText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  resultHeader: {
    padding: 24,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  resultContent: {
    padding: 24,
    alignItems: 'center',
  },
  ticketHolder: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  ticketInfo: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.colors.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});