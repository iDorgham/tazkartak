import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { validationMiddleware } from './middleware/validation.middleware';
import { setupSwagger } from './config/swagger.config';

// Import routes
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import ticketsRoutes from './routes/tickets.routes';
import paymentsRoutes from './routes/payments.routes';
import usersRoutes from './routes/users.routes';
import venuesRoutes from './routes/venues.routes';
import qrRoutes from './routes/qr.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import analyticsRoutes from './routes/analytics.routes';
import webhooksRoutes from './routes/webhooks.routes';
import publicRoutes from './routes/public.routes';
import apiKeysRoutes from './routes/apiKeys.routes';
import widgetConfigRoutes from './routes/widgetConfig.routes';
import oauthRoutes from './routes/oauth.routes';

// Load environment variables
dotenv.config();

const app: express.Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    };

    // Check database connectivity
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      healthStatus.services.database = 'connected';
    } catch (dbError) {
      healthStatus.services.database = 'disconnected';
      healthStatus.status = 'ERROR';
    }

    // Check Redis connectivity
    try {
      const { createClient } = await import('redis');
      const redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await redis.connect();
      await redis.ping();
      await redis.disconnect();
      healthStatus.services.redis = 'connected';
    } catch (redisError) {
      healthStatus.services.redis = 'disconnected';
      healthStatus.status = 'ERROR';
    }

    const statusCode = healthStatus.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', authMiddleware, eventsRoutes);
app.use('/api/tickets', authMiddleware, ticketsRoutes);
app.use('/api/payments', authMiddleware, paymentsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/venues', authMiddleware, venuesRoutes);
app.use('/api/qr', authMiddleware, qrRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Public API routes (require API key authentication)
app.use('/api/public', publicRoutes);

// API key management routes
app.use('/api/api-keys', authMiddleware, apiKeysRoutes);

// Widget configuration routes
app.use('/api/widget-config', widgetConfigRoutes);

// OAuth routes
app.use('/api/oauth', oauthRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
