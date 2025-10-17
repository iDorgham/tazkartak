import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tazkartak API',
      version: '1.0.0',
      description: 'Event ticket selling platform API with QR code validation, payment processing, and real-time analytics',
      contact: {
        name: 'Tazkartak Support',
        email: 'support@tazkartak.com',
        url: 'https://tazkartak.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.tazkartak.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated endpoints',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for public endpoints',
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/oauth/authorize`,
              tokenUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/oauth/token`,
              scopes: {
                'read': 'Read access to public data',
                'write': 'Write access to user data',
                'events:read': 'Read access to events',
                'events:write': 'Write access to events',
                'tickets:read': 'Read access to tickets',
                'tickets:write': 'Write access to tickets',
                'analytics:read': 'Read access to analytics',
                'webhooks:read': 'Read access to webhooks',
                'webhooks:write': 'Write access to webhooks',
              },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'user_123',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'ORGANIZER', 'VENUE_OWNER', 'BUYER'],
              example: 'ORGANIZER',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'event_123',
            },
            name: {
              type: 'string',
              example: 'Summer Music Festival',
            },
            description: {
              type: 'string',
              example: 'Annual summer music festival featuring local artists',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-06-15T18:00:00Z',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-06-15T23:00:00Z',
            },
            venue: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'Central Park',
                },
                address: {
                  type: 'string',
                  example: '123 Main St, City',
                },
                capacity: {
                  type: 'number',
                  example: 1000,
                },
              },
            },
            organizerId: {
              type: 'string',
              example: 'org_123',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'live', 'completed', 'cancelled'],
              example: 'published',
            },
            capacity: {
              type: 'number',
              example: 1000,
            },
            soldTickets: {
              type: 'number',
              example: 250,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TicketType: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'ticket_type_123',
            },
            name: {
              type: 'string',
              example: 'General Admission',
            },
            description: {
              type: 'string',
              example: 'Standard entry ticket',
            },
            price: {
              type: 'number',
              format: 'float',
              example: 50.00,
            },
            currency: {
              type: 'string',
              example: 'EGP',
            },
            availableQuantity: {
              type: 'number',
              example: 500,
            },
            maxPerOrder: {
              type: 'number',
              example: 10,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            eventId: {
              type: 'string',
              example: 'event_123',
            },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'ticket_123',
            },
            eventId: {
              type: 'string',
              example: 'event_123',
            },
            ticketTypeId: {
              type: 'string',
              example: 'ticket_type_123',
            },
            buyerId: {
              type: 'string',
              example: 'buyer_123',
            },
            qrCode: {
              type: 'string',
              example: 'qr_abc123def456',
            },
            purchaseDate: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['active', 'used', 'refunded', 'cancelled'],
              example: 'active',
            },
            scannedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'payment_123',
            },
            orderId: {
              type: 'string',
              example: 'order_123',
            },
            amount: {
              type: 'number',
              format: 'float',
              example: 100.00,
            },
            currency: {
              type: 'string',
              example: 'EGP',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
              example: 'completed',
            },
            paymentMethod: {
              type: 'string',
              example: 'credit_card',
            },
            gateway: {
              type: 'string',
              example: 'paymob',
            },
            transactionId: {
              type: 'string',
              example: 'txn_123',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Venue: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'venue_123',
            },
            name: {
              type: 'string',
              example: 'Grand Theater',
            },
            address: {
              type: 'string',
              example: '123 Theater St, Downtown',
            },
            city: {
              type: 'string',
              example: 'Cairo',
            },
            capacity: {
              type: 'number',
              example: 500,
            },
            ownerId: {
              type: 'string',
              example: 'venue_owner_123',
            },
            isVerified: {
              type: 'boolean',
              example: true,
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['parking', 'wheelchair_access', 'food_court'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        QRScan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'scan_123',
            },
            ticketId: {
              type: 'string',
              example: 'ticket_123',
            },
            scannedBy: {
              type: 'string',
              example: 'staff_123',
            },
            scannedAt: {
              type: 'string',
              format: 'date-time',
            },
            location: {
              type: 'object',
              properties: {
                latitude: {
                  type: 'number',
                  format: 'float',
                  example: 30.0444,
                },
                longitude: {
                  type: 'number',
                  format: 'float',
                  example: 31.2357,
                },
                address: {
                  type: 'string',
                  example: 'Cairo, Egypt',
                },
              },
            },
            isValid: {
              type: 'boolean',
              example: true,
            },
            status: {
              type: 'string',
              enum: ['valid', 'invalid', 'already_used', 'expired'],
              example: 'valid',
            },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'sub_123',
            },
            organizerId: {
              type: 'string',
              example: 'org_123',
            },
            packageType: {
              type: 'string',
              enum: ['BASIC', 'PRO', 'ENTERPRISE'],
              example: 'PRO',
            },
            status: {
              type: 'string',
              enum: ['active', 'cancelled', 'expired', 'suspended'],
              example: 'active',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
            },
            autoRenew: {
              type: 'boolean',
              example: true,
            },
            features: {
              type: 'object',
              properties: {
                maxEvents: {
                  type: 'number',
                  example: 50,
                },
                maxTicketsPerEvent: {
                  type: 'number',
                  example: 10000,
                },
                analyticsAccess: {
                  type: 'boolean',
                  example: true,
                },
                apiAccess: {
                  type: 'boolean',
                  example: true,
                },
                webhookAccess: {
                  type: 'boolean',
                  example: true,
                },
              },
            },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'api_key_123',
            },
            name: {
              type: 'string',
              example: 'My App Integration',
            },
            key: {
              type: 'string',
              example: 'tazkartak_abc123def456',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['read', 'write'],
            },
            rateLimit: {
              type: 'number',
              example: 1000,
            },
            allowedDomains: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['https://myapp.com', 'https://staging.myapp.com'],
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Webhook: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'webhook_123',
            },
            organizerId: {
              type: 'string',
              example: 'org_123',
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://myapp.com/webhooks/tazkartak',
            },
            events: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'ticket.purchased',
                  'ticket.scanned',
                  'ticket.refunded',
                  'event.created',
                  'event.updated',
                  'event.cancelled',
                  'payment.completed',
                  'payment.failed',
                ],
              },
              example: ['ticket.purchased', 'payment.completed'],
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            retryConfig: {
              type: 'object',
              properties: {
                maxAttempts: {
                  type: 'number',
                  example: 5,
                },
                backoffMultiplier: {
                  type: 'number',
                  example: 2,
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        WidgetConfig: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'widget_config_123',
            },
            organizerId: {
              type: 'string',
              example: 'org_123',
            },
            theme: {
              type: 'object',
              properties: {
                primaryColor: {
                  type: 'string',
                  example: '#1976d2',
                },
                secondaryColor: {
                  type: 'string',
                  example: '#dc004e',
                },
                backgroundColor: {
                  type: 'string',
                  example: '#ffffff',
                },
                textColor: {
                  type: 'string',
                  example: '#333333',
                },
                fontFamily: {
                  type: 'string',
                  example: 'Roboto, sans-serif',
                },
                borderRadius: {
                  type: 'string',
                  example: '8px',
                },
                buttonStyle: {
                  type: 'string',
                  enum: ['rounded', 'square', 'pill'],
                  example: 'rounded',
                },
              },
            },
            customCSS: {
              type: 'string',
              example: '.custom-button { background: linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%); }',
            },
            layout: {
              type: 'string',
              enum: ['compact', 'standard', 'expanded'],
              example: 'standard',
            },
            language: {
              type: 'string',
              example: 'en',
            },
            currency: {
              type: 'string',
              example: 'EGP',
            },
            showVenueInfo: {
              type: 'boolean',
              example: true,
            },
            showEventDescription: {
              type: 'boolean',
              example: true,
            },
            realTimeUpdates: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field and direction',
          schema: {
            type: 'string',
            example: 'createdAt:desc',
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Authentication required',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Access denied',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: ['Name is required', 'Email must be valid'],
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Rate limit exceeded',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Events',
        description: 'Event management endpoints',
      },
      {
        name: 'Tickets',
        description: 'Ticket management and purchase endpoints',
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Venues',
        description: 'Venue management endpoints',
      },
      {
        name: 'QR Codes',
        description: 'QR code generation and validation endpoints',
      },
      {
        name: 'Subscriptions',
        description: 'Subscription and billing endpoints',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints',
      },
      {
        name: 'Webhooks',
        description: 'Webhook management endpoints',
      },
      {
        name: 'API Keys',
        description: 'API key management endpoints',
      },
      {
        name: 'Widget Config',
        description: 'Widget configuration endpoints',
      },
      {
        name: 'OAuth',
        description: 'OAuth 2.0 authorization endpoints',
      },
      {
        name: 'Public API',
        description: 'Public API endpoints for external integrations',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: any): void => {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      syntaxHighlight: {
        activate: true,
        theme: 'agate',
      },
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1976d2; }
      .swagger-ui .scheme-container { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    `,
    customSiteTitle: 'Tazkartak API Documentation',
    customfavIcon: '/favicon.ico',
  };

  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  // Serve OpenAPI JSON
  app.get('/api/docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Redirect root /api/docs to Swagger UI
  app.get('/api/docs', (req: any, res: any) => {
    res.redirect('/api/docs/');
  });
};

export { specs };