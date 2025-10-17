import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export default async function globalTeardown() {
  console.log('🧹 Tearing down global test environment...');
  
  const db = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/1');

  try {
    // Clean up test data
    await cleanupTestData(db, redis);
    console.log('✅ Test data cleaned up');

    // Close connections
    await db.$disconnect();
    await redis.disconnect();
    console.log('✅ Database and Redis connections closed');

    console.log('✅ Global test teardown completed');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

async function cleanupTestData(db: PrismaClient, redis: Redis) {
  try {
    // Delete all test data in correct order (respecting foreign key constraints)
    await db.webhookLog.deleteMany();
    await db.webhook.deleteMany();
    await db.accessToken.deleteMany();
    await db.authorizationCode.deleteMany();
    await db.oAuthClient.deleteMany();
    await db.apiKey.deleteMany();
    await db.ticket.deleteMany();
    await db.ticketType.deleteMany();
    await db.event.deleteMany();
    await db.user.deleteMany();
    
    // Clear Redis test database
    await redis.flushdb();
  } catch (error) {
    console.warn('⚠️  Warning: Failed to clean up test data during teardown:', error);
  }
}
