<!-- a20a0dcb-fe08-46f5-b26b-ce397fd1a4b2 10b08811-7b9a-4664-bbfe-507e202cfa5b -->
# Production Serverless Deployment Plan

## Platform Architecture

**Backend + Databases**: Railway.app

- Express API with PostgreSQL and Redis
- Automatic SSL, scaling, and managed databases
- Built-in monitoring and logs

**Frontend**: Vercel

- React dashboard with optimized static builds
- Edge CDN for global performance
- Preview deployments for PRs

**Widget**: Vercel (separate project)

- Embeddable widget with CDN distribution
- Independent versioning and deployment

## Phase 1: Infrastructure Setup

### 1.1 Railway Configuration Files

Create `railway.json` for service configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/backend && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd apps/backend && node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Create `nixpacks.toml` for build optimization:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "postgresql"]

[phases.install]
cmds = ["npm install --production=false"]

[phases.build]
cmds = [
  "cd apps/backend",
  "npx prisma generate",
  "npm run build"
]

[start]
cmd = "cd apps/backend && npx prisma migrate deploy && node dist/index.js"
```

### 1.2 Vercel Configuration

Create `vercel.json` at root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-railway-backend.up.railway.app/api/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

Create `apps/widget/vercel.json` for widget:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, OPTIONS" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 1.3 Environment Configuration

Create `.env.production` at root for Railway:

```env
NODE_ENV=production
PORT=${{PORT}}

# Railway provides these automatically
DATABASE_URL=${{DATABASE_URL}}
REDIS_URL=${{REDIS_URL}}

# Generate strong secrets (use: openssl rand -base64 32)
JWT_SECRET=${{JWT_SECRET}}
JWT_REFRESH_SECRET=${{JWT_REFRESH_SECRET}}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS - Update with your Vercel domains
CORS_ORIGIN=${{FRONTEND_URL}}
FRONTEND_URL=${{FRONTEND_URL}}
WIDGET_URL=${{WIDGET_URL}}

# Payment Gateways - Add from environment
PAYMOB_API_KEY=${{PAYMOB_API_KEY}}
PAYMOB_INTEGRATION_ID=${{PAYMOB_INTEGRATION_ID}}
PAYMOB_IFRAME_ID=${{PAYMOB_IFRAME_ID}}
PAYMOB_HMAC_SECRET=${{PAYMOB_HMAC_SECRET}}

FAWRY_MERCHANT_CODE=${{FAWRY_MERCHANT_CODE}}
FAWRY_SECURITY_KEY=${{FAWRY_SECURITY_KEY}}
FAWRY_IS_TEST_MODE=false

# Email (Recommend: SendGrid, AWS SES, or Resend)
SMTP_HOST=${{SMTP_HOST}}
SMTP_PORT=${{SMTP_PORT}}
SMTP_USER=${{SMTP_USER}}
SMTP_PASS=${{SMTP_PASS}}
FROM_EMAIL=${{FROM_EMAIL}}

# File Storage (Recommend: AWS S3 or Cloudflare R2)
AWS_ACCESS_KEY_ID=${{AWS_ACCESS_KEY_ID}}
AWS_SECRET_ACCESS_KEY=${{AWS_SECRET_ACCESS_KEY}}
AWS_BUCKET_NAME=${{AWS_BUCKET_NAME}}
AWS_REGION=eu-west-1

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
API_DOCS_ENABLED=false
HEALTH_CHECK_ENABLED=true
LOG_LEVEL=info
```

Create `apps/frontend/.env.production`:

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WIDGET_URL=https://widget.yourdomain.com
REACT_APP_ENV=production
```

Create `apps/widget/.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_ENV=production
```

## Phase 2: CI/CD Pipeline

### 2.1 GitHub Actions for Railway Backend

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Railway

on:
  push:
    branches: [main]
    paths:
      - 'apps/backend/**'
      - 'packages/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: cd apps/backend && npm run lint
      
      - name: Run type check
        run: cd apps/backend && npm run type-check
      
      - name: Run tests
        run: cd apps/backend && npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
    
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_USER: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        run: railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 2.2 GitHub Actions for Vercel Frontend

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'apps/frontend/**'
      - '.github/workflows/deploy-frontend.yml'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: cd apps/frontend && npm run lint
      
      - name: Run type check
        run: cd apps/frontend && npm run type-check
      
      - name: Build
        run: cd apps/frontend && npm run build
        env:
          REACT_APP_API_URL: https://api.yourdomain.com

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/frontend
          vercel-args: '--prod'
```

### 2.3 GitHub Actions for Widget

Create `.github/workflows/deploy-widget.yml`:

```yaml
name: Deploy Widget to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'apps/widget/**'
      - '.github/workflows/deploy-widget.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: cd apps/widget && npm ci
      
      - name: Build
        run: cd apps/widget && npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_WIDGET_PROJECT_ID }}
          working-directory: ./apps/widget
          vercel-args: '--prod'
```

## Phase 3: Monitoring & Observability

### 3.1 Application Monitoring

Create `infrastructure/monitoring/sentry.config.ts`:

```typescript
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: true }),
      new Sentry.Integrations.Prisma({ client: prisma }),
    ],
  });
};
```

Create `infrastructure/monitoring/logger.config.ts`:

```typescript
import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN!);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new LogtailTransport(logtail),
  ],
});
```

### 3.2 Health Check Endpoint Enhancement

Update `apps/backend/src/routes/health.routes.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy',
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

### 3.3 Metrics Collection

Create `infrastructure/monitoring/metrics.ts`:

```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export { register };
```

## Phase 4: Backup & Disaster Recovery

### 4.1 Database Backup Script

Create `infrastructure/scripts/backup-database.js`:

```javascript
const { exec } = require('child_process');
const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const backupDatabase = async () => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = `/tmp/${filename}`;

  // Export database
  const command = `pg_dump ${process.env.DATABASE_URL} > ${filepath}`;
  
  exec(command, async (error) => {
    if (error) {
      console.error('Backup failed:', error);
      return;
    }

    // Upload to S3
    const fileContent = fs.readFileSync(filepath);
    await s3.putObject({
      Bucket: process.env.BACKUP_BUCKET_NAME,
      Key: `database/${filename}`,
      Body: fileContent,
    }).promise();

    // Cleanup
    fs.unlinkSync(filepath);
    console.log('Backup completed:', filename);
  });
};

backupDatabase();
```

### 4.2 GitHub Action for Scheduled Backups

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install pg aws-sdk
      
      - name: Run backup
        run: node infrastructure/scripts/backup-database.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ${{ secrets.AWS_REGION }}
          BACKUP_BUCKET_NAME: ${{ secrets.BACKUP_BUCKET_NAME }}
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Phase 5: DNS & Domain Configuration

### 5.1 DNS Configuration Guide

Create `docs/deployment/DNS_SETUP.md`:

```markdown
# DNS Configuration Guide

## Required DNS Records

### Backend API (Railway)
1. Get Railway domain from dashboard
2. Add CNAME record:
   - Name: api
   - Type: CNAME
   - Value: your-project.up.railway.app
   - TTL: 3600

### Frontend (Vercel)
1. Get Vercel domain from dashboard
2. Add A record:
   - Name: @
   - Type: A
   - Value: 76.76.21.21 (Vercel's IP)
   - TTL: 3600
3. Add CNAME for www:
   - Name: www
   - Type: CNAME
   - Value: cname.vercel-dns.com
   - TTL: 3600

### Widget (Vercel)
1. Add CNAME record:
   - Name: widget
   - Type: CNAME
   - Value: cname.vercel-dns.com
   - TTL: 3600

## SSL Certificates
- Railway: Automatic via Let's Encrypt
- Vercel: Automatic via Let's Encrypt

Verify SSL: https://www.ssllabs.com/ssltest/
```

### 5.2 Domain Verification Scripts

Create `infrastructure/scripts/verify-domains.sh`:

```bash
#!/bin/bash

echo "Verifying domain configuration..."

# Check API domain
echo "Checking api.yourdomain.com..."
curl -I https://api.yourdomain.com/health

# Check Frontend domain
echo "Checking yourdomain.com..."
curl -I https://yourdomain.com

# Check Widget domain
echo "Checking widget.yourdomain.com..."
curl -I https://widget.yourdomain.com

echo "Domain verification complete!"
```

## Phase 6: Documentation & Runbooks

### 6.1 Deployment Documentation

Create `docs/deployment/PRODUCTION_DEPLOYMENT.md`:

````markdown
# Production Deployment Guide

## Initial Setup

### 1. Railway Setup
1. Sign up at railway.app
2. Create new project
3. Add PostgreSQL plugin
4. Add Redis plugin
5. Link GitHub repository
6. Configure environment variables
7. Deploy backend service

### 2. Vercel Setup
1. Sign up at vercel.com
2. Import frontend project
3. Import widget project (separate)
4. Configure environment variables
5. Set up custom domains
6. Enable automatic deployments

### 3. Third-party Services
- Sentry: Error tracking
- Logtail: Log aggregation
- AWS S3: File storage & backups
- SendGrid/AWS SES: Email delivery

## Deployment Process

### Backend Deployment
1. Push to main branch
2. GitHub Actions runs tests
3. Railway auto-deploys on success
4. Health checks verify deployment

### Frontend Deployment
1. Push to main branch
2. Vercel builds and deploys
3. Preview URL available immediately
4. Production URL updates on success

## Rollback Procedures

### Backend Rollback
```bash
railway rollback --service backend
````

### Frontend Rollback

```bash
vercel rollback
```

## Monitoring

- Railway Dashboard: Service metrics
- Vercel Analytics: Frontend performance
- Sentry: Error tracking
- Logtail: Log analysis
````

### 6.2 Incident Response Runbook

Create `docs/deployment/INCIDENT_RESPONSE.md`:
```markdown
# Incident Response Runbook

## Service Down

### Backend API Down
1. Check Railway dashboard for service status
2. Review logs in Railway console
3. Check database connectivity
4. Verify environment variables
5. Rollback if necessary

### Database Issues
1. Check PostgreSQL metrics in Railway
2. Review connection pool settings
3. Check for long-running queries
4. Scale database if needed

### High Error Rate
1. Check Sentry for error patterns
2. Review recent deployments
3. Check external service status (PayMob, Fawry)
4. Scale services if needed

## Contact Information
- On-call engineer: [contact]
- Railway support: help@railway.app
- Vercel support: support@vercel.com
````


## Phase 7: Security Hardening

### 7.1 Security Headers Middleware

Create `apps/backend/src/middleware/security.middleware.ts`:

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true,
});
```

### 7.2 Environment Validation

Create `apps/backend/src/utils/validateEnv.ts`:

```typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PAYMOB_API_KEY',
  'FAWRY_MERCHANT_CODE',
];

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Third-party services configured
- [ ] DNS records ready
- [ ] Monitoring tools set up

### Deployment

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Widget deployed to Vercel
- [ ] Database migrations applied
- [ ] Health checks passing
- [ ] SSL certificates active

### Post-Deployment

- [ ] Smoke tests completed
- [ ] Monitoring dashboards reviewed
- [ ] Error tracking verified
- [ ] Backup jobs scheduled
- [ ] Documentation updated
- [ ] Team notified

## Estimated Costs (Monthly)

- Railway (Starter): $5/mo + usage (~$20-50)
- Vercel (Pro): $20/mo
- PostgreSQL: Included with Railway
- Redis: Included with Railway
- Sentry (Team): $26/mo
- Logtail: $19/mo
- AWS S3 (Storage): ~$5/mo
- SendGrid/SES: ~$10/mo

Total: ~$105-135/mo

### To-dos

- [ ] Create Railway configuration files (railway.json, nixpacks.toml) and configure environment variables
- [ ] Create Vercel configuration files for frontend and widget with routing and headers
- [ ] Create production environment files (.env.production) for all apps with proper variable templates
- [ ] Create GitHub Actions workflows for automated testing and deployment (backend, frontend, widget)
- [ ] Add Sentry error tracking, Logtail logging, and Prometheus metrics collection
- [ ] Update health check endpoint with database and Redis connectivity verification
- [ ] Implement automated database backup script and scheduled GitHub Action
- [ ] Implement security headers, rate limiting, and environment validation
- [ ] Write deployment guides, DNS setup instructions, and incident response runbook
- [ ] Set up DNS records and SSL certificates for api, frontend, and widget domains