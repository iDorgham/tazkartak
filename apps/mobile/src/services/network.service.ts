import NetInfo from '@react-native-community/netinfo';

class NetworkService {
  private isConnected = true;
  private connectionType: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Get initial network state
      const state = await NetInfo.fetch();
      this.isConnected = state.isConnected ?? false;
      this.connectionType = state.type;

      // Subscribe to network state changes
      NetInfo.addEventListener(state => {
        this.isConnected = state.isConnected ?? false;
        this.connectionType = state.type;
        
        console.log('Network state changed:', {
          isConnected: this.isConnected,
          type: this.connectionType,
        });
      });
    } catch (error) {
      console.error('Failed to initialize network service:', error);
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Failed to check network connectivity:', error);
      return false;
    }
  }

  getConnectionType(): string | null {
    return this.connectionType;
  }

  isWifi(): boolean {
    return this.connectionType === 'wifi';
  }

  isCellular(): boolean {
    return this.connectionType === 'cellular';
  }

  isEthernet(): boolean {
    return this.connectionType === 'ethernet';
  }

  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      const checkConnection = async () => {
        const connected = await this.isConnected();
        if (connected) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          setTimeout(checkConnection, 1000); // Check every second
        }
      };

      checkConnection();
    });
  }
}

export const netInfo = new NetworkService();

