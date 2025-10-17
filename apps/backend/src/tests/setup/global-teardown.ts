import { testSetup } from './test-setup';

export default async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  try {
    await testSetup.disconnect();
    console.log('✅ Global test teardown completed');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
  }
}
