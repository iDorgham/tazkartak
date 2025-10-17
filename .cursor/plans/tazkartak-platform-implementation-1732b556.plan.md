<!-- 1732b556-2b62-455e-a5f6-d018b01ead2b c9956ab7-f5f6-4917-9b90-de53679665cf -->
# Phase 7: Website Integration & Embeddable Widget Implementation

## Overview

Build a comprehensive embeddable widget system that allows organizers to sell tickets directly on their websites, with a public REST API for custom integrations, and webhook system for real-time notifications.

## 7.1 JavaScript Widget Development (Iframe-Based)

### 7.1.1 Widget App Structure

- Create new app in `apps/widget/` with React + TypeScript + Vite
- Configure minimal bundle with code splitting and tree shaking
- Set up separate build pipeline in `turbo.json` for widget
- Create `apps/widget/package.json` with dependencies: react, react-dom, axios
- Configure Vite for library mode with UMD output

### 7.1.2 Widget Core Components

Create `apps/widget/src/components/`:

- `TicketWidget.tsx` - Main widget component with event display
- `TicketTypeSelector.tsx` - Ticket type selection with quantity
- `CheckoutForm.tsx` - Buyer information form
- `PaymentSelection.tsx` - Payment method selection
- `ConfirmationView.tsx` - Purchase confirmation with QR code
- `ErrorBoundary.tsx` - Error handling wrapper

### 7.1.3 Widget Initialization Script

Create `apps/widget/src/embed.ts`:

```typescript
// Main initialization script
(function(window) {
  window.TazkartakWidget = {
    init: function(config) {
      // Create iframe with secure sandbox
      // Load widget with config params
      // Handle postMessage communication
    },
    destroy: function() { /* cleanup */ }
  };
})(window);
```

Generate embed code template:

```html
<div id="tazkartak-widget"></div>
<script src="https://widget.tazkartak.com/embed.js"></script>
<script>
  TazkartakWidget.init({
    eventId: 'EVENT_ID',
    apiKey: 'API_KEY',
    theme: { /* customization */ }
  });
</script>
```

### 7.1.4 Iframe Communication

- Implement postMessage API for parent-iframe communication
- Handle resize events to adjust iframe height dynamically
- Pass configuration and theme from parent to iframe
- Send purchase events back to parent page
- Add CORS configuration for allowed domains

### 7.1.5 Widget API Client

Create `apps/widget/src/services/api.ts`:

- Connect to backend public API endpoints
- Handle authentication with API keys
- Implement error handling and retry logic
- Add request/response caching for performance

## 7.2 Widget Customization Dashboard

### 7.2.1 Widget Configuration Service

Create `apps/backend/src/services/widgetConfig.service.ts`:

```typescript
interface WidgetConfig {
  id: string;
  organizerId: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    borderRadius: string;
    buttonStyle: 'rounded' | 'square' | 'pill';
  };
  customCSS?: string;
  layout: 'compact' | 'standard' | 'expanded';
  language: string;
  currency: string;
  showVenueInfo: boolean;
  showEventDescription: boolean;
}
```

Implement CRUD operations for widget configurations with validation.

### 7.2.2 Widget Configuration Page

Create `apps/frontend/src/pages/organizer/WidgetConfiguration.tsx`:

- Theme customizer with color pickers (primary, secondary, background)
- Font family selector (Google Fonts integration)
- Layout options selector (compact/standard/expanded)
- Custom CSS editor with Monaco/CodeMirror
- Language and currency settings
- Feature toggles (show description, venue info, etc.)

### 7.2.3 Live Preview Interface

Create `apps/frontend/src/components/widget/WidgetPreview.tsx`:

- Real-time preview in iframe
- Apply theme changes instantly via postMessage
- Device preview modes (desktop, tablet, mobile)
- Preview with sample event data

### 7.2.4 Embed Code Generator

Create `apps/frontend/src/components/widget/EmbedCodeGenerator.tsx`:

- Generate script tag with configuration
- Generate iframe embed option
- Provide React/Vue/Angular integration examples
- Add copy-to-clipboard functionality
- Show domain whitelist configuration

### 7.2.5 Widget Analytics

Create tracking in `apps/widget/src/services/analytics.ts`:

- Track widget loads and views
- Track ticket selection actions
- Track purchase completions
- Track error occurrences
- Send analytics to backend via beacon API

## 7.3 RESTful API for Integration

### 7.3.1 API Key Management

Create `apps/backend/src/services/apiKey.service.ts`:

```typescript
interface ApiKey {
  id: string;
  organizerId: string;
  key: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  allowedDomains: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
}
```

Implement:

- Generate secure API keys with crypto
- Store hashed keys in database
- Validate API keys with rate limiting
- Track API key usage and analytics

### 7.3.2 API Key Management Routes

Create `apps/backend/src/routes/apiKeys.routes.ts`:

```typescript
POST   /api/api-keys           - Create new API key
GET    /api/api-keys           - List user's API keys
GET    /api/api-keys/:id       - Get API key details
PUT    /api/api-keys/:id       - Update API key (name, domains, rate limit)
DELETE /api/api-keys/:id       - Revoke API key
POST   /api/api-keys/:id/rotate - Rotate API key
```

### 7.3.3 Public API Endpoints

Create `apps/backend/src/routes/public.routes.ts`:

```typescript
// Event endpoints
GET    /api/public/events              - List public events
GET    /api/public/events/:id          - Get event details
GET    /api/public/events/:id/tickets  - Get available tickets

// Ticket purchase
POST   /api/public/tickets/purchase    - Purchase tickets
GET    /api/public/tickets/:id         - Get ticket details

// Validation
POST   /api/public/qr/validate         - Validate QR code

// Health and info
GET    /api/public/health              - API health check
GET    /api/public/version             - API version info
```

All endpoints require API key authentication via `X-API-Key` header.

### 7.3.4 API Authentication Middleware

Create `apps/backend/src/middleware/apiAuth.middleware.ts`:

- Support both API Key and OAuth 2.0 authentication
- Implement API key validation from header
- Add rate limiting per API key (using Redis)
- Track API usage metrics
- Handle authentication errors

### 7.3.5 OAuth 2.0 Implementation

Create `apps/backend/src/services/oauth.service.ts`:

```typescript
// OAuth endpoints
POST   /api/oauth/authorize    - Authorization endpoint
POST   /api/oauth/token        - Token endpoint
POST   /api/oauth/revoke       - Revoke token
```

Implement OAuth 2.0 Authorization Code flow:

- Authorization code generation
- Access token and refresh token generation
- Token validation and refresh
- Scope-based permissions

### 7.3.6 API Documentation

Create `apps/backend/src/config/swagger.config.ts`:

- Configure Swagger/OpenAPI 3.0
- Document all public API endpoints
- Add request/response examples
- Include authentication instructions
- Add rate limiting information

Serve documentation at `/api/docs` using swagger-ui-express.

### 7.3.7 API Rate Limiting

Implement in `apps/backend/src/middleware/rateLimiter.middleware.ts`:

- Use Redis for distributed rate limiting
- Different limits per subscription tier:
  - Basic: 100 requests/hour
  - Pro: 1000 requests/hour
  - Enterprise: 10000 requests/hour
- Return rate limit headers (X-RateLimit-*)
- Return 429 status when limit exceeded

## 7.4 Webhook System

### 7.4.1 Webhook Service

Create `apps/backend/src/services/webhook.service.ts`:

```typescript
interface Webhook {
  id: string;
  organizerId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryStrategy: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  deliveredAt?: Date;
}
```

Implement:

- Register webhook endpoints
- Validate webhook URLs
- Generate webhook secrets
- Send webhook payloads with signature
- Retry failed webhooks with exponential backoff

### 7.4.2 Webhook Events

Support these event types:

- `ticket.purchased` - New ticket purchase
- `ticket.scanned` - Ticket QR scanned
- `ticket.refunded` - Ticket refunded
- `event.created` - New event created
- `event.updated` - Event updated
- `event.cancelled` - Event cancelled
- `payment.completed` - Payment completed
- `payment.failed` - Payment failed

### 7.4.3 Webhook Signature

Create `apps/backend/src/utils/webhookSignature.util.ts`:

```typescript
// Generate HMAC-SHA256 signature
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
```

Include signature in `X-Webhook-Signature` header for verification.

### 7.4.4 Webhook Management Routes

Create `apps/backend/src/routes/webhooks.routes.ts`:

```typescript
POST   /api/webhooks           - Create webhook
GET    /api/webhooks           - List webhooks
GET    /api/webhooks/:id       - Get webhook details
PUT    /api/webhooks/:id       - Update webhook
DELETE /api/webhooks/:id       - Delete webhook
POST   /api/webhooks/:id/test  - Test webhook
GET    /api/webhooks/:id/logs  - Get delivery logs
POST   /api/webhooks/:id/retry - Retry failed deliveries
```

### 7.4.5 Webhook Dashboard

Create `apps/frontend/src/pages/organizer/WebhookManagement.tsx`:

- List all configured webhooks
- Create/edit webhook form
- Test webhook with sample payload
- View delivery logs and status
- Manual retry for failed deliveries
- View webhook statistics (success rate, avg response time)

### 7.4.6 Webhook Retry Logic

Create `apps/backend/src/workers/webhookWorker.ts`:

- Use Bull queue for webhook delivery
- Implement exponential backoff: 1min, 5min, 15min, 1hr, 6hr
- Max 5 retry attempts (configurable per webhook)
- Store delivery logs for troubleshooting
- Send email alert after 5 failed attempts

## 7.5 Real-Time Updates (Optional Feature)

### 7.5.1 WebSocket Integration

Update `apps/backend/src/server.ts` to add WebSocket namespaces:

```typescript
const widgetNamespace = io.of('/widget');

widgetNamespace.on('connection', (socket) => {
  socket.on('subscribe:event', (eventId) => {
    socket.join(`event:${eventId}`);
  });
});
```

### 7.5.2 Widget Real-Time Client

Create `apps/widget/src/services/realtime.ts`:

- Connect to WebSocket when real-time enabled in config
- Subscribe to event-specific channel
- Listen for ticket availability updates
- Update UI when tickets sold or released
- Handle reconnection logic

### 7.5.3 Real-Time Events

Emit these real-time events:

- `ticket.availability` - Ticket count changed
- `event.capacity` - Event capacity updated
- `event.status` - Event status changed

### 7.5.4 Organizer Real-Time Settings

Add to widget configuration:

- Toggle real-time updates on/off
- Configure update frequency (to prevent spam)
- Connection status indicator in widget

## Implementation Files Summary

### Backend Files to Create:

- `apps/backend/src/services/widgetConfig.service.ts`
- `apps/backend/src/services/apiKey.service.ts`
- `apps/backend/src/services/oauth.service.ts`
- `apps/backend/src/services/webhook.service.ts`
- `apps/backend/src/middleware/apiAuth.middleware.ts`
- `apps/backend/src/middleware/rateLimiter.middleware.ts`
- `apps/backend/src/routes/apiKeys.routes.ts`
- `apps/backend/src/routes/public.routes.ts`
- `apps/backend/src/routes/webhooks.routes.ts`
- `apps/backend/src/config/swagger.config.ts`
- `apps/backend/src/utils/webhookSignature.util.ts`
- `apps/backend/src/workers/webhookWorker.ts`
- `apps/backend/src/controllers/apiKey.controller.ts`
- `apps/backend/src/controllers/webhook.controller.ts`
- `apps/backend/src/controllers/public.controller.ts`

### Frontend Files to Create:

- `apps/frontend/src/pages/organizer/WidgetConfiguration.tsx`
- `apps/frontend/src/pages/organizer/WebhookManagement.tsx`
- `apps/frontend/src/pages/organizer/ApiKeyManagement.tsx`
- `apps/frontend/src/components/widget/WidgetPreview.tsx`
- `apps/frontend/src/components/widget/EmbedCodeGenerator.tsx`
- `apps/frontend/src/services/widgetConfig.service.ts`
- `apps/frontend/src/services/apiKeys.service.ts`
- `apps/frontend/src/services/webhooks.service.ts`
- `apps/frontend/src/store/widgetConfig.slice.ts`
- `apps/frontend/src/store/apiKeys.slice.ts`
- `apps/frontend/src/store/webhooks.slice.ts`

### Widget App Files to Create:

- `apps/widget/package.json`
- `apps/widget/vite.config.ts`
- `apps/widget/tsconfig.json`
- `apps/widget/src/main.tsx`
- `apps/widget/src/embed.ts`
- `apps/widget/src/App.tsx`
- `apps/widget/src/components/TicketWidget.tsx`
- `apps/widget/src/components/TicketTypeSelector.tsx`
- `apps/widget/src/components/CheckoutForm.tsx`
- `apps/widget/src/components/PaymentSelection.tsx`
- `apps/widget/src/components/ConfirmationView.tsx`
- `apps/widget/src/components/ErrorBoundary.tsx`
- `apps/widget/src/services/api.ts`
- `apps/widget/src/services/analytics.ts`
- `apps/widget/src/services/realtime.ts`
- `apps/widget/src/utils/postMessage.ts`
- `apps/widget/src/styles/theme.css`

### Database Schema Updates:

Add to `apps/backend/prisma/schema.prisma`:

```prisma
model WidgetConfig {
  id            String   @id @default(cuid())
  organizerId   String   @unique
  theme         Json
  customCSS     String?
  layout        String   @default("standard")
  language      String   @default("en")
  settings      Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ApiKey {
  id             String    @id @default(cuid())
  organizerId    String
  key            String    @unique
  name           String
  permissions    String[]
  rateLimit      Int       @default(1000)
  allowedDomains String[]
  expiresAt      DateTime?
  lastUsedAt     DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model Webhook {
  id            String   @id @default(cuid())
  organizerId   String
  url           String
  events        String[]
  secret        String
  isActive      Boolean  @default(true)
  retryConfig   Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WebhookLog {
  id          String   @id @default(cuid())
  webhookId   String
  event       String
  payload     Json
  status      String
  attempts    Int      @default(0)
  response    Json?
  deliveredAt DateTime?
  createdAt   DateTime @default(now())
}
```

## Testing Strategy

### Widget Testing:

- Test iframe isolation and security
- Test postMessage communication
- Test responsive design in preview
- Test with different theme configurations
- Test on various browsers and devices

### API Testing:

- Test API key authentication
- Test OAuth 2.0 flow
- Test rate limiting enforcement
- Test all public endpoints
- Load test with concurrent requests

### Webhook Testing:

- Test webhook signature verification
- Test retry logic with failed deliveries
- Test exponential backoff timing
- Test with various payload sizes
- Test webhook timeout handling

## Security Considerations

1. **Widget Security**:

   - Iframe sandbox attributes for isolation
   - CSP headers for XSS prevention
   - Domain whitelist for CORS
   - Secure postMessage validation

2. **API Security**:

   - API key hashing in database
   - Rate limiting per key
   - OAuth 2.0 for third-party apps
   - Input validation on all endpoints

3. **Webhook Security**:

   - HMAC signature verification
   - HTTPS-only webhook URLs
   - Secret rotation capability
   - Request timeout limits

## Performance Optimizations

1. **Widget Bundle**:

   - Code splitting for lazy loading
   - Tree shaking unused code
   - Gzip compression
   - CDN delivery
   - Target bundle size: <100KB

2. **API Caching**:

   - Redis caching for public endpoints
   - ETags for conditional requests
   - Cache event data for 5 minutes
   - Cache ticket availability for 30 seconds

3. **Webhook Delivery**:

   - Queue-based async delivery
   - Batch webhook events when possible
   - Connection pooling
   - Timeout after 30 seconds

### To-dos

- [ ] Create widget app structure with React, TypeScript, and Vite in apps/widget/
- [ ] Build widget core components: TicketWidget, TicketTypeSelector, CheckoutForm, PaymentSelection, ConfirmationView
- [ ] Create widget initialization script and iframe communication system
- [ ] Implement widget configuration service with theme and customization options
- [ ] Build widget configuration page with theme customizer and live preview
- [ ] Create embed code generator with script tag and iframe options
- [ ] Implement API key generation, validation, and management system
- [ ] Create public REST API endpoints for events and tickets
- [ ] Implement API authentication middleware for both API keys and OAuth 2.0
- [ ] Implement OAuth 2.0 authorization flow with token management
- [ ] Implement rate limiting per API key with Redis-based tracking
- [ ] Create API documentation with Swagger/OpenAPI and serve at /api/docs
- [ ] Implement webhook service with registration, delivery, and retry logic
- [ ] Implement webhook signature generation and verification with HMAC-SHA256
- [ ] Create webhook worker with Bull queue and exponential backoff retry
- [ ] Build webhook management dashboard with logs and manual retry
- [ ] Implement optional real-time updates with WebSocket integration
- [ ] Add widget analytics tracking for loads, actions, and purchases
- [ ] Build API key management page with creation and rotation features
- [ ] Test widget integration, API endpoints, and webhook delivery