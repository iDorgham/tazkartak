# Quick Start - Free Tier Deployment

## 🚀 Deploy in 30 Minutes for ~$5/month

### Step 1: Create Accounts (5 minutes)

1. **Railway** (Backend + Database)
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create new project

2. **Vercel** (Frontend + Widget)
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Import your repository

3. **Sentry** (Error Tracking)
   - Go to [sentry.io](https://sentry.io)
   - Sign up with GitHub
   - Create Node.js project
   - Copy DSN

### Step 2: Configure Railway (10 minutes)

1. **Add Services**
   - Add PostgreSQL plugin
   - Add Redis plugin
   - Connect GitHub repository

2. **Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-jwt-secret-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   SENTRY_DSN=your-sentry-dsn-here
   PAYMOB_API_KEY=your-paymob-key
   FAWRY_MERCHANT_CODE=your-fawry-code
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=noreply@yourdomain.com
   ```

3. **Deploy**
   - Railway will auto-deploy from your GitHub repo
   - Get your Railway URL (e.g., `https://your-app.up.railway.app`)

### Step 3: Configure Vercel (10 minutes)

1. **Frontend Project**
   - Import `apps/frontend` as separate project
   - Environment variables:
     ```env
     REACT_APP_API_URL=https://your-app.up.railway.app
     REACT_APP_WIDGET_URL=https://your-widget.vercel.app
     ```

2. **Widget Project**
   - Import `apps/widget` as separate project
   - Environment variables:
     ```env
     VITE_API_URL=https://your-app.up.railway.app
     ```

3. **Deploy**
   - Vercel will auto-deploy from your GitHub repo
   - Get your Vercel URLs

### Step 4: Configure DNS (5 minutes)

1. **API Domain** (Optional)
   - Add CNAME: `api.yourdomain.com` → `your-app.up.railway.app`

2. **Frontend Domain** (Optional)
   - Add A record: `yourdomain.com` → Vercel IP
   - Add CNAME: `www.yourdomain.com` → `cname.vercel-dns.com`

3. **Widget Domain** (Optional)
   - Add CNAME: `widget.yourdomain.com` → `cname.vercel-dns.com`

### Step 5: Test Deployment

1. **Health Check**
   ```bash
   curl https://your-app.up.railway.app/health
   ```

2. **Frontend**
   - Visit your Vercel frontend URL
   - Test login/registration

3. **Widget**
   - Visit your Vercel widget URL
   - Test widget functionality

## 🎉 You're Live!

### URLs
- **Backend API**: `https://your-app.up.railway.app`
- **Frontend**: `https://your-frontend.vercel.app`
- **Widget**: `https://your-widget.vercel.app`

### Monitoring
- **Railway Dashboard**: Service metrics and logs
- **Vercel Dashboard**: Frontend analytics
- **Sentry Dashboard**: Error tracking

### Costs
- **Railway**: $5/month (covers small apps)
- **Vercel**: FREE
- **Sentry**: FREE (5,000 errors/month)
- **Total**: ~$5/month

## 🔧 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Railway logs
   - Verify environment variables
   - Check database connection

2. **Frontend Can't Connect to API**
   - Verify `REACT_APP_API_URL` in Vercel
   - Check CORS settings
   - Verify Railway URL

3. **Database Connection Issues**
   - Check `DATABASE_URL` in Railway
   - Verify PostgreSQL plugin is running
   - Check database migrations

### Getting Help

1. **Railway Support**: [help.railway.app](https://help.railway.app)
2. **Vercel Support**: [vercel.com/help](https://vercel.com/help)
3. **Sentry Support**: [sentry.io/support](https://sentry.io/support)

## 📈 Scaling Up

When you need more resources:

1. **Railway Pro** ($20/month)
   - More CPU/RAM
   - Higher limits
   - Priority support

2. **Vercel Pro** ($20/month)
   - More bandwidth
   - Team features
   - Advanced analytics

3. **Sentry Team** ($26/month)
   - More errors
   - Team features
   - Advanced features

## 🔒 Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] Secure payment gateway keys
- [ ] Valid email configuration
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SSL certificates active
- [ ] Environment variables secured

## 📊 Monitoring Checklist

- [ ] Health checks responding
- [ ] Error tracking active
- [ ] Logs accessible
- [ ] Performance metrics visible
- [ ] Backup system working
- [ ] Uptime monitoring active

## 🎯 Next Steps

1. **Set up monitoring alerts**
2. **Configure custom domains**
3. **Set up automated backups**
4. **Add performance monitoring**
5. **Set up staging environment**
6. **Implement CI/CD pipeline**

Your production deployment is now live and ready for users! 🚀

