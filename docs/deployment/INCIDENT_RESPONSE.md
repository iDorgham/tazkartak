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
