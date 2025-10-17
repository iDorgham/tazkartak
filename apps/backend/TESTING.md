# Tazkartak Platform Testing Guide

This document provides comprehensive testing guidelines for the Tazkartak platform, including widget integration, API endpoints, and webhook delivery.

## 🧪 Test Structure

### Backend Tests
- **Unit Tests**: Individual component and service testing
- **Integration Tests**: API endpoint and database interaction testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load testing and benchmarking

### Widget Tests
- **Component Tests**: React component testing with React Testing Library
- **Integration Tests**: Widget-API integration testing
- **E2E Tests**: Complete widget workflow testing

## 🚀 Quick Start

### Prerequisites
1. **Database**: PostgreSQL test database
2. **Redis**: Redis test instance
3. **Node.js**: Version 18+ with npm/pnpm

### Environment Setup
```bash
# Create test environment file
cp .env.example .env.test

# Set test database URL
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/tazkartak_test"

# Set test Redis URL
TEST_REDIS_HOST="localhost"
TEST_REDIS_PORT="6379"
TEST_REDIS_DB="1"
```

### Running Tests

#### All Tests
```bash
# Backend - Run all tests
npm run test:all

# Widget - Run all tests
cd apps/widget && npm run test:run
```

#### Specific Test Suites
```bash
# Backend API tests
npm run test:api

# OAuth 2.0 tests
npm run test:oauth

# Webhook tests
npm run test:webhook

# Widget tests
cd apps/widget && npm run test
```

#### Individual Test Files
```bash
# Run specific test file
npm test -- src/tests/integration/api.test.ts

# Run with watch mode
npm run test:watch -- src/tests/integration/oauth.test.ts
```

## 📋 Test Categories

### 1. API Endpoint Testing

#### Public API Tests (`api.test.ts`)
- **Authentication**: API key validation and rate limiting
- **Event Management**: CRUD operations for events
- **Ticket Purchase**: Complete purchase workflow
- **QR Validation**: QR code scanning and validation
- **Error Handling**: Invalid requests and edge cases

```typescript
// Example: Testing ticket purchase
test('should purchase tickets successfully', async () => {
  const response = await request(app)
    .post('/api/public/tickets/purchase')
    .set('X-API-Key', testApiKey.key)
    .send(purchaseData);

  expect(response.status).toBe(200);
  expect(response.body.data.paymentUrl).toBeDefined();
});
```

#### OAuth 2.0 Tests (`oauth.test.ts`)
- **Client Management**: Create, read, update, delete OAuth clients
- **Authorization Flow**: Complete OAuth 2.0 authorization code flow
- **Token Management**: Access token generation, refresh, and revocation
- **Scope Validation**: Permission-based access control

```typescript
// Example: Testing OAuth authorization
test('should generate authorization code', async () => {
  const response = await request(app)
    .get('/api/oauth/authorize')
    .query({
      response_type: 'code',
      client_id: testClient.clientId,
      redirect_uri: 'https://test-app.com/callback',
    });

  expect(response.status).toBe(302);
  expect(response.headers.location).toContain('code=');
});
```

### 2. Webhook Testing

#### Webhook Delivery Tests (`webhook.test.ts`)
- **Registration**: Webhook endpoint registration and validation
- **Delivery**: Payload delivery with signature verification
- **Retry Logic**: Exponential backoff and retry mechanisms
- **Security**: HMAC-SHA256 signature generation and verification

```typescript
// Example: Testing webhook signature
test('should generate correct webhook signature', () => {
  const payload = JSON.stringify({ test: 'data' });
  const signature = generateSignature(payload, secret);
  
  expect(signature).toMatch(/^[a-f0-9]{64}$/);
});
```

### 3. Widget Integration Testing

#### Widget Component Tests (`widget.test.ts`)
- **Initialization**: Widget loading and configuration
- **Ticket Selection**: Quantity selection and validation
- **Checkout Process**: Form validation and submission
- **Payment Integration**: Payment method selection and completion
- **Theme Customization**: Custom styling and layout
- **Real-time Updates**: WebSocket integration and event handling
- **Analytics Tracking**: User interaction tracking

```typescript
// Example: Testing widget initialization
test('should render widget with loading state initially', () => {
  render(<TicketWidget config={mockConfig} />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

### 4. End-to-End Testing

#### Complete Workflow Tests (`full-integration.test.ts`)
- **Full Purchase Flow**: Complete ticket purchase from start to finish
- **OAuth Integration**: Third-party application integration
- **Webhook Delivery**: Real-time notification delivery
- **Performance Testing**: Load testing with concurrent requests
- **Data Consistency**: Database integrity and transaction handling

```typescript
// Example: Testing complete workflow
test('should complete full ticket purchase flow via API', async () => {
  // 1. Get event details
  const eventResponse = await request(app)
    .get(`/api/public/events/${testEvent.id}`)
    .set('X-API-Key', testApiKey.key);

  // 2. Purchase tickets
  const purchaseResponse = await request(app)
    .post('/api/public/tickets/purchase')
    .set('X-API-Key', testApiKey.key)
    .send(purchaseData);

  // 3. Verify webhook delivery
  expect(testWebhook.events).toContain('ticket.purchased');
});
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.ts'],
  globalSetup: '<rootDir>/src/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/setup/global-teardown.ts',
  testTimeout: 30000,
  maxWorkers: 1, // Sequential execution to avoid DB conflicts
};
```

### Vitest Configuration (`vitest.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## 🗄️ Test Data Management

### Test Setup (`test-setup.ts`)
The test setup provides utilities for creating and managing test data:

```typescript
// Create test user with authentication token
const testUser = await testSetup.createTestUser({
  email: 'test@example.com',
  role: 'ORGANIZER',
});

// Create complete test scenario
const scenario = await testSetup.createCompleteTestScenario();
// Returns: { user, venue, event, apiKey, oauthClient, webhook }
```

### Database Cleanup
- **Automatic Cleanup**: Tests clean up after themselves
- **Isolation**: Each test runs with fresh data
- **Parallel Safety**: Tests can run in parallel without conflicts

## 📊 Test Coverage

### Coverage Targets
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: 85%+ API endpoint coverage
- **E2E Tests**: 100% critical user path coverage

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## 🚨 Error Handling Tests

### API Error Scenarios
- **Authentication Failures**: Invalid tokens, expired keys
- **Validation Errors**: Missing required fields, invalid formats
- **Rate Limiting**: Exceeding API limits
- **Network Errors**: Connection timeouts, server errors

### Widget Error Scenarios
- **Component Errors**: React error boundaries
- **Network Failures**: API connection issues
- **Validation Errors**: Form validation failures
- **Payment Failures**: Payment gateway errors

## 🔒 Security Testing

### Authentication Testing
- **API Key Validation**: Proper key verification
- **OAuth Flow Security**: Authorization code security
- **Token Expiration**: Automatic token invalidation
- **Scope Enforcement**: Permission-based access control

### Webhook Security
- **Signature Verification**: HMAC-SHA256 validation
- **HTTPS Enforcement**: Secure webhook URLs only
- **Payload Validation**: Request body verification
- **Rate Limiting**: Webhook delivery throttling

## ⚡ Performance Testing

### Load Testing
- **Concurrent Requests**: Multiple simultaneous API calls
- **High Frequency**: Rapid request sequences
- **Database Performance**: Query optimization
- **Memory Usage**: Resource consumption monitoring

### Widget Performance
- **Bundle Size**: JavaScript bundle optimization
- **Load Time**: Widget initialization speed
- **Render Performance**: Component rendering efficiency
- **Memory Leaks**: Proper cleanup and garbage collection

## 🐛 Debugging Tests

### Common Issues
1. **Database Connection**: Ensure test database is running
2. **Redis Connection**: Verify Redis test instance
3. **Port Conflicts**: Check for port availability
4. **Environment Variables**: Verify test environment setup

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debug output
npm test -- --testNamePattern="should purchase tickets" --verbose

# Run tests in watch mode for development
npm run test:watch
```

### Test Logs
- **Jest**: Detailed test execution logs
- **Database**: Query execution logs
- **Redis**: Cache operation logs
- **Webhooks**: Delivery attempt logs

## 📈 Continuous Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
```

## 📚 Best Practices

### Test Organization
- **Descriptive Names**: Clear test descriptions
- **Single Responsibility**: One assertion per test
- **Setup/Teardown**: Proper test isolation
- **Mocking**: Appropriate use of mocks

### Test Data
- **Realistic Data**: Use realistic test data
- **Edge Cases**: Test boundary conditions
- **Error States**: Test failure scenarios
- **Cleanup**: Always clean up test data

### Performance
- **Parallel Execution**: Run independent tests in parallel
- **Database Optimization**: Use transactions for speed
- **Mock External Services**: Avoid real API calls in tests
- **Timeout Management**: Set appropriate timeouts

## 🔍 Monitoring and Metrics

### Test Metrics
- **Pass Rate**: Percentage of passing tests
- **Execution Time**: Test suite duration
- **Coverage**: Code coverage percentage
- **Flakiness**: Test reliability metrics

### Quality Gates
- **Minimum Coverage**: 85% code coverage required
- **No Failing Tests**: All tests must pass
- **Performance Thresholds**: Tests must complete within time limits
- **Security Checks**: Security tests must pass

---

## 📞 Support

For testing questions or issues:
1. Check this documentation first
2. Review test logs and error messages
3. Consult the main project README
4. Create an issue in the project repository

Happy Testing! 🧪✨
