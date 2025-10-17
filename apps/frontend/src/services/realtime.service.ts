import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { logger } from '../utils/logger.util';

export interface RealtimeEvent {
  type: string;
  eventId?: string;
  organizerId?: string;
  data: any;
  timestamp: Date;
}

export interface ConnectedClients {
  widget: number;
  organizer: number;
}

export class FrontendRealtimeService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private serverUrl: string;

  constructor(serverUrl: string = process.env.REACT_APP_API_URL || 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  /**
   * Initialize real-time connection
   */
  public initialize(): void {
    try {
      this.socket = io(`${this.serverUrl}/organizer`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventHandlers();
      
      logger.info('Frontend realtime service initialized');
    } catch (error) {
      logger.error('Failed to initialize frontend realtime service:', error);
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Frontend connected to realtime service');
      
      // Subscribe to organizer updates
      const user = store.getState().auth.user;
      if (user?.id) {
        this.subscribeToOrganizer(user.id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      logger.warn('Frontend disconnected from realtime service:', reason);
      
      if (reason === 'io server disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Frontend connection error:', error);
      this.handleReconnect();
    });

    // Listen for real-time updates
    this.socket.on('event:update', (event: RealtimeEvent) => {
      this.handleEventUpdate(event);
    });

    this.socket.on('widget:update', (event: RealtimeEvent) => {
      this.handleWidgetUpdate(event);
    });

    this.socket.on('analytics:update', (data: any) => {
      this.handleAnalyticsUpdate(data);
    });

    this.socket.on('purchase:notification', (data: any) => {
      this.handlePurchaseNotification(data);
    });
  }

  /**
   * Subscribe to organizer updates
   */
  public subscribeToOrganizer(organizerId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:organizer', organizerId);
      logger.info(`Subscribed to organizer updates: ${organizerId}`);
    }
  }

  /**
   * Subscribe to event updates
   */
  public subscribeToEvent(eventId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:event', eventId);
      logger.info(`Subscribed to event updates: ${eventId}`);
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Handle event updates
   */
  private handleEventUpdate(event: RealtimeEvent): void {
    logger.info('Received event update:', event);
    
    // Update Redux store if needed
    // This would typically dispatch actions to update the store
    
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('tazkartak:eventUpdate', {
      detail: event,
    }));
  }

  /**
   * Handle widget updates
   */
  private handleWidgetUpdate(event: RealtimeEvent): void {
    logger.info('Received widget update:', event);
    
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('tazkartak:widgetUpdate', {
      detail: event,
    }));
  }

  /**
   * Handle analytics updates
   */
  private handleAnalyticsUpdate(data: any): void {
    logger.info('Received analytics update:', data);
    
    // Emit custom event for analytics dashboard to listen to
    window.dispatchEvent(new CustomEvent('tazkartak:analyticsUpdate', {
      detail: data,
    }));
  }

  /**
   * Handle purchase notifications
   */
  private handlePurchaseNotification(data: any): void {
    logger.info('Received purchase notification:', data);
    
    // Show notification to user
    this.showNotification('New Purchase!', `Ticket purchased for ${data.eventName}`, 'success');
    
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('tazkartak:purchaseNotification', {
      detail: data,
    }));
  }

  /**
   * Show notification to user
   */
  private showNotification(title: string, message: string, type: 'success' | 'info' | 'warning' | 'error'): void {
    // This would typically integrate with a notification system
    // For now, we'll use the browser's notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from real-time service
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      logger.info('Frontend disconnected from realtime service');
    }
  }

  /**
   * Reconnect to real-time service
   */
  public reconnect(): void {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  /**
   * Get connected clients count
   */
  public async getConnectedClientsCount(): Promise<ConnectedClients> {
    // This would typically be fetched from the server
    return {
      widget: 0,
      organizer: 0,
    };
  }

  /**
   * Send custom event to server
   */
  public emitEvent(eventType: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    }
  }

  /**
   * Listen for custom events from server
   */
  public onEvent(eventType: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(eventType, callback);
    }
  }

  /**
   * Remove event listener
   */
  public offEvent(eventType: string, callback?: (data: any) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(eventType, callback);
      } else {
        this.socket.off(eventType);
      }
    }
  }
}

// Global instance
let realtimeServiceInstance: FrontendRealtimeService | null = null;

/**
 * Initialize global real-time service
 */
export function initializeRealtimeService(
  serverUrl?: string
): FrontendRealtimeService {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new FrontendRealtimeService(serverUrl);
    realtimeServiceInstance.initialize();
  }
  return realtimeServiceInstance;
}

/**
 * Get global real-time service instance
 */
export function getRealtimeService(): FrontendRealtimeService | null {
  return realtimeServiceInstance;
}

/**
 * Disconnect global real-time service
 */
export function disconnectRealtimeService(): void {
  if (realtimeServiceInstance) {
    realtimeServiceInstance.disconnect();
    realtimeServiceInstance = null;
  }
}
