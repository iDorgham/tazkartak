# Vercel Deployment Guide for Tazkartak

This guide will help you deploy your Tazkartak project to Vercel with Sentry integration.

## 🚀 Quick Deployment Steps

### 1. Deploy Frontend

```bash
# Navigate to frontend directory
cd apps/frontend

# Deploy to Vercel
vercel --prod
```

**Configuration Options:**
- **Project Name**: `tazkartak-frontend` (or your preferred name)
- **Framework**: `Create React App`
- **Root Directory**: `./` (current directory)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 2. Deploy Widget

```bash
# Navigate to widget directory
cd ../widget

# Deploy to Vercel
vercel --prod
```

**Configuration Options:**
- **Project Name**: `tazkartak-widget` (or your preferred name)
- **Framework**: `Vite`
- **Root Directory**: `./` (current directory)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔧 Environment Variables Setup

### Frontend Environment Variables

In your Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```bash
# Required Environment Variables
REACT_APP_API_URL=https://your-railway-backend.up.railway.app
REACT_APP_WIDGET_URL=https://your-widget.vercel.app
REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
REACT_APP_ENV=production

# Optional Environment Variables
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_FACEBOOK_CLIENT_ID=your-facebook-client-id
```

### Widget Environment Variables

```bash
# Required Environment Variables
VITE_API_URL=https://your-railway-backend.up.railway.app
VITE_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
VITE_ENV=production
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Logged in to Vercel (`vercel login`)
- [ ] Backend deployed to Railway
- [ ] Environment variables prepared
- [ ] Sentry DSN configured

### Frontend Deployment
- [ ] Navigate to `apps/frontend`
- [ ] Run `vercel --prod`
- [ ] Configure project settings
- [ ] Set environment variables in Vercel dashboard
- [ ] Test deployment

### Widget Deployment
- [ ] Navigate to `apps/widget`
- [ ] Run `vercel --prod`
- [ ] Configure project settings
- [ ] Set environment variables in Vercel dashboard
- [ ] Test deployment

### Post-Deployment
- [ ] Update backend CORS settings with new frontend URL
- [ ] Test Sentry integration
- [ ] Verify all features work
- [ ] Set up custom domains (optional)

## 🎯 Step-by-Step Deployment

### Step 1: Deploy Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd apps/frontend
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Answer the configuration questions:**
   - **Set up and deploy?** → `Y`
   - **Which scope?** → Select your account/team
   - **Link to existing project?** → `N` (for first deployment)
   - **Project name:** → `tazkartak-frontend`
   - **In which directory is your code located?** → `./`
   - **Want to override settings?** → `Y`
   - **Build Command:** → `npm run build`
   - **Output Directory:** → `build`
   - **Install Command:** → `npm install`

4. **Set environment variables in Vercel dashboard:**
   - Go to your project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add the environment variables listed above

### Step 2: Deploy Widget

1. **Navigate to widget directory:**
   ```bash
   cd ../widget
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Answer the configuration questions:**
   - **Set up and deploy?** → `Y`
   - **Which scope?** → Select your account/team
   - **Link to existing project?** → `N` (for first deployment)
   - **Project name:** → `tazkartak-widget`
   - **In which directory is your code located?** → `./`
   - **Want to override settings?** → `Y`
   - **Build Command:** → `npm run build`
   - **Output Directory:** → `dist`
   - **Install Command:** → `npm install`

4. **Set environment variables in Vercel dashboard:**
   - Go to your widget project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add the widget environment variables listed above

## 🔗 Configuration Files

### Frontend Vercel Configuration

The `vercel.json` in your project root is configured for the frontend:

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
    "NODE_ENV": "production",
    "REACT_APP_SENTRY_DSN": "https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512",
    "REACT_APP_ENV": "production"
  }
}
```

### Widget Vercel Configuration

The `apps/widget/vercel.json` is configured for the widget:

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
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🧪 Testing Your Deployment

### 1. Test Frontend
- Visit your frontend URL
- Check if the app loads correctly
- Test navigation and features
- Check browser console for errors
- Verify Sentry integration

### 2. Test Widget
- Visit your widget URL
- Test widget functionality
- Check if it loads in iframe
- Verify API connections
- Test Sentry integration

### 3. Test Sentry Integration
- Navigate to Admin Dashboard
- Use the Sentry test button
- Check your Sentry dashboard for data
- Verify error tracking works

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check if all dependencies are installed
   - Verify build commands are correct
   - Check for TypeScript errors
   - Ensure environment variables are set

2. **Environment Variables Not Loading**
   - Verify variables are set in Vercel dashboard
   - Check variable names (must start with `REACT_APP_` for frontend)
   - Redeploy after adding variables
   - Check for typos in variable names

3. **API Connection Issues**
   - Verify backend URL is correct
   - Check CORS settings on backend
   - Ensure backend is deployed and running
   - Check network tab in browser dev tools

4. **Sentry Not Working**
   - Verify `REACT_APP_SENTRY_DSN` is set
   - Check browser console for Sentry errors
   - Verify DSN format is correct
   - Check Sentry dashboard for data

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Check environment variables
vercel env ls

# Redeploy with debug info
vercel --prod --debug
```

## 🌐 Custom Domain Setup

### 1. Add Custom Domain
- Go to your Vercel project dashboard
- Navigate to **Settings** → **Domains**
- Add your custom domain
- Follow DNS configuration instructions

### 2. Update Environment Variables
- Update `REACT_APP_API_URL` with your custom domain
- Update backend CORS settings
- Redeploy both frontend and backend

## 📊 Monitoring and Analytics

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance metrics
- Track user behavior
- Set up alerts

### Sentry Monitoring
- Monitor errors and performance
- Set up alerts for critical issues
- Track user sessions
- Analyze performance trends

## 🚀 Production Optimization

### Performance
- Enable Vercel Edge Functions
- Use Vercel Image Optimization
- Configure caching headers
- Optimize bundle size

### Security
- Enable Vercel Security Headers
- Configure CSP (Content Security Policy)
- Use HTTPS only
- Set up rate limiting

### SEO
- Configure meta tags
- Set up sitemap
- Enable Vercel Analytics
- Optimize Core Web Vitals

## 📞 Support

If you encounter issues:

1. Check Vercel documentation: https://vercel.com/docs
2. Review deployment logs in Vercel dashboard
3. Check browser console for errors
4. Verify environment variables are set correctly
5. Test locally before deploying

---

**Ready to deploy?** Run the commands above and follow the interactive prompts!
