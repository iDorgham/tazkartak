import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';

type NotificationCenterScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'NotificationCenter'>;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  target: 'all' | 'organizers' | 'venue_owners' | 'buyers' | 'specific';
  targetUsers?: string[];
  scheduledFor?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: string;
  createdBy: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  target: 'all' | 'organizers' | 'venue_owners' | 'buyers';
}

interface NotificationStats {
  totalSent: number;
  totalScheduled: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface TabButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ title, active, onPress, badge }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {title}
    </Text>
    {badge && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onResend: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onEdit,
  onDelete,
  onResend,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return theme.colors.success;
      case 'scheduled': return theme.colors.warning;
      case 'failed': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'check-circle';
      default: return 'notifications';
    }
  };

  return (
    <TouchableOpacity style={styles.notificationCard} onPress={onPress}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <Icon name={getTypeIcon(notification.type)} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationTarget}>
            Target: {notification.target.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <View style={styles.notificationStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(notification.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(notification.status) }]}>
            {notification.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.notificationMessage} numberOfLines={2}>
        {notification.message}
      </Text>
      
      <View style={styles.notificationFooter}>
        <Text style={styles.notificationDate}>
          {notification.sentAt ? `Sent: ${new Date(notification.sentAt).toLocaleDateString()}` : 
           notification.scheduledFor ? `Scheduled: ${new Date(notification.scheduledFor).toLocaleDateString()}` :
           `Created: ${new Date(notification.createdAt).toLocaleDateString()}`}
        </Text>
        <View style={styles.notificationActions}>
          {notification.status === 'draft' && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Icon name="edit" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {notification.status === 'failed' && (
            <TouchableOpacity style={styles.actionButton} onPress={onResend}>
              <Icon name="refresh" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Icon name="delete" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<NotificationCenterScreenNavigationProp>();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'scheduled' | 'sent'>('all');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to Tazkartak!',
      message: 'Thank you for joining our platform. Start creating amazing events today!',
      type: 'success',
      target: 'all',
      status: 'sent',
      sentAt: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T09:30:00Z',
      createdBy: 'admin',
    },
    {
      id: '2',
      title: 'Payment System Maintenance',
      message: 'We will be performing maintenance on our payment system tonight from 2 AM to 4 AM EST.',
      type: 'warning',
      target: 'organizers',
      status: 'scheduled',
      scheduledFor: '2024-01-20T02:00:00Z',
      createdAt: '2024-01-15T14:00:00Z',
      createdBy: 'admin',
    },
    {
      id: '3',
      title: 'New Feature: QR Code Check-in',
      message: 'Check out our new QR code check-in feature for faster event entry!',
      type: 'info',
      target: 'venue_owners',
      status: 'draft',
      createdAt: '2024-01-15T16:00:00Z',
      createdBy: 'admin',
    },
  ]);

  const [templates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Welcome Message',
      title: 'Welcome to Tazkartak!',
      message: 'Thank you for joining our platform. Start creating amazing events today!',
      type: 'success',
      target: 'all',
    },
    {
      id: '2',
      name: 'Maintenance Notice',
      title: 'System Maintenance',
      message: 'We will be performing maintenance on our system. Please expect temporary interruptions.',
      type: 'warning',
      target: 'all',
    },
    {
      id: '3',
      name: 'Payment Issue',
      title: 'Payment Processing Issue',
      message: 'We are experiencing issues with payment processing. Please try again later.',
      type: 'error',
      target: 'buyers',
    },
  ]);

  const [stats] = useState<NotificationStats>({
    totalSent: 1250,
    totalScheduled: 5,
    totalFailed: 12,
    deliveryRate: 98.5,
    openRate: 75.2,
    clickRate: 15.8,
  });

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    target: 'all' as 'all' | 'organizers' | 'venue_owners' | 'buyers',
    scheduledFor: '',
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // dispatch(fetchNotifications());
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(n => n.status === activeTab);
  };

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const notification: Notification = {
      id: Date.now().toString(),
      ...newNotification,
      status: newNotification.scheduledFor ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };

    setNotifications(prev => [notification, ...prev]);
    setNewNotification({
      title: '',
      message: '',
      type: 'info',
      target: 'all',
      scheduledFor: '',
    });
    setShowCreateModal(false);
    Alert.alert('Success', 'Notification created successfully');
  };

  const handleUseTemplate = (template: NotificationTemplate) => {
    setNewNotification({
      title: template.title,
      message: template.message,
      type: template.type,
      target: template.target,
      scheduledFor: '',
    });
    setShowTemplatesModal(false);
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          },
        },
      ]
    );
  };

  const handleResendNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, status: 'sent', sentAt: new Date().toISOString() } : n
      )
    );
    Alert.alert('Success', 'Notification resent successfully');
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Notification</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Icon name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newNotification.title}
              onChangeText={(text) => setNewNotification(prev => ({ ...prev, title: text }))}
              placeholder="Enter notification title"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newNotification.message}
              onChangeText={(text) => setNewNotification(prev => ({ ...prev, message: text }))}
              placeholder="Enter notification message"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeSelector}>
              {(['info', 'warning', 'error', 'success'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    newNotification.type === type && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewNotification(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newNotification.type === type && styles.typeOptionTextActive,
                  ]}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Audience</Text>
            <View style={styles.targetSelector}>
              {(['all', 'organizers', 'venue_owners', 'buyers'] as const).map((target) => (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.targetOption,
                    newNotification.target === target && styles.targetOptionActive,
                  ]}
                  onPress={() => setNewNotification(prev => ({ ...prev, target }))}
                >
                  <Text style={[
                    styles.targetOptionText,
                    newNotification.target === target && styles.targetOptionTextActive,
                  ]}>
                    {target.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Schedule (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={newNotification.scheduledFor}
              onChangeText={(text) => setNewNotification(prev => ({ ...prev, scheduledFor: text }))}
              placeholder="YYYY-MM-DDTHH:MM:SSZ (Leave empty for immediate)"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.templateButton} onPress={() => setShowTemplatesModal(true)}>
            <Icon name="content-copy" size={20} color={theme.colors.primary} />
            <Text style={styles.templateButtonText}>Use Template</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateNotification}>
            <Icon name="send" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTemplatesModal = () => (
    <Modal
      visible={showTemplatesModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Template</Text>
          <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
            <Icon name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.templateCard}
              onPress={() => handleUseTemplate(item)}
            >
              <Text style={styles.templateName}>{item.name}</Text>
              <Text style={styles.templateTitle}>{item.title}</Text>
              <Text style={styles.templateMessage} numberOfLines={2}>{item.message}</Text>
              <View style={styles.templateMeta}>
                <Text style={[styles.templateType, { color: theme.colors[item.type] }]}>
                  {item.type.toUpperCase()}
                </Text>
                <Text style={styles.templateTarget}>
                  Target: {item.target.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  const filteredNotifications = getFilteredNotifications();

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Center</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalSent}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalScheduled}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.deliveryRate}%</Text>
            <Text style={styles.statLabel}>Delivery</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton
            title="All"
            active={activeTab === 'all'}
            onPress={() => setActiveTab('all')}
            badge={notifications.length}
          />
          <TabButton
            title="Draft"
            active={activeTab === 'draft'}
            onPress={() => setActiveTab('draft')}
            badge={notifications.filter(n => n.status === 'draft').length}
          />
          <TabButton
            title="Scheduled"
            active={activeTab === 'scheduled'}
            onPress={() => setActiveTab('scheduled')}
            badge={notifications.filter(n => n.status === 'scheduled').length}
          />
          <TabButton
            title="Sent"
            active={activeTab === 'sent'}
            onPress={() => setActiveTab('sent')}
            badge={notifications.filter(n => n.status === 'sent').length}
          />
        </ScrollView>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => {/* Navigate to details */}}
            onEdit={() => {/* Navigate to edit */}}
            onDelete={() => handleDeleteNotification(item.id)}
            onResend={() => handleResendNotification(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createFAB}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {renderCreateModal()}
      {renderTemplatesModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  notificationTarget: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  notificationStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createFAB: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  targetSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  targetOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  targetOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  targetOptionTextActive: {
    color: '#fff',
  },
  templateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  templateButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  templateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  templateMessage: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  templateType: {
    fontSize: 12,
    fontWeight: '600',
  },
  templateTarget: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
});
