import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';

type SystemSettingsScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'SystemSettings'>;

interface SettingItemProps {
  title: string;
  description: string;
  icon: string;
  type: 'switch' | 'input' | 'button';
  value?: boolean | string;
  onValueChange?: (value: boolean | string) => void;
  onPress?: () => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  disabled?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  icon,
  type,
  value,
  onValueChange,
  onPress,
  placeholder,
  keyboardType = 'default',
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.settingItem, disabled && styles.settingItemDisabled]}
    onPress={type === 'button' ? onPress : undefined}
    disabled={disabled}
    activeOpacity={type === 'button' ? 0.7 : 1}
  >
    <View style={styles.settingIcon}>
      <Icon name={icon} size={24} color={disabled ? theme.colors.outline : theme.colors.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
        {title}
      </Text>
      <Text style={[styles.settingDescription, disabled && styles.settingDescriptionDisabled]}>
        {description}
      </Text>
      {type === 'input' && (
        <TextInput
          style={[styles.settingInput, disabled && styles.settingInputDisabled]}
          value={value as string}
          onChangeText={(text) => onValueChange?.(text)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType={keyboardType}
          editable={!disabled}
        />
      )}
    </View>
    <View style={styles.settingAction}>
      {type === 'switch' && (
        <Switch
          value={value as boolean}
          onValueChange={onValueChange as (value: boolean) => void}
          disabled={disabled}
          trackColor={{
            false: theme.colors.surfaceVariant,
            true: theme.colors.primary,
          }}
          thumbColor={value ? '#fff' : theme.colors.outline}
        />
      )}
      {type === 'button' && (
        <Icon name="chevron-right" size={24} color={disabled ? theme.colors.outline : theme.colors.onSurfaceVariant} />
      )}
    </View>
  </TouchableOpacity>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

export const SystemSettingsScreen: React.FC = () => {
  const navigation = useNavigation<SystemSettingsScreenNavigationProp>();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'Tazkartak',
    platformDescription: 'Event ticket selling platform',
    supportEmail: 'support@tazkartak.com',
    platformFee: '5.0',
    
    // Feature Flags
    userRegistrationEnabled: true,
    eventCreationEnabled: true,
    venueRegistrationEnabled: true,
    paymentProcessingEnabled: true,
    notificationsEnabled: true,
    analyticsEnabled: true,
    
    // Security Settings
    twoFactorAuthRequired: false,
    passwordMinLength: '8',
    sessionTimeout: '24',
    maxLoginAttempts: '5',
    
    // Payment Settings
    defaultPaymentMethod: 'both',
    paymobEnabled: true,
    fawryEnabled: true,
    paymentTimeout: '30',
    
    // Notification Settings
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    pushNotificationsEnabled: true,
    notificationRetentionDays: '30',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // dispatch(fetchSystemSettings());
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // dispatch(updateSystemSettings(settings));
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleMaintenanceMode = () => {
    Alert.alert(
      'Maintenance Mode',
      'Enable maintenance mode? This will temporarily disable the platform for users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          style: 'destructive',
          onPress: async () => {
            try {
              // dispatch(enableMaintenanceMode());
              Alert.alert('Success', 'Maintenance mode enabled');
            } catch (error) {
              console.error('Failed to enable maintenance mode:', error);
              Alert.alert('Error', 'Failed to enable maintenance mode');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Clear all platform cache? This may temporarily slow down the platform.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              // dispatch(clearPlatformCache());
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleBackupData = () => {
    Alert.alert(
      'Backup Data',
      'Create a full platform backup?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Backup',
          onPress: async () => {
            try {
              // dispatch(createPlatformBackup());
              Alert.alert('Success', 'Backup created successfully');
            } catch (error) {
              console.error('Failed to create backup:', error);
              Alert.alert('Error', 'Failed to create backup');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Platform Settings */}
      <Section title="Platform Settings">
        <SettingItem
          title="Platform Name"
          description="The name displayed to users"
          icon="business"
          type="input"
          value={settings.platformName}
          onValueChange={(value) => handleSettingChange('platformName', value)}
          placeholder="Enter platform name"
        />
        <SettingItem
          title="Platform Description"
          description="Brief description of the platform"
          icon="description"
          type="input"
          value={settings.platformDescription}
          onValueChange={(value) => handleSettingChange('platformDescription', value)}
          placeholder="Enter platform description"
        />
        <SettingItem
          title="Support Email"
          description="Contact email for user support"
          icon="email"
          type="input"
          value={settings.supportEmail}
          onValueChange={(value) => handleSettingChange('supportEmail', value)}
          placeholder="support@example.com"
          keyboardType="email-address"
        />
        <SettingItem
          title="Platform Fee (%)"
          description="Default fee charged on transactions"
          icon="percent"
          type="input"
          value={settings.platformFee}
          onValueChange={(value) => handleSettingChange('platformFee', value)}
          placeholder="5.0"
          keyboardType="numeric"
        />
      </Section>

      {/* Feature Flags */}
      <Section title="Feature Management">
        <SettingItem
          title="User Registration"
          description="Allow new users to register"
          icon="person-add"
          type="switch"
          value={settings.userRegistrationEnabled}
          onValueChange={(value) => handleSettingChange('userRegistrationEnabled', value)}
        />
        <SettingItem
          title="Event Creation"
          description="Allow organizers to create events"
          icon="event"
          type="switch"
          value={settings.eventCreationEnabled}
          onValueChange={(value) => handleSettingChange('eventCreationEnabled', value)}
        />
        <SettingItem
          title="Venue Registration"
          description="Allow venues to register"
          icon="business"
          type="switch"
          value={settings.venueRegistrationEnabled}
          onValueChange={(value) => handleSettingChange('venueRegistrationEnabled', value)}
        />
        <SettingItem
          title="Payment Processing"
          description="Enable payment processing"
          icon="payment"
          type="switch"
          value={settings.paymentProcessingEnabled}
          onValueChange={(value) => handleSettingChange('paymentProcessingEnabled', value)}
        />
        <SettingItem
          title="Notifications"
          description="Enable system notifications"
          icon="notifications"
          type="switch"
          value={settings.notificationsEnabled}
          onValueChange={(value) => handleSettingChange('notificationsEnabled', value)}
        />
        <SettingItem
          title="Analytics"
          description="Enable analytics tracking"
          icon="analytics"
          type="switch"
          value={settings.analyticsEnabled}
          onValueChange={(value) => handleSettingChange('analyticsEnabled', value)}
        />
      </Section>

      {/* Security Settings */}
      <Section title="Security Settings">
        <SettingItem
          title="Two-Factor Authentication"
          description="Require 2FA for admin accounts"
          icon="security"
          type="switch"
          value={settings.twoFactorAuthRequired}
          onValueChange={(value) => handleSettingChange('twoFactorAuthRequired', value)}
        />
        <SettingItem
          title="Password Minimum Length"
          description="Minimum password length requirement"
          icon="lock"
          type="input"
          value={settings.passwordMinLength}
          onValueChange={(value) => handleSettingChange('passwordMinLength', value)}
          placeholder="8"
          keyboardType="numeric"
        />
        <SettingItem
          title="Session Timeout (hours)"
          description="Automatic logout after inactivity"
          icon="timer"
          type="input"
          value={settings.sessionTimeout}
          onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
          placeholder="24"
          keyboardType="numeric"
        />
        <SettingItem
          title="Max Login Attempts"
          description="Maximum failed login attempts before lockout"
          icon="block"
          type="input"
          value={settings.maxLoginAttempts}
          onValueChange={(value) => handleSettingChange('maxLoginAttempts', value)}
          placeholder="5"
          keyboardType="numeric"
        />
      </Section>

      {/* Payment Settings */}
      <Section title="Payment Settings">
        <SettingItem
          title="PayMob Integration"
          description="Enable PayMob payment gateway"
          icon="credit-card"
          type="switch"
          value={settings.paymobEnabled}
          onValueChange={(value) => handleSettingChange('paymobEnabled', value)}
        />
        <SettingItem
          title="Fawry Integration"
          description="Enable Fawry payment gateway"
          icon="store"
          type="switch"
          value={settings.fawryEnabled}
          onValueChange={(value) => handleSettingChange('fawryEnabled', value)}
        />
        <SettingItem
          title="Payment Timeout (minutes)"
          description="Payment session timeout"
          icon="timer"
          type="input"
          value={settings.paymentTimeout}
          onValueChange={(value) => handleSettingChange('paymentTimeout', value)}
          placeholder="30"
          keyboardType="numeric"
        />
      </Section>

      {/* Notification Settings */}
      <Section title="Notification Settings">
        <SettingItem
          title="Email Notifications"
          description="Send notifications via email"
          icon="email"
          type="switch"
          value={settings.emailNotificationsEnabled}
          onValueChange={(value) => handleSettingChange('emailNotificationsEnabled', value)}
        />
        <SettingItem
          title="SMS Notifications"
          description="Send notifications via SMS"
          icon="sms"
          type="switch"
          value={settings.smsNotificationsEnabled}
          onValueChange={(value) => handleSettingChange('smsNotificationsEnabled', value)}
        />
        <SettingItem
          title="Push Notifications"
          description="Send push notifications to mobile apps"
          icon="notifications"
          type="switch"
          value={settings.pushNotificationsEnabled}
          onValueChange={(value) => handleSettingChange('pushNotificationsEnabled', value)}
        />
        <SettingItem
          title="Notification Retention (days)"
          description="How long to keep notification history"
          icon="history"
          type="input"
          value={settings.notificationRetentionDays}
          onValueChange={(value) => handleSettingChange('notificationRetentionDays', value)}
          placeholder="30"
          keyboardType="numeric"
        />
      </Section>

      {/* System Management */}
      <Section title="System Management">
        <SettingItem
          title="Maintenance Mode"
          description="Temporarily disable platform for maintenance"
          icon="build"
          type="button"
          onPress={handleMaintenanceMode}
        />
        <SettingItem
          title="Clear Cache"
          description="Clear all platform cache"
          icon="clear-all"
          type="button"
          onPress={handleClearCache}
        />
        <SettingItem
          title="Backup Data"
          description="Create a full platform backup"
          icon="backup"
          type="button"
          onPress={handleBackupData}
        />
        <SettingItem
          title="Payment Settings"
          description="Configure payment gateway settings"
          icon="payment"
          type="button"
          onPress={() => navigation.navigate('PaymentSettings')}
        />
      </Section>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Icon name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save All Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  settingTitleDisabled: {
    color: theme.colors.outline,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  settingDescriptionDisabled: {
    color: theme.colors.outline,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.background,
  },
  settingInputDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.outline,
  },
  settingAction: {
    marginLeft: 16,
  },
  saveContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});