#!/usr/bin/env node

/**
 * Sentry Environment Setup Script
 * 
 * This script helps you set up Sentry environment variables for your Tazkartak project.
 * Run this script to create environment files with the correct Sentry DSN.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SENTRY_DSN = 'https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 Tazkartak Sentry Environment Setup');
  console.log('=====================================\n');

  try {
    // Check if .env files already exist
    const envFiles = ['.env', '.env.development', '.env.production'];
    const existingFiles = envFiles.filter(file => fs.existsSync(file));
    
    if (existingFiles.length > 0) {
      console.log('⚠️  Found existing environment files:', existingFiles.join(', '));
      const overwrite = await question('Do you want to overwrite them? (y/N): ');
      
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ Setup cancelled. No files were modified.');
        rl.close();
        return;
      }
    }

    // Get environment type
    console.log('\n📋 Environment Setup Options:');
    console.log('1. Development only');
    console.log('2. Production only');
    console.log('3. Both development and production');
    
    const choice = await question('\nSelect option (1-3): ');
    
    let createDev = false;
    let createProd = false;
    
    switch (choice) {
      case '1':
        createDev = true;
        break;
      case '2':
        createProd = true;
        break;
      case '3':
        createDev = true;
        createProd = true;
        break;
      default:
        console.log('❌ Invalid choice. Setup cancelled.');
        rl.close();
        return;
    }

    // Get additional configuration
    const apiUrl = await question('\n🌐 Enter your API URL (default: http://localhost:3000): ') || 'http://localhost:3000';
    const widgetUrl = await question('🎨 Enter your Widget URL (default: http://localhost:3002): ') || 'http://localhost:3002';
    const databaseUrl = await question('🗄️  Enter your Database URL (default: postgresql://postgres:postgres@localhost:5432/tazkartak): ') || 'postgresql://postgres:postgres@localhost:5432/tazkartak';

    // Create development environment file
    if (createDev) {
      const devEnv = `# Development Environment Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Database Configuration
DATABASE_URL=${databaseUrl}

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-not-for-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-not-for-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Sentry Configuration
SENTRY_DSN=${SENTRY_DSN}
REACT_APP_SENTRY_DSN=${SENTRY_DSN}

# Frontend Configuration
REACT_APP_API_URL=${apiUrl}
REACT_APP_WIDGET_URL=${widgetUrl}
REACT_APP_ENV=development

# Email Configuration (Development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@tazkartak.com
FROM_NAME=Tazkartak

# Payment Gateway (Development - Use test keys)
PAYMOB_API_KEY=your-paymob-test-api-key
PAYMOB_INTEGRATION_ID=your-paymob-test-integration-id
PAYMOB_IFRAME_ID=your-paymob-test-iframe-id
PAYMOB_HMAC_SECRET=your-paymob-test-hmac-secret

FAWRY_MERCHANT_CODE=your-fawry-test-merchant-code
FAWRY_SECURITY_KEY=your-fawry-test-security-key
FAWRY_MERCHANT_REF_NUM=your-fawry-test-merchant-ref-num

# OAuth Configuration (Development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=${apiUrl}/api/oauth/google/callback

FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_CALLBACK_URL=${apiUrl}/api/oauth/facebook/callback

# Development Settings
DEBUG_MODE=true
HOT_RELOAD=true
LOG_LEVEL=debug
`;

      fs.writeFileSync('.env.development', devEnv);
      console.log('✅ Created .env.development');
    }

    // Create production environment file
    if (createProd) {
      const prodApiUrl = await question('\n🌐 Enter your production API URL: ');
      const prodWidgetUrl = await question('🎨 Enter your production Widget URL: ');
      const prodDatabaseUrl = await question('🗄️  Enter your production Database URL: ');

      const prodEnv = `# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=${prodDatabaseUrl}

# Redis Configuration
REDIS_URL=redis://your-production-redis:6379

# JWT Configuration (Generate secure secrets for production)
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-for-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Sentry Configuration
SENTRY_DSN=${SENTRY_DSN}
REACT_APP_SENTRY_DSN=${SENTRY_DSN}

# Frontend Configuration
REACT_APP_API_URL=${prodApiUrl}
REACT_APP_WIDGET_URL=${prodWidgetUrl}
REACT_APP_ENV=production

# Email Configuration (Production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-production-app-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Tazkartak

# Payment Gateway (Production - Use live keys)
PAYMOB_API_KEY=your-paymob-live-api-key
PAYMOB_INTEGRATION_ID=your-paymob-live-integration-id
PAYMOB_IFRAME_ID=your-paymob-live-iframe-id
PAYMOB_HMAC_SECRET=your-paymob-live-hmac-secret

FAWRY_MERCHANT_CODE=your-fawry-live-merchant-code
FAWRY_SECURITY_KEY=your-fawry-live-security-key
FAWRY_MERCHANT_REF_NUM=your-fawry-live-merchant-ref-num

# OAuth Configuration (Production)
GOOGLE_CLIENT_ID=your-google-production-client-id
GOOGLE_CLIENT_SECRET=your-google-production-client-secret
GOOGLE_CALLBACK_URL=${prodApiUrl}/api/oauth/google/callback

FACEBOOK_CLIENT_ID=your-facebook-production-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-production-client-secret
FACEBOOK_CALLBACK_URL=${prodApiUrl}/api/oauth/facebook/callback

# Production Settings
DEBUG_MODE=false
HOT_RELOAD=false
LOG_LEVEL=info
`;

      fs.writeFileSync('.env.production', prodEnv);
      console.log('✅ Created .env.production');
    }

    // Create .env file for current environment
    const currentEnv = createDev ? '.env.development' : '.env.production';
    if (fs.existsSync(currentEnv)) {
      fs.copyFileSync(currentEnv, '.env');
      console.log('✅ Created .env (copied from ' + currentEnv + ')');
    }

    console.log('\n🎉 Environment setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update the placeholder values in your .env files');
    console.log('2. Restart your development server');
    console.log('3. Test Sentry integration using the test button in Admin Dashboard');
    console.log('4. Check your Sentry dashboard for captured data');
    
    console.log('\n🔗 Useful links:');
    console.log('- Sentry Dashboard: https://sentry.io');
    console.log('- Integration Guide: ./SENTRY_ENVIRONMENT_SETUP.md');
    console.log('- Frontend Integration: ./apps/frontend/SENTRY_INTEGRATION.md');

  } catch (error) {
    console.error('❌ Error setting up environment:', error.message);
  } finally {
    rl.close();
  }
}

// Run the setup
setupEnvironment();
