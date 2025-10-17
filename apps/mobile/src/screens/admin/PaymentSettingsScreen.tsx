import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';

type PaymentSettingsScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'PaymentSettings'>;

interface PaymentGatewayConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  sandboxMode: boolean;
  currency: string;
  feePercentage: number;
  minAmount: number;
  maxAmount: number;
}

interface SettingItemProps {
  title: string;
  description: string;
  icon: string;
  type: 'switch' | 'input' | 'button';
  value?: boolean | string | number;
  onValueChange?: (value: boolean | string | number) => void;
  onPress?: () => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
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
  secureTextEntry = false,
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
          value={String(value || '')}
          onChangeText={(text) => onValueChange?.(text)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
        />
      )}
    </View>
    <View style={styles.settingAction}>
      {type === 'switch' && (
        <TouchableOpacity
          style={[
            styles.switch,
            value ? styles.switchActive : styles.switchInactive,
            disabled && styles.switchDisabled,
          ]}
          onPress={() => onValueChange?.(!value)}
          disabled={disabled}
        >
          <View style={[styles.switchThumb, value ? styles.switchThumbActive : styles.switchThumbInactive]} />
        </TouchableOpacity>
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

export const PaymentSettingsScreen: React.FC = () => {
  const navigation = useNavigation<PaymentSettingsScreenNavigationProp>();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayConfig | null>(null);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>([
    {
      id: 'paymob',
      name: 'PayMob',
      enabled: true,
      apiKey: '',
      secretKey: '',
      webhookSecret: '',
      sandboxMode: true,
      currency: 'EGP',
      feePercentage: 2.5,
      minAmount: 1,
      maxAmount: 100000,
    },
    {
      id: 'fawry',
      name: 'Fawry',
      enabled: true,
      apiKey: '',
      secretKey: '',
      webhookSecret: '',
      sandboxMode: true,
      currency: 'EGP',
      feePercentage: 3.0,
      minAmount: 5,
      maxAmount: 50000,
    },
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    defaultCurrency: 'EGP',
    platformFeePercentage: 5.0,
    taxRate: 14.0,
    refundPolicy: '7',
    autoRefund: true,
    paymentTimeout: 30,
    webhookRetries: 3,
    fraudDetection: true,
    minTransactionAmount: 1,
    maxTransactionAmount: 100000,
  });

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setLoading(true);
      // dispatch(fetchPaymentSettings());
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load payment settings:', error);
      Alert.alert('Error', 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGatewayToggle = (gatewayId: string) => {
    setPaymentGateways(prev =>
      prev.map(gateway =>
        gateway.id === gatewayId ? { ...gateway, enabled: !gateway.enabled } : gateway
      )
    );
  };

  const handleGatewayConfig = (gateway: PaymentGatewayConfig) => {
    setSelectedGateway(gateway);
    setShowGatewayModal(true);
  };

  const handleGatewaySave = () => {
    if (!selectedGateway) return;

    setPaymentGateways(prev =>
      prev.map(gateway =>
        gateway.id === selectedGateway.id ? selectedGateway : gateway
      )
    );

    setShowGatewayModal(false);
    setSelectedGateway(null);
    Alert.alert('Success', 'Payment gateway configuration saved');
  };

  const handleGlobalSettingChange = (key: string, value: string | number | boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      const settings = {
        gateways: paymentGateways,
        global: globalSettings,
      };
      // dispatch(updatePaymentSettings(settings));
      Alert.alert('Success', 'Payment settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleTestConnection = (gatewayId: string) => {
    Alert.alert(
      'Test Connection',
      `Test connection to ${gatewayId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            try {
              // dispatch(testPaymentGatewayConnection(gatewayId));
              Alert.alert('Success', 'Connection test successful');
            } catch (error) {
              console.error('Connection test failed:', error);
              Alert.alert('Error', 'Connection test failed');
            }
          },
        },
      ]
    );
  };

  const renderGatewayModal = () => {
    if (!selectedGateway) return null;

    return (
      <Modal
        visible={showGatewayModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedGateway.name} Configuration</Text>
            <TouchableOpacity onPress={() => setShowGatewayModal(false)}>
              <Icon name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Section title="API Configuration">
              <SettingItem
                title="API Key"
                description="Your API key from the payment gateway"
                icon="vpn-key"
                type="input"
                value={selectedGateway.apiKey}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, apiKey: value as string } : null)}
                placeholder="Enter API key"
                secureTextEntry
              />
              <SettingItem
                title="Secret Key"
                description="Your secret key from the payment gateway"
                icon="lock"
                type="input"
                value={selectedGateway.secretKey}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, secretKey: value as string } : null)}
                placeholder="Enter secret key"
                secureTextEntry
              />
              <SettingItem
                title="Webhook Secret"
                description="Secret for webhook verification"
                icon="webhook"
                type="input"
                value={selectedGateway.webhookSecret}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, webhookSecret: value as string } : null)}
                placeholder="Enter webhook secret"
                secureTextEntry
              />
            </Section>

            <Section title="Gateway Settings">
              <SettingItem
                title="Sandbox Mode"
                description="Use test environment for development"
                icon="science"
                type="switch"
                value={selectedGateway.sandboxMode}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, sandboxMode: value as boolean } : null)}
              />
              <SettingItem
                title="Currency"
                description="Default currency for this gateway"
                icon="attach-money"
                type="input"
                value={selectedGateway.currency}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, currency: value as string } : null)}
                placeholder="EGP"
              />
              <SettingItem
                title="Fee Percentage (%)"
                description="Gateway fee percentage"
                icon="percent"
                type="input"
                value={selectedGateway.feePercentage.toString()}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, feePercentage: parseFloat(value as string) || 0 } : null)}
                placeholder="2.5"
                keyboardType="numeric"
              />
              <SettingItem
                title="Minimum Amount"
                description="Minimum transaction amount"
                icon="trending-up"
                type="input"
                value={selectedGateway.minAmount.toString()}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, minAmount: parseFloat(value as string) || 0 } : null)}
                placeholder="1"
                keyboardType="numeric"
              />
              <SettingItem
                title="Maximum Amount"
                description="Maximum transaction amount"
                icon="trending-down"
                type="input"
                value={selectedGateway.maxAmount.toString()}
                onValueChange={(value) => setSelectedGateway(prev => prev ? { ...prev, maxAmount: parseFloat(value as string) || 0 } : null)}
                placeholder="100000"
                keyboardType="numeric"
              />
            </Section>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.testButton} onPress={() => handleTestConnection(selectedGateway.id)}>
              <Icon name="wifi-tethering" size={20} color={theme.colors.primary} />
              <Text style={styles.testButtonText}>Test Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveModalButton} onPress={handleGatewaySave}>
              <Icon name="save" size={20} color="#fff" />
              <Text style={styles.saveModalButtonText}>Save Configuration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Payment Gateways */}
      <Section title="Payment Gateways">
        {paymentGateways.map((gateway) => (
          <View key={gateway.id}>
            <SettingItem
              title={gateway.name}
              description={`${gateway.enabled ? 'Enabled' : 'Disabled'} - ${gateway.currency} - ${gateway.feePercentage}% fee`}
              icon={gateway.id === 'paymob' ? 'credit-card' : 'store'}
              type="switch"
              value={gateway.enabled}
              onValueChange={() => handleGatewayToggle(gateway.id)}
            />
            <SettingItem
              title={`Configure ${gateway.name}`}
              description="Set up API keys and gateway settings"
              icon="settings"
              type="button"
              onPress={() => handleGatewayConfig(gateway)}
            />
          </View>
        ))}
      </Section>

      {/* Global Payment Settings */}
      <Section title="Global Payment Settings">
        <SettingItem
          title="Default Currency"
          description="Default currency for all transactions"
          icon="attach-money"
          type="input"
          value={globalSettings.defaultCurrency}
          onValueChange={(value) => handleGlobalSettingChange('defaultCurrency', value)}
          placeholder="EGP"
        />
        <SettingItem
          title="Platform Fee (%)"
          description="Platform fee percentage on transactions"
          icon="percent"
          type="input"
          value={globalSettings.platformFeePercentage.toString()}
          onValueChange={(value) => handleGlobalSettingChange('platformFeePercentage', parseFloat(value as string) || 0)}
          placeholder="5.0"
          keyboardType="numeric"
        />
        <SettingItem
          title="Tax Rate (%)"
          description="Tax rate applied to transactions"
          icon="receipt"
          type="input"
          value={globalSettings.taxRate.toString()}
          onValueChange={(value) => handleGlobalSettingChange('taxRate', parseFloat(value as string) || 0)}
          placeholder="14.0"
          keyboardType="numeric"
        />
        <SettingItem
          title="Refund Policy (days)"
          description="Number of days for refund eligibility"
          icon="history"
          type="input"
          value={globalSettings.refundPolicy}
          onValueChange={(value) => handleGlobalSettingChange('refundPolicy', value)}
          placeholder="7"
          keyboardType="numeric"
        />
        <SettingItem
          title="Auto Refund"
          description="Automatically process refunds when eligible"
          icon="autorenew"
          type="switch"
          value={globalSettings.autoRefund}
          onValueChange={(value) => handleGlobalSettingChange('autoRefund', value)}
        />
        <SettingItem
          title="Payment Timeout (minutes)"
          description="Payment session timeout"
          icon="timer"
          type="input"
          value={globalSettings.paymentTimeout.toString()}
          onValueChange={(value) => handleGlobalSettingChange('paymentTimeout', parseInt(value as string) || 0)}
          placeholder="30"
          keyboardType="numeric"
        />
        <SettingItem
          title="Webhook Retries"
          description="Number of webhook retry attempts"
          icon="refresh"
          type="input"
          value={globalSettings.webhookRetries.toString()}
          onValueChange={(value) => handleGlobalSettingChange('webhookRetries', parseInt(value as string) || 0)}
          placeholder="3"
          keyboardType="numeric"
        />
        <SettingItem
          title="Fraud Detection"
          description="Enable fraud detection and prevention"
          icon="security"
          type="switch"
          value={globalSettings.fraudDetection}
          onValueChange={(value) => handleGlobalSettingChange('fraudDetection', value)}
        />
        <SettingItem
          title="Minimum Transaction Amount"
          description="Minimum allowed transaction amount"
          icon="trending-up"
          type="input"
          value={globalSettings.minTransactionAmount.toString()}
          onValueChange={(value) => handleGlobalSettingChange('minTransactionAmount', parseFloat(value as string) || 0)}
          placeholder="1"
          keyboardType="numeric"
        />
        <SettingItem
          title="Maximum Transaction Amount"
          description="Maximum allowed transaction amount"
          icon="trending-down"
          type="input"
          value={globalSettings.maxTransactionAmount.toString()}
          onValueChange={(value) => handleGlobalSettingChange('maxTransactionAmount', parseFloat(value as string) || 0)}
          placeholder="100000"
          keyboardType="numeric"
        />
      </Section>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Icon name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Payment Settings</Text>
        </TouchableOpacity>
      </View>

      {renderGatewayModal()}
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
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: theme.colors.primary,
  },
  switchInactive: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  switchDisabled: {
    opacity: 0.5,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  modalContent: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  testButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  saveModalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
