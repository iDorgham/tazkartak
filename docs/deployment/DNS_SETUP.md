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
