import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketWidget } from '../components/TicketWidget';
import { WidgetConfig } from '../types/widget.types';

// Mock the analytics and realtime services
vi.mock('../services/analytics.service', () => ({
  initializeAnalyticsService: vi.fn(),
  getAnalyticsService: vi.fn(() => ({
    trackLoad: vi.fn(),
    trackView: vi.fn(),
    trackTicketSelect: vi.fn(),
    trackCheckoutStart: vi.fn(),
    trackPurchase: vi.fn(),
    trackError: vi.fn(),
  })),
}));

vi.mock('../services/realtime.service', () => ({
  initializeRealtimeService: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Widget Integration Tests', () => {
  const mockEvent = {
    id: 'event-123',
    name: 'Test Event',
    description: 'A test event for widget testing',
    startDate: '2024-06-15T18:00:00Z',
    endDate: '2024-06-15T23:00:00Z',
    venue: {
      name: 'Test Venue',
      address: '123 Test Street',
      city: 'Test City',
      capacity: 1000,
    },
    ticketTypes: [
      {
        id: 'ticket-type-1',
        name: 'General Admission',
        description: 'Standard ticket',
        price: 50.00,
        currency: 'EGP',
        availableQuantity: 100,
        maxPerOrder: 5,
        isActive: true,
      },
      {
        id: 'ticket-type-2',
        name: 'VIP',
        description: 'VIP ticket with perks',
        price: 100.00,
        currency: 'EGP',
        availableQuantity: 50,
        maxPerOrder: 2,
        isActive: true,
      },
    ],
    capacity: 1000,
    soldTickets: 0,
    status: 'published' as const,
  };

  const mockConfig: WidgetConfig = {
    eventId: 'event-123',
    apiKey: 'test-api-key',
    theme: {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Roboto, sans-serif',
      borderRadius: '8px',
      buttonStyle: 'rounded',
    },
    layout: 'standard',
    language: 'en',
    currency: 'EGP',
    showVenueInfo: true,
    showEventDescription: true,
    realTimeUpdates: true,
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockEvent,
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Widget Initialization', () => {
    test('should render widget with loading state initially', () => {
      render(<TicketWidget config={mockConfig} />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('should load event data and display it', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByText('A test event for widget testing')).toBeInTheDocument();
        expect(screen.getByText('Test Venue')).toBeInTheDocument();
      });
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));
      
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Ticket Selection', () => {
    test('should display ticket types', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        expect(screen.getByText('General Admission')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getByText('50.00 EGP')).toBeInTheDocument();
        expect(screen.getByText('100.00 EGP')).toBeInTheDocument();
      });
    });

    test('should allow quantity selection', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        expect(quantityInput).toBeInTheDocument();
        
        fireEvent.change(quantityInput, { target: { value: '3' } });
        expect(quantityInput).toHaveValue(3);
      });
    });

    test('should validate maximum quantity per order', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        fireEvent.change(quantityInput, { target: { value: '10' } }); // Exceeds max
        
        // Should show validation error
        expect(screen.getByText(/maximum/i)).toBeInTheDocument();
      });
    });

    test('should proceed to checkout when tickets are selected', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        expect(continueButton).toBeInTheDocument();
        
        fireEvent.click(continueButton);
        
        // Should move to checkout step
        expect(screen.getByText(/checkout/i)).toBeInTheDocument();
      });
    });
  });

  describe('Checkout Process', () => {
    test('should display checkout form', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        fireEvent.click(continueButton);
        
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      });
    });

    test('should validate required fields', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        fireEvent.click(continueButton);
        
        const submitButton = screen.getByText(/proceed to payment/i);
        fireEvent.click(submitButton);
        
        // Should show validation errors
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    test('should proceed to payment when form is valid', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        fireEvent.click(continueButton);
        
        // Fill form
        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+1234567890' } });
        
        const submitButton = screen.getByText(/proceed to payment/i);
        fireEvent.click(submitButton);
        
        // Should move to payment step
        expect(screen.getByText(/payment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Integration', () => {
    test('should display payment methods', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      // Navigate to payment step
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        fireEvent.click(continueButton);
        
        // Fill form and proceed
        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+1234567890' } });
        
        const submitButton = screen.getByText(/proceed to payment/i);
        fireEvent.click(submitButton);
        
        // Check for payment methods
        expect(screen.getByText(/credit card/i)).toBeInTheDocument();
        expect(screen.getByText(/paymob/i)).toBeInTheDocument();
      });
    });

    test('should handle payment completion', async () => {
      // Mock successful payment response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            paymentUrl: 'https://payment.example.com/redirect',
            orderId: 'order-123',
          },
        }),
      });
      
      render(<TicketWidget config={mockConfig} />);
      
      // Navigate through the flow
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        fireEvent.click(continueButton);
        
        // Fill form and proceed
        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+1234567890' } });
        
        const submitButton = screen.getByText(/proceed to payment/i);
        fireEvent.click(submitButton);
        
        // Select payment method and complete
        const paymentButton = screen.getByText(/pay with credit card/i);
        fireEvent.click(paymentButton);
        
        // Should show payment URL or redirect
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/public/tickets/purchase'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'X-API-Key': 'test-api-key',
            }),
          })
        );
      });
    });
  });

  describe('Theme Customization', () => {
    test('should apply custom theme colors', () => {
      const customConfig = {
        ...mockConfig,
        theme: {
          ...mockConfig.theme,
          primaryColor: '#ff5722',
          secondaryColor: '#4caf50',
          backgroundColor: '#f5f5f5',
        },
      };
      
      render(<TicketWidget config={customConfig} />);
      
      const widget = screen.getByTestId('ticket-widget');
      expect(widget).toHaveAttribute('data-theme-colors', expect.stringContaining('#ff5722'));
    });

    test('should apply custom CSS', () => {
      const customConfig = {
        ...mockConfig,
        customCSS: '.custom-button { background: linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%); }',
      };
      
      render(<TicketWidget config={customConfig} />);
      
      // Check if custom CSS is applied
      const styleElement = document.querySelector('style[data-widget-custom]');
      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('custom-button');
    });
  });

  describe('Real-time Updates', () => {
    test('should connect to WebSocket when real-time enabled', () => {
      const { initializeRealtimeService } = require('../services/realtime.service');
      
      render(<TicketWidget config={mockConfig} />);
      
      expect(initializeRealtimeService).toHaveBeenCalledWith(
        expect.stringContaining('widget'),
        'test-api-key',
        'event-123'
      );
    });

    test('should handle ticket availability updates', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        // Simulate ticket availability update
        const event = new CustomEvent('tazkartak:ticketAvailability', {
          detail: {
            ticketTypeId: 'ticket-type-1',
            availableQuantity: 95,
          },
        });
        
        window.dispatchEvent(event);
        
        // Should update the UI with new availability
        expect(screen.getByText(/95.*available/i)).toBeInTheDocument();
      });
    });

    test('should handle event status updates', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        // Simulate event status update
        const event = new CustomEvent('tazkartak:eventStatus', {
          detail: {
            status: 'cancelled',
          },
        });
        
        window.dispatchEvent(event);
        
        // Should show event cancelled message
        expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tracking', () => {
    test('should track widget load', () => {
      const { getAnalyticsService } = require('../services/analytics.service');
      const mockAnalytics = getAnalyticsService();
      
      render(<TicketWidget config={mockConfig} />);
      
      expect(mockAnalytics.trackLoad).toHaveBeenCalled();
    });

    test('should track ticket selection', async () => {
      const { getAnalyticsService } = require('../services/analytics.service');
      const mockAnalytics = getAnalyticsService();
      
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        fireEvent.change(quantityInput, { target: { value: '2' } });
        
        expect(mockAnalytics.trackTicketSelect).toHaveBeenCalledWith(
          'ticket-type-1',
          2
        );
      });
    });

    test('should track checkout start', async () => {
      const { getAnalyticsService } = require('../services/analytics.service');
      const mockAnalytics = getAnalyticsService();
      
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        fireEvent.click(continueButton);
        
        expect(mockAnalytics.trackCheckoutStart).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('should display error boundary for component errors', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      
      render(<ErrorComponent />);
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    test('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should retry failed requests', async () => {
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockEvent }),
        });
      
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
      });
    });

    test('should support keyboard navigation', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        continueButton.focus();
        
        fireEvent.keyDown(continueButton, { key: 'Enter' });
        
        // Should proceed to next step
        expect(screen.getByText(/checkout/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      render(<TicketWidget config={mockConfig} />);
      
      const widget = screen.getByTestId('ticket-widget');
      expect(widget).toHaveClass('mobile');
    });

    test('should handle touch events', async () => {
      render(<TicketWidget config={mockConfig} />);
      
      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i);
        
        fireEvent.touchStart(continueButton);
        fireEvent.touchEnd(continueButton);
        
        // Should proceed to next step
        expect(screen.getByText(/checkout/i)).toBeInTheDocument();
      });
    });
  });
});
