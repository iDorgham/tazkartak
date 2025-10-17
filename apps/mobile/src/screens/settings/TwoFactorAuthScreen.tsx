import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { twoFactorAuthService } from '@/services/two-factor-auth.service';
import { secureStorageService } from '@/services/secure-storage.service';
import { useAnalytics } from '@/hooks/useAnalytics';
import { theme } from '@/config/theme';

interface SetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export const TwoFactorAuthScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup' | 'complete'>('status');
  
  const { colors } = useTheme();
  const { trackButtonClick, trackEvent } = useAnalytics({
    screenName: 'TwoFactorAuth',
    trackScreenViews: true,
    trackUserActions: true,
  });

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      setIsLoading(true);
      const status = await twoFactorAuthService.get2FAStatus();
      setIsEnabled(status.isEnabled);
      setIsSetup(true);
      
      if (status.isEnabled) {
        setStep('complete');
      } else {
        setStep('status');
      }
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
      Alert.alert('Error', 'Failed to check 2FA status');
    } finally {
      setIsLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setIsLoading(true);
      setStep('setup');
      
      // Get user email (you would get this from your auth service)
      const userEmail = 'user@example.com'; // Replace with actual user email
      
      const setup = await twoFactorAuthService.generateTOTPSetup('user_id', userEmail);
      setSetupData(setup);
      
      trackEvent('2fa_setup_started', {
        userEmail,
      });
    } catch (error) {
      console.error('Failed to start 2FA setup:', error);
      Alert.alert('Error', 'Failed to start 2FA setup');
      setStep('status');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit verification code');
      return;
    }

    try {
      setIsLoading(true);
      const result = await twoFactorAuthService.verifyAndEnable2FA('user_id', verificationCode);
      
      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setShowBackupCodes(true);
        setStep('backup');
        setIsEnabled(true);
        
        trackEvent('2fa_enabled', {
          method: 'totp',
        });
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      Alert.alert('Error', 'Failed to verify 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = () => {
    Alert.alert(
      'Disable Two-Factor Authentication',
      'Are you sure you want to disable 2FA? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // You would need to get a confirmation code from the user
              const result = await twoFactorAuthService.disable2FA('user_id', '123456'); // Replace with actual code
              
              if (result.success) {
                setIsEnabled(false);
                setStep('status');
                Alert.alert('Success', '2FA has been disabled');
                
                trackEvent('2fa_disabled', {
                  method: 'manual',
                });
              } else {
                Alert.alert('Error', result.message || 'Failed to disable 2FA');
              }
            } catch (error) {
              console.error('Failed to disable 2FA:', error);
              Alert.alert('Error', 'Failed to disable 2FA');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const copyBackupCodes = () => {
    if (backupCodes.length > 0) {
      const codesText = backupCodes.join('\n');
      // In a real app, you would copy to clipboard
      Alert.alert('Backup Codes', codesText);
    }
  };

  const completeSetup = () => {
    setStep('complete');
    setShowBackupCodes(false);
    trackButtonClick('2fa_setup_completed');
  };

  const renderStatusScreen = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Two-Factor Authentication</Text>
        <Text style={styles.description}>
          Add an extra layer of security to your account by enabling two-factor authentication.
        </Text>
        
        {isEnabled ? (
          <View style={styles.enabledStatus}>
            <Text style={styles.statusText}>✅ 2FA is enabled</Text>
            <Text style={styles.statusSubtext}>
              Your account is protected with two-factor authentication.
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                trackButtonClick('disable_2fa');
                disable2FA();
              }}
              style={styles.button}
            >
              Disable 2FA
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={() => {
              trackButtonClick('enable_2fa');
              startSetup();
            }}
            style={styles.button}
          >
            Enable 2FA
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const renderSetupScreen = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Setup Two-Factor Authentication</Text>
          <Text style={styles.description}>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </Text>
          
          {setupData && (
            <View style={styles.qrContainer}>
              <QRCode
                value={setupData.qrCodeUrl}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          <Text style={styles.description}>
            If you can't scan the QR code, enter this key manually:
          </Text>
          
          <View style={styles.manualKeyContainer}>
            <Text style={styles.manualKey}>
              {setupData?.manualEntryKey || ''}
            </Text>
          </View>
          
          <Text style={styles.instructions}>
            1. Open your authenticator app{'\n'}
            2. Add a new account{'\n'}
            3. Scan the QR code or enter the key manually{'\n'}
            4. Enter the 6-digit code in the next step
          </Text>
          
          <Button
            mode="contained"
            onPress={() => {
              trackButtonClick('next_to_verification');
              setStep('verify');
            }}
            style={styles.button}
          >
            Next: Verify Code
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderVerifyScreen = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Verify Setup</Text>
        <Text style={styles.description}>
          Enter the 6-digit code from your authenticator app to complete the setup.
        </Text>
        
        <TextInput
          label="Verification Code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="numeric"
          maxLength={6}
          style={styles.input}
          autoFocus
        />
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              trackButtonClick('back_to_setup');
              setStep('setup');
            }}
            style={styles.button}
          >
            Back
          </Button>
          
          <Button
            mode="contained"
            onPress={() => {
              trackButtonClick('verify_code');
              verifyAndEnable();
            }}
            style={styles.button}
            disabled={!verificationCode || verificationCode.length !== 6}
          >
            Verify & Enable
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderBackupScreen = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Save Your Backup Codes</Text>
          <Text style={styles.warningText}>
            ⚠️ Important: Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </Text>
          
          <View style={styles.backupCodesContainer}>
            {backupCodes.map((code, index) => (
              <Text key={index} style={styles.backupCode}>
                {code}
              </Text>
            ))}
          </View>
          
          <Text style={styles.backupInstructions}>
            Each code can only be used once. Generate new codes if you run out.
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => {
                trackButtonClick('copy_backup_codes');
                copyBackupCodes();
              }}
              style={styles.button}
            >
              Copy Codes
            </Button>
            
            <Button
              mode="contained"
              onPress={() => {
                trackButtonClick('complete_2fa_setup');
                completeSetup();
              }}
              style={styles.button}
            >
              Complete Setup
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderCompleteScreen = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>✅ 2FA Enabled Successfully</Text>
        <Text style={styles.description}>
          Two-factor authentication is now enabled for your account. You'll need to enter a verification code each time you sign in.
        </Text>
        
        <View style={styles.featuresList}>
          <Text style={styles.featureItem}>• Enhanced account security</Text>
          <Text style={styles.featureItem}>• Protection against unauthorized access</Text>
          <Text style={styles.featureItem}>• Backup codes saved securely</Text>
        </View>
        
        <Button
          mode="contained"
          onPress={() => {
            trackButtonClick('2fa_setup_done');
            // Navigate back or to settings
          }}
          style={styles.button}
        >
          Done
        </Button>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {step === 'status' && renderStatusScreen()}
        {step === 'setup' && renderSetupScreen()}
        {step === 'verify' && renderVerifyScreen()}
        {step === 'backup' && renderBackupScreen()}
        {step === 'complete' && renderCompleteScreen()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.onSurface,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: theme.colors.onSurface,
  },
  enabledStatus: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  manualKeyContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  manualKey: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.error,
    backgroundColor: theme.colors.errorContainer,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  backupCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backupCode: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceVariant,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    width: '48%',
    textAlign: 'center',
  },
  backupInstructions: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresList: {
    marginVertical: 16,
  },
  featureItem: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onBackground,
  },
});

export default TwoFactorAuthScreen;
