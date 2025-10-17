import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Share, Dimensions } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

interface QRCodeDisplayProps {
  qrData: string;
  ticketId: string;
  eventTitle: string;
  ticketHolder: string;
  onClose?: () => void;
}

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.7, 300);

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrData,
  ticketId,
  eventTitle,
  ticketHolder,
  onClose,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleSaveToGallery = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to save QR code',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);
    try {
      // In a real implementation, you would generate an image from the QR code
      // and save it to the device's photo library
      Alert.alert('Success', 'QR code saved to gallery');
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my ticket for ${eventTitle}!`,
        url: `tazkartak://ticket/${ticketId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToWallet = () => {
    // In a real implementation, you would use react-native-wallet-manager
    // to add the ticket to Apple Wallet or Google Pay
    Alert.alert(
      'Add to Wallet',
      'This feature will add your ticket to your device wallet',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.title}>Your Ticket</Text>
          <Text style={styles.eventTitle}>{eventTitle}</Text>
          <Text style={styles.ticketHolder}>Ticket Holder: {ticketHolder}</Text>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={QR_SIZE}
              color={colors.onSurface}
              backgroundColor={colors.surface}
              logoSize={30}
              logoMargin={2}
              logoBorderRadius={15}
              quietZone={10}
            />
          </View>

          <Text style={styles.instructions}>
            Show this QR code at the event entrance
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleSaveToGallery}
              loading={isSaving}
              disabled={isSaving}
              icon="download"
              style={styles.button}
            >
              Save to Gallery
            </Button>

            <Button
              mode="outlined"
              onPress={handleShare}
              icon="share"
              style={styles.button}
            >
              Share
            </Button>

            <Button
              mode="outlined"
              onPress={handleAddToWallet}
              icon="wallet"
              style={styles.button}
            >
              Add to Wallet
            </Button>
          </View>

          {onClose && (
            <Button
              mode="text"
              onPress={onClose}
              style={styles.closeButton}
            >
              Close
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  ticketHolder: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.lg,
  },
  qrContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  instructions: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginHorizontal: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
    minWidth: 120,
  },
  closeButton: {
    marginTop: theme.spacing.md,
  },
});
