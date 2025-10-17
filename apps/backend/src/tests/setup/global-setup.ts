import { testSetup } from './test-setup';

export default async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  try {
    await testSetup.setupDatabase();
    console.log('✅ Global test setup completed');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    process.exit(1);
  }
}
