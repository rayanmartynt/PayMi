# PayMi Deployment Guide

This guide covers deploying both the frontend and backend of PayMi to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring](#monitoring)

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase, Neon, Railway, or self-hosted)
- Resend API key for email services
- Domain names for frontend and backend
- Payment gateway API keys (Orange Money, Afrimoney, QMoney, Stripe)

## Backend Deployment

### Option 1: Render (Recommended)

1. **Create a Render account** at [render.com](https://render.com)

2. **Prepare your backend**
   ```bash
   cd backend
   # Ensure .env.production is configured
   # Commit your code to GitHub
   ```

3. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `backend` folder as root directory
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - Add environment variables from `.env.production`

4. **Deploy PostgreSQL on Render**
   - Create a new PostgreSQL database
   - Copy the internal database URL
   - Update `DATABASE_URL` in your backend environment variables

### Option 2: Railway

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Deploy the backend**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Add environment variables** in Railway dashboard

4. **Add PostgreSQL database**
   - Click "New Project" → "Add Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install dependencies**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm postgresql nginx
   ```

3. **Clone your repository**
   ```bash
   git clone https://github.com/your-username/PayMi.git
   cd PayMi/backend
   ```

4. **Install and configure**
   ```bash
   npm install --production
   cp .env.production .env
   # Edit .env with your production values
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Setup PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name PayMi-backend
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx as reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy from frontend directory**
   ```bash
   cd frontend
   vercel
   ```

4. **Configure environment variables**
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - `NEXT_PUBLIC_APP_URL`: Your frontend domain

5. **Set custom domain** in Vercel dashboard

### Option 2: Netlify

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Deploy**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod
   ```

3. **Configure environment variables** in Netlify dashboard

### Option 3: VPS with Nginx

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       root /path/to/PayMi/frontend/.next;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Start with PM2**
   ```bash
   cd frontend
   pm2 start npm --name PayMi-frontend -- start
   pm2 save
   ```

## Environment Variables

### Backend (.env.production)

```env
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-strong-random-secret
JWT_EXPIRE=7d

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Payment Gateways
ORANGE_MONEY_API_KEY=your_key
ORANGE_MONEY_SECRET=your_secret
AFRIMONEY_API_KEY=your_key
AFRIMONEY_SECRET=your_secret
QMONEY_API_KEY=your_key
QMONEY_SECRET=your_secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Webhooks
WEBHOOK_SECRET=your_webhook_secret
```

### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Database Setup

### Using Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string
4. Update `DATABASE_URL` in backend environment variables
5. Run migrations:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

### Using Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Update `DATABASE_URL` in backend environment variables
4. Run migrations

### Using Railway

1. Add PostgreSQL database in Railway
2. Railway automatically provides `DATABASE_URL`
3. Run migrations on deploy

## Monitoring

### Health Checks

Backend health check endpoint: `https://api.yourdomain.com/health`

### Logging

- **Backend**: Uses Morgan for HTTP logging
- **Frontend**: Vercel/Netlify provides built-in logging
- **Database**: Monitor via your database provider's dashboard

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Datadog or New Relic for APM

## Security Checklist

- [ ] Change all default secrets and API keys
- [ ] Enable HTTPS (SSL certificates)
- [ ] Set up CORS correctly
- [ ] Enable rate limiting
- [ ] Use environment variables for sensitive data
- [ ] Enable helmet.js security headers
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Webhook signature verification
- [ ] Input validation on all endpoints

## Post-Deployment

1. **Test all API endpoints**
2. **Verify email sending** (test registration flow)
3. **Test payment flows** (sandbox mode first)
4. **Set up database backups**
5. **Configure monitoring alerts**
6. **Set up SSL certificates** (Let's Encrypt recommended)
7. **Test webhook delivery**
8. **Load testing** (use k6 or Artillery)

## Troubleshooting

### Backend won't start
- Check environment variables are set
- Verify database connection
- Check logs: `pm2 logs PayMi-backend`

### Frontend build errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check environment variables

### Database connection issues
- Verify DATABASE_URL format
- Check database is accessible from your server
- Ensure SSL is configured correctly

### CORS errors
- Verify FRONTEND_URL in backend .env
- Check CORS configuration in server.js
- Ensure both domains use HTTPS

## Support

For issues or questions:
- Check the [README.md](README.md)
- Review backend [README](backend/README.md)
- Open an issue on GitHub
