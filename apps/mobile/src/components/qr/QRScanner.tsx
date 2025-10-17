import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Vibration } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { scanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

interface QRScannerProps {
  onScan: (qrData: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  title = 'Scan QR Code',
  subtitle = 'Position the QR code within the frame',
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
    })();
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const barcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE], {
      checkInverted: true,
    });

    if (barcodes.length > 0 && isActive) {
      const qrData = barcodes[0].rawValue;
      if (qrData) {
        runOnJS(handleScan)(qrData);
      }
    }
  }, [isActive]);

  const handleScan = (qrData: string) => {
    if (!isActive) return;
    
    setIsActive(false);
    Vibration.vibrate(100);
    
    // Validate QR code format
    if (isValidQRCode(qrData)) {
      onScan(qrData);
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid ticket',
        [
          {
            text: 'Try Again',
            onPress: () => setIsActive(true),
          },
        ]
      );
    }
  };

  const isValidQRCode = (qrData: string): boolean => {
    // Basic validation - in a real app, you'd validate against your backend
    return qrData && qrData.length > 10 && qrData.includes('ticket');
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const resetScanner = () => {
    setIsActive(true);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <Button onPress={onClose}>Close</Button>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available</Text>
        <Button onPress={onClose}>Close</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        torch={flashOn ? 'on' : 'off'}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.scannerFrame}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.controls}>
          <Button
            mode="contained"
            onPress={toggleFlash}
            icon={flashOn ? 'flash-off' : 'flash'}
            style={styles.controlButton}
          >
            {flashOn ? 'Flash Off' : 'Flash On'}
          </Button>

          {!isActive && (
            <Button
              mode="contained"
              onPress={resetScanner}
              icon="refresh"
              style={styles.controlButton}
            >
              Scan Again
            </Button>
          )}

          {onClose && (
            <Button
              mode="outlined"
              onPress={onClose}
              icon="close"
              style={styles.controlButton}
            >
              Close
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: theme.spacing.lg,
    paddingTop: 60, // Account for status bar
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onPrimary,
    textAlign: 'center',
    opacity: 0.8,
  },
  scannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.primary,
    borderWidth: 4,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: '40%',
    right: '20%',
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: '40%',
    left: '20%',
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: '40%',
    right: '20%',
    borderTopWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 0,
  },
  controls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    marginHorizontal: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});
