# Sentry Environment Setup Guide

This guide will help you set up Sentry DSN in your environment variables for the Tazkartak project.

## 🎯 Quick Setup

### 1. Create Your Environment Files

Create the following environment files in your project root:

#### `.env.development`
```bash
# Development Environment Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tazkartak_dev

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-not-for-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-not-for-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Sentry Configuration
SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WIDGET_URL=http://localhost:3002
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
GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback

FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/oauth/facebook/callback

# Development Settings
DEBUG_MODE=true
HOT_RELOAD=true
LOG_LEVEL=debug
```

#### `.env.production`
```bash
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (Update with your production database)
DATABASE_URL=postgresql://user:password@your-production-db:5432/tazkartak_prod

# Redis Configuration (Update with your production Redis)
REDIS_URL=redis://your-production-redis:6379

# JWT Configuration (Generate secure secrets for production)
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-for-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Sentry Configuration
SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512

# Frontend Configuration (Update with your production URLs)
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WIDGET_URL=https://widget.yourdomain.com
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
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/oauth/google/callback

FACEBOOK_CLIENT_ID=your-facebook-production-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-production-client-secret
FACEBOOK_CALLBACK_URL=https://api.yourdomain.com/api/oauth/facebook/callback

# Production Settings
DEBUG_MODE=false
HOT_RELOAD=false
LOG_LEVEL=info
```

### 2. Update Your Deployment Environment Files

The following files have already been updated with Sentry configuration:

#### `infrastructure/env/frontend.env.production`
```bash
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WIDGET_URL=https://widget.yourdomain.com
REACT_APP_ENV=production
REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
```

#### `infrastructure/env/free-tier.env.production`
```bash
# Add this line to your existing free-tier.env.production file
SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
```

## 🚀 Platform-Specific Setup

### Railway (Backend Deployment)

1. Go to your Railway project dashboard
2. Navigate to the "Variables" tab
3. Add the following environment variables:

```bash
SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
NODE_ENV=production
```

### Vercel (Frontend Deployment)

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add the following environment variables:

```bash
REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
REACT_APP_ENV=production
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```

### Netlify (Alternative Frontend Deployment)

1. Go to your Netlify site dashboard
2. Navigate to "Site settings" → "Environment variables"
3. Add the following environment variables:

```bash
REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
REACT_APP_ENV=production
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```

## 🔧 Local Development Setup

### Option 1: Using .env files (Recommended)

1. Copy the `.env.development` content above into a new file called `.env` in your project root
2. Update the values according to your local setup
3. Restart your development server

### Option 2: Using environment variables directly

```bash
# Windows (PowerShell)
$env:REACT_APP_SENTRY_DSN="https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512"
$env:NODE_ENV="development"

# Windows (Command Prompt)
set REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
set NODE_ENV=development

# Linux/macOS
export REACT_APP_SENTRY_DSN="https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512"
export NODE_ENV="development"
```

## 🧪 Testing Your Setup

### 1. Verify Environment Variables

Create a simple test to verify your environment variables are loaded:

```typescript
// In your React component or service
console.log('Sentry DSN:', process.env.REACT_APP_SENTRY_DSN);
console.log('Environment:', process.env.NODE_ENV);
```

### 2. Test Sentry Integration

1. Start your development server
2. Navigate to the Admin Dashboard
3. Look for the "Sentry Integration Test" section
4. Click "Run Sentry Tests" to verify everything works
5. Check your Sentry dashboard for captured data

### 3. Check Sentry Dashboard

1. Go to [sentry.io](https://sentry.io)
2. Navigate to your project
3. Check the "Issues" tab for any captured errors
4. Check the "Performance" tab for performance data
5. Check the "Replays" tab for session recordings

## 🔒 Security Best Practices

### 1. Environment Variable Security

- **Never commit `.env` files to version control**
- Use different DSNs for development and production
- Rotate your Sentry DSN periodically
- Use environment-specific configurations

### 2. Data Privacy

- Configure data scrubbing in Sentry settings
- Remove sensitive information from error reports
- Use appropriate sampling rates
- Respect user privacy preferences

### 3. Access Control

- Limit Sentry dashboard access to authorized personnel
- Use team-based access controls
- Monitor Sentry usage and costs
- Set up appropriate alerts and notifications

## 🚨 Troubleshooting

### Common Issues

1. **Sentry not capturing errors**
   - Check if `REACT_APP_SENTRY_DSN` is set correctly
   - Verify the DSN format is valid
   - Check browser console for Sentry initialization errors
   - Ensure network connectivity to Sentry

2. **Environment variables not loading**
   - Restart your development server after adding environment variables
   - Check that variable names start with `REACT_APP_` for frontend
   - Verify the `.env` file is in the correct location
   - Check for typos in variable names

3. **Performance data not appearing**
   - Verify `tracesSampleRate` is set in Sentry configuration
   - Check `tracePropagationTargets` includes your API endpoints
   - Ensure API calls are being made to configured endpoints

### Debug Commands

```bash
# Check if environment variables are loaded
npm run start
# Then check browser console for environment variable logs

# Verify Sentry configuration
# Check browser network tab for Sentry requests
# Look for requests to *.sentry.io domains
```

## 📊 Monitoring Setup

### 1. Set Up Alerts

In your Sentry dashboard:
- Go to "Alerts" → "Create Alert Rule"
- Set up alerts for:
  - New errors
  - Error rate spikes
  - Performance degradation
  - User impact thresholds

### 2. Configure Notifications

- Set up email notifications for critical errors
- Configure Slack/Discord integrations
- Set up PagerDuty for production incidents
- Configure webhook notifications

### 3. Performance Monitoring

- Set up performance budgets
- Monitor Core Web Vitals
- Track API response times
- Monitor user experience metrics

## 🎯 Next Steps

1. **Create your environment files** using the templates above
2. **Update your deployment platforms** with the environment variables
3. **Test the integration** using the test component
4. **Set up monitoring and alerts** in your Sentry dashboard
5. **Configure data scrubbing** for production use
6. **Set up team access** and notification preferences

## 📞 Support

If you encounter any issues:

1. Check the [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
2. Review the [Tazkartak Sentry Integration Guide](./apps/frontend/SENTRY_INTEGRATION.md)
3. Check the browser console for error messages
4. Verify your environment variable configuration
5. Test with the Sentry test component in the Admin Dashboard

---

**Remember**: Always use different DSNs for development and production environments, and never commit sensitive environment variables to version control!
