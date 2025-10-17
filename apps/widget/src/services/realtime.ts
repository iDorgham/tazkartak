import { io, Socket } from 'socket.io-client';
import { analytics } from './analytics';

interface RealtimeConfig {
  enabled: boolean;
  eventId: string;
  serverUrl?: string;
}

interface RealtimeEvents {
  'ticket.availability': (data: { ticketTypeId: string; availableQuantity: number }) => void;
  'event.capacity': (data: { capacity: number; soldTickets: number }) => void;
  'event.status': (data: { status: string }) => void;
  'price.update': (data: { ticketTypeId: string; price: number }) => void;
}

class RealtimeService {
  private socket: Socket | null = null;
  private config: RealtimeConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling(): void {
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  connect(config: RealtimeConfig): void {
    if (!config.enabled) {
      return;
    }

    this.config = config;
    
    const serverUrl = config.serverUrl || (
      process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001' 
        : 'https://api.tazkartak.com'
    );

    try {
      this.socket = io(`${serverUrl}/widget`, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        query: {
          eventId: config.eventId
        }
      });

      this.setupSocketEventHandlers();
      
      analytics.track('realtime_connected', {
        eventId: config.eventId,
        serverUrl
      });
    } catch (error) {
      console.error('Failed to connect to realtime service:', error);
      analytics.trackError(error as Error, 'realtime_connect');
    }
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to realtime service');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      analytics.track('realtime_connected', {
        connected: true,
        socketId: this.socket?.id
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from realtime service:', reason);
      
      analytics.track('realtime_disconnected', {
        reason,
        reconnectAttempts: this.reconnectAttempts
      });

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }

      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Realtime connection error:', error);
      analytics.trackError(error, 'realtime_connect_error');
    });

    // Subscribe to event-specific channel
    this.socket.on('connect', () => {
      if (this.config?.eventId) {
        this.socket?.emit('subscribe:event', this.config.eventId);
      }
    });

    // Handle real-time events
    this.socket.on('ticket.availability', (data) => {
      this.emit('ticket.availability', data);
      analytics.track('realtime_ticket_availability', data);
    });

    this.socket.on('event.capacity', (data) => {
      this.emit('event.capacity', data);
      analytics.track('realtime_event_capacity', data);
    });

    this.socket.on('event.status', (data) => {
      this.emit('event.status', data);
      analytics.track('realtime_event_status', data);
    });

    this.socket.on('price.update', (data) => {
      this.emit('price.update', data);
      analytics.track('realtime_price_update', data);
    });

    this.socket.on('error', (error) => {
      console.error('Realtime service error:', error);
      analytics.trackError(new Error(error.message || 'Realtime service error'), 'realtime_error');
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      analytics.track('realtime_max_reconnect_attempts', {
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    
    setTimeout(() => {
      if (this.config) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(this.config);
      }
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.listeners.clear();
    
    analytics.track('realtime_disconnected', {
      manual: true
    });
  }

  // Event subscription methods
  on<K extends keyof RealtimeEvents>(event: K, callback: RealtimeEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off<K extends keyof RealtimeEvents>(event: K, callback: RealtimeEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in realtime event handler for ${event}:`, error);
          analytics.trackError(error as Error, 'realtime_event_handler');
        }
      });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  // Manual subscription to specific events
  subscribeToEvent(eventId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe:event', eventId);
      analytics.track('realtime_event_subscribed', { eventId });
    }
  }

  unsubscribeFromEvent(eventId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe:event', eventId);
      analytics.track('realtime_event_unsubscribed', { eventId });
    }
  }

  // Send custom events to server
  emitCustomEvent(eventName: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName, data);
      analytics.track('realtime_custom_event_sent', { eventName, data });
    }
  }

  // Get connection info
  getConnectionInfo(): any {
    if (!this.socket) return null;
    
    return {
      connected: this.socket.connected,
      id: this.socket.id,
      transport: this.socket.io.engine.transport.name,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const realtimeService = new RealtimeService();
