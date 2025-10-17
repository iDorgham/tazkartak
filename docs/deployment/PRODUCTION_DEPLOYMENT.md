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
```

### Frontend Rollback
```bash
vercel rollback
```

## Monitoring

- Railway Dashboard: Service metrics
- Vercel Analytics: Frontend performance
- Sentry: Error tracking
- Logtail: Log analysis
