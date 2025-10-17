import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  API_URL: process.env.API_URL || 'http://localhost:3000/api',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  WIDGET_URL: process.env.WIDGET_URL || 'http://localhost:3002',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/tazkartak',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),

  // Payment Gateways
  PAYMOB_API_KEY: process.env.PAYMOB_API_KEY || '',
  PAYMOB_INTEGRATION_ID: process.env.PAYMOB_INTEGRATION_ID || '',
  PAYMOB_IFRAME_ID: process.env.PAYMOB_IFRAME_ID || '',
  PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET || '',

  FAWRY_MERCHANT_CODE: process.env.FAWRY_MERCHANT_CODE || '',
  FAWRY_SECURITY_KEY: process.env.FAWRY_SECURITY_KEY || '',
  FAWRY_IS_TEST_MODE: process.env.FAWRY_IS_TEST_MODE === 'true',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@tazkartak.com',

  // SMS
  SMS_API_KEY: process.env.SMS_API_KEY || '',
  SMS_SENDER_ID: process.env.SMS_SENDER_ID || 'Tazkartak',

  // File Storage
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || '',
  AWS_REGION: process.env.AWS_REGION || 'eu-west-1',

  // Security
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',

  // QR Code
  QR_CODE_SECRET: process.env.QR_CODE_SECRET || 'your-qr-code-secret',

  // Webhook
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'your-webhook-secret',

  // Subscription Packages
  BASIC_PRICE: parseInt(process.env.BASIC_PRICE || '299'),
  PRO_PRICE: parseInt(process.env.PRO_PRICE || '799'),
  ENTERPRISE_PRICE: parseInt(process.env.ENTERPRISE_PRICE || '1999'),
};

export const appConfig = {
  ...config,
  payment: {
    paymob: {
      apiKey: config.PAYMOB_API_KEY,
      integrationId: parseInt(config.PAYMOB_INTEGRATION_ID || '0'),
      iframeId: parseInt(config.PAYMOB_IFRAME_ID || '0'),
      hmacSecret: config.PAYMOB_HMAC_SECRET,
    },
    fawry: {
      merchantCode: config.FAWRY_MERCHANT_CODE,
      merchantSecureKey: config.FAWRY_SECURITY_KEY,
      isTestMode: config.FAWRY_IS_TEST_MODE,
      baseURL: config.FAWRY_IS_TEST_MODE 
        ? 'https://atfawry.fawrystaging.com' 
        : 'https://www.atfawry.com',
    },
  },
};
