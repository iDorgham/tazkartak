import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { storageService } from './storage.service';
import { apiService } from './api.service';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationPayload {
  type: 'ticket_purchase' | 'event_reminder' | 'payment_update' | 'event_update' | 'admin_announcement';
  title: string;
  body: string;
  data?: any;
  deepLink?: string;
}

class NotificationService {
  private isInitialized = false;
  private pushToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      console.log('Initializing notification service...');

      // Request permissions
      await this.requestPermissions();

      // Get push token
      await this.getPushToken();

      // Setup notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return false;
        }

        // Store permission status
        await storageService.setNotificationPermissions({
          status: finalStatus,
          granted: finalStatus === 'granted',
          timestamp: Date.now(),
        });

        return finalStatus === 'granted';
      } else {
        console.log('Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.pushToken = token.data;
      console.log('Push token:', this.pushToken);

      // Register token with backend
      await this.registerTokenWithBackend(this.pushToken);

      return this.pushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiService.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || '1.0.0',
      });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  setupNotificationListeners(): void {
    // Handle notifications received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle user tapping on notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    // Handle in-app notification display
    const payload = notification.request.content.data as NotificationPayload;
    
    // Show alert for important notifications
    if (payload.type === 'payment_update' || payload.type === 'admin_announcement') {
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || '',
        [{ text: 'OK' }]
      );
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const payload = response.notification.request.content.data as NotificationPayload;
    
    if (payload.deepLink) {
      // Handle deep linking
      this.handleDeepLink(payload.deepLink);
    }
  }

  private handleDeepLink(deepLink: string): void {
    // Parse deep link and navigate to appropriate screen
    console.log('Handling deep link:', deepLink);
    
    // This would integrate with your navigation system
    // For now, just log the deep link
    if (deepLink.startsWith('tazkartak://ticket/')) {
      const ticketId = deepLink.split('/').pop();
      console.log('Navigate to ticket:', ticketId);
    } else if (deepLink.startsWith('tazkartak://event/')) {
      const eventId = deepLink.split('/').pop();
      console.log('Navigate to event:', eventId);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger,
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    eventDate: Date,
    reminderMinutes: number = 60
  ): Promise<string> {
    try {
      const reminderDate = new Date(eventDate.getTime() - reminderMinutes * 60 * 1000);
      
      return await this.scheduleLocalNotification(
        'Event Reminder',
        `${eventTitle} starts in ${reminderMinutes} minutes`,
        { date: reminderDate },
        {
          type: 'event_reminder',
          eventId,
          deepLink: `tazkartak://event/${eventId}`,
        }
      );
    } catch (error) {
      console.error('Failed to schedule event reminder:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }

  async updateNotificationSettings(settings: {
    ticketPurchase: boolean;
    eventReminders: boolean;
    paymentUpdates: boolean;
    eventUpdates: boolean;
    adminAnnouncements: boolean;
  }): Promise<void> {
    try {
      await storageService.setItem('notification_settings', settings);
      
      // Update backend with notification preferences
      await apiService.put('/notifications/settings', settings);
      
      console.log('Notification settings updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  async getNotificationSettings(): Promise<any> {
    try {
      const settings = await storageService.getItem('notification_settings');
      return settings || {
        ticketPurchase: true,
        eventReminders: true,
        paymentUpdates: true,
        eventUpdates: true,
        adminAnnouncements: true,
      };
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return {};
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Cancel all scheduled notifications
      await this.cancelAllNotifications();
      
      // Clear badge
      await this.clearBadge();
      
      console.log('Notification service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup notification service:', error);
    }
  }
}

export const notificationService = new NotificationService();
