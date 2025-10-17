import { testSetup } from './test-setup';

// Setup before each test
beforeEach(async () => {
  await testSetup.cleanup();
});

// Cleanup after each test
afterEach(async () => {
  await testSetup.cleanup();
});

// Global test timeout
jest.setTimeout(30000);
