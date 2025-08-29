# Deployment Guide

This guide covers deploying the Program Management System to various platforms.

## Prerequisites

Before deploying, ensure you have:
- A PostgreSQL database (local or cloud)
- Environment variables configured
- The application builds successfully (`npm run build`)

## Environment Variables

Create a `.env.local` file (for local development) or set environment variables in your deployment platform:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters"

# Optional: OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: File Upload
UPLOAD_MAX_SIZE="10485760"  # 10MB in bytes
```

## Database Setup

1. **Create Database**
   ```sql
   CREATE DATABASE pms_db;
   ```

2. **Run Migrations**
   ```bash
   npx prisma db push
   ```

3. **Seed Database (Optional)**
   ```bash
   npx prisma db seed
   ```

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the easiest platform for deploying Next.js applications.

#### Steps:
1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all required environment variables

3. **Database Setup**
   - Use Vercel Postgres or external PostgreSQL service
   - Update `DATABASE_URL` in environment variables

4. **Deploy**
   - Vercel automatically deploys on git push
   - First deployment may take a few minutes

#### Vercel Configuration (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Railway

Railway provides easy deployment with built-in PostgreSQL.

#### Steps:
1. **Create Account**
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub account

2. **Deploy from GitHub**
   - Click "Deploy from GitHub"
   - Select your repository
   - Railway auto-detects Next.js

3. **Add PostgreSQL**
   - In Railway dashboard, click "Add Service"
   - Select PostgreSQL
   - Railway provides `DATABASE_URL` automatically

4. **Configure Environment Variables**
   - Add `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
   - Railway provides the domain automatically

5. **Deploy**
   - Railway automatically builds and deploys
   - Access your app via the provided URL

### 3. DigitalOcean App Platform

#### Steps:
1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```yaml
   name: pms
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: DATABASE_URL
       value: your-database-url
     - key: NEXTAUTH_URL
       value: ${APP_URL}
     - key: NEXTAUTH_SECRET
       value: your-secret
   ```

3. **Add Database**
   - Create a PostgreSQL database in DigitalOcean
   - Update `DATABASE_URL` environment variable

### 4. AWS (Advanced)

For enterprise deployments with full control.

#### Using AWS Amplify:
1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your GitHub repository

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   - Add all required environment variables in Amplify console

#### Using EC2 + RDS:
1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (ports 22, 80, 443)

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx postgresql-client
   ```

3. **Setup Application**
   ```bash
   git clone your-repo
   cd your-repo
   npm install
   npm run build
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
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

5. **Setup PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "pms" -- start
   pm2 startup
   pm2 save
   ```

## Database Providers

### 1. Supabase (Recommended)
- Free tier available
- Built-in authentication
- Real-time features
- Easy setup

```env
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
```

### 2. PlanetScale
- Serverless MySQL (compatible with PostgreSQL for most use cases)
- Branching for database schema changes
- Automatic scaling

### 3. Neon
- Serverless PostgreSQL
- Generous free tier
- Automatic scaling and branching

### 4. Railway PostgreSQL
- Integrated with Railway deployment
- Automatic backups
- Easy setup

## SSL/HTTPS Setup

### Automatic (Recommended)
Most platforms (Vercel, Railway, Netlify) provide automatic HTTPS.

### Manual (for VPS/EC2)
1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Performance Optimization

### 1. Build Optimization
```bash
# Enable experimental features in next.config.js
module.exports = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}
```

### 2. Database Optimization
- Use connection pooling
- Add database indexes
- Enable query optimization

### 3. Caching
- Enable Next.js caching
- Use CDN for static assets
- Implement Redis for session storage

## Monitoring & Logging

### 1. Application Monitoring
- Use Vercel Analytics
- Implement error tracking (Sentry)
- Monitor performance metrics

### 2. Database Monitoring
- Monitor connection pool
- Track slow queries
- Set up alerts for high usage

### 3. Logging
```javascript
// Add to your API routes
console.log('API Request:', {
  method: req.method,
  url: req.url,
  timestamp: new Date().toISOString()
});
```

## Backup Strategy

### 1. Database Backups
```bash
# Automated backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. File Backups
- Backup uploaded files to cloud storage
- Use automated backup services

### 3. Code Backups
- Use Git for version control
- Tag releases for easy rollback

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check TypeScript errors
   - Verify environment variables
   - Check dependency versions

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database exists

3. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches deployment URL
   - Ensure OAuth credentials are correct

4. **File Upload Issues**
   - Check file permissions
   - Verify upload directory exists
   - Check file size limits

### Debugging Commands:
```bash
# Check build logs
npm run build

# Test database connection
npx prisma db pull

# Verify environment variables
printenv | grep DATABASE_URL
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure environment variables
- [ ] Enable CORS properly
- [ ] Use strong database passwords
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use secure session configuration

## Post-Deployment

1. **Test All Features**
   - User registration/login
   - Program creation and management
   - File uploads
   - Approval workflows
   - Payment tracking

2. **Monitor Performance**
   - Page load times
   - API response times
   - Database query performance

3. **Set Up Alerts**
   - Error rate monitoring
   - Performance degradation
   - Database connection issues

4. **Documentation**
   - Update API documentation
   - Create user guides
   - Document deployment process
