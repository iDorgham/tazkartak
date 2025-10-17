import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export default async function globalSetup() {
  console.log('🚀 Setting up global test environment...');
  
  const db = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/1');

  try {
    // Test database connection
    await db.$connect();
    console.log('✅ Database connection established');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connection established');

    // Clean up any existing test data
    await cleanupTestData(db, redis);
    console.log('✅ Test data cleaned up');

    // Run database migrations if needed
    // await db.$executeRaw`CREATE SCHEMA IF NOT EXISTS test;`;
    
    console.log('✅ Global test setup completed');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
    await redis.disconnect();
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
    console.warn('⚠️  Warning: Failed to clean up test data:', error);
  }
}
