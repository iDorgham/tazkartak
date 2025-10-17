import { PostMessageData } from '../types/widget.types';

export const sendToParent = (data: PostMessageData): void => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(data, '*');
  }
};

export const sendResizeEvent = (height: number): void => {
  sendToParent({
    type: 'resize',
    data: { height }
  });
};

export const sendPurchaseComplete = (purchaseData: any): void => {
  sendToParent({
    type: 'purchase-complete',
    data: purchaseData
  });
};

export const sendError = (message: string, details?: any): void => {
  sendToParent({
    type: 'error',
    data: { message, details }
  });
};

export const sendAnalytics = (event: string, properties?: Record<string, any>): void => {
  sendToParent({
    type: 'analytics',
    data: { event, properties }
  });
};

export const sendWidgetEvent = (eventType: string, data?: any): void => {
  sendToParent({
    type: 'widget-event',
    data: { eventType, data }
  });
};

// Listen for messages from parent
export const listenForParentMessages = (
  callback: (data: PostMessageData) => void
): (() => void) => {
  const handleMessage = (event: MessageEvent) => {
    // Verify origin for security
    const allowedOrigins = [
      window.location.origin,
      'https://tazkartak.com',
      'https://www.tazkartak.com',
      'https://app.tazkartak.com'
    ];

    if (!allowedOrigins.some(origin => event.origin.includes(origin.replace('https://', '')))) {
      return;
    }

    try {
      const data = event.data as PostMessageData;
      if (data && typeof data === 'object' && data.type) {
        callback(data);
      }
    } catch (error) {
      console.error('Failed to parse message from parent:', error);
    }
  };

  window.addEventListener('message', handleMessage);

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage);
  };
};
