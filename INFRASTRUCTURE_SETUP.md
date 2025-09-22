# 🏗️ Production Infrastructure Setup Guide

## 📋 Overview

This document provides comprehensive setup instructions for the production-ready infrastructure of the Desktop CRM MVP. The infrastructure is designed for **99.9% uptime**, **<2s page loads**, and **enterprise-grade security**.

## 🚀 Quick Start Deployment

### Prerequisites
- GitHub account with repository
- Vercel account (free tier sufficient for MVP)
- Supabase account (free tier sufficient for MVP)
- Node.js 18.17.0+ installed locally

### 1. Database Setup (Supabase)

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Click "New Project"
   # Choose organization and set project details
   ```

2. **Get Database Credentials**
   ```bash
   # Go to Project Settings > Database
   # Copy the connection string
   # Note: Use "connection pooling" string for production
   ```

3. **Configure Environment Variables**
   ```bash
   # Copy .env.production.example to .env.production
   cp .env.production.example .env.production

   # Update with your Supabase credentials:
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
   ```

### 2. Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and connect project
   vercel login
   vercel --confirm
   ```

2. **Configure Environment Variables in Vercel**
   ```bash
   # Add environment variables via Vercel dashboard:
   # Project Settings > Environment Variables

   # Required variables:
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   NEXTAUTH_SECRET=generate-random-32-char-string
   NEXTAUTH_URL=https://your-domain.vercel.app
   JWT_SECRET=generate-random-32-char-string
   HEALTH_CHECK_SECRET=generate-random-string
   ```

3. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   ```

### 3. GitHub Actions Setup

1. **Add Repository Secrets**
   ```bash
   # GitHub Repository > Settings > Secrets and Variables > Actions

   # Required secrets:
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-org-id
   VERCEL_PROJECT_ID=your-project-id
   CODECOV_TOKEN=your-codecov-token (optional)
   ```

2. **Enable Actions**
   ```bash
   # Actions will run automatically on push to main branch
   # Check .github/workflows/ci.yml for full pipeline
   ```

## 🔧 Detailed Configuration

### Database Configuration

#### Connection Pooling
```typescript
// Optimized for Supabase + Vercel
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

// For migrations and schema changes
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
```

#### Performance Settings
- **Connection Limit**: 1 per serverless function
- **Pool Timeout**: 30 seconds
- **Query Timeout**: 30 seconds
- **Connection Pooling**: Enabled via PgBouncer

### Security Configuration

#### Security Headers
Automatically applied via `middleware.ts`:
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=31536000
- **Content-Security-Policy**: Comprehensive CSP
- **Referrer-Policy**: strict-origin-when-cross-origin

#### Rate Limiting
```typescript
// Configuration in lib/security/rate-limit.ts
const RATE_LIMITS = {
  api: 100 requests/15min,
  auth: 5 requests/15min,
  health: 30 requests/1min,
  upload: 10 requests/1hour
}
```

#### CORS Policy
```typescript
// Allowed origins (configurable)
const allowedOrigins = [
  process.env.NEXTAUTH_URL,
  'https://*.vercel.app',
  'http://localhost:3000' // development only
]
```

### Monitoring & Observability

#### Health Checks
- **Endpoint**: `/api/health`
- **Authentication**: Bearer token (production)
- **Metrics**: Database latency, memory usage, uptime
- **Frequency**: Every 5 minutes (via cron)

#### Performance Monitoring
- **Sentry Integration**: Error tracking and performance
- **Vercel Analytics**: User experience metrics
- **Custom Metrics**: Business KPIs and system health

#### Logging
```typescript
// Production logging levels
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false
ENABLE_PERFORMANCE_LOGGING=true
```

## 📊 Performance Targets

### Response Time Targets
- **Page Loads**: <2 seconds
- **API Endpoints**: <200ms
- **Database Queries**: <100ms
- **Health Checks**: <50ms

### Availability Targets
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Error Rate**: <1%
- **Recovery Time**: <5 minutes

### Scalability Targets
- **Concurrent Users**: 1,000+
- **Database Records**: 100,000+
- **Storage**: 10GB+ files
- **API Throughput**: 1,000 req/min

## 🔍 Monitoring & Alerting

### Health Check Endpoints

#### `/api/health`
```json
{
  "status": "healthy|degraded|critical",
  "timestamp": "2024-01-20T10:00:00Z",
  "metrics": {
    "responseTime": 45,
    "databaseLatency": 23,
    "memoryUsage": { "used": 128, "total": 512 }
  },
  "components": {
    "database": { "status": "healthy", "latency": 23 },
    "api": { "status": "healthy", "responseTime": 45 }
  }
}
```

#### `/api/monitoring/metrics`
Detailed system metrics for monitoring dashboards.

### Automated Monitoring
- **Uptime Monitoring**: Vercel + external monitors
- **Error Tracking**: Sentry integration
- **Performance Alerts**: Automated via GitHub Actions
- **Log Aggregation**: Vercel Functions logs

### Alert Conditions
- Database latency >200ms
- API response time >2s
- Memory usage >80%
- Error rate >5%
- Uptime <99%

## 🧪 Testing Infrastructure

### Manual Testing
```bash
# Run infrastructure tests
node scripts/test-infrastructure.js

# Test specific components
npm run test:health
npm run test:security
npm run test:performance
```

### Automated Testing
- **CI/CD Pipeline**: Full test suite on every commit
- **Quality Gates**: 80% test coverage required
- **Security Scanning**: Automated vulnerability checks
- **Performance Testing**: Lighthouse CI integration

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run tests/load-test.yml
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection string format
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Verify Supabase project is active
# Check IP restrictions in Supabase dashboard
```

#### Deployment Failures
```bash
# Check build logs in Vercel dashboard
# Verify environment variables are set
# Ensure Prisma client is generated: npx prisma generate
```

#### Performance Issues
```bash
# Check health endpoint: curl https://your-app.vercel.app/api/health
# Monitor database performance in Supabase dashboard
# Review Vercel function logs
```

#### Security Alerts
```bash
# Check GitHub security alerts
# Review Sentry error reports
# Validate rate limiting: curl -I https://your-app.vercel.app/api/health
```

### Emergency Procedures

#### Database Issues
1. Check Supabase status page
2. Verify connection pooling settings
3. Scale up database if needed
4. Contact Supabase support

#### Application Down
1. Check Vercel deployment status
2. Review function logs
3. Rollback to previous deployment if needed
4. Monitor recovery via health checks

#### Security Breach
1. Rotate all secrets immediately
2. Check Sentry for suspicious activity
3. Review access logs
4. Update security configurations

## 📈 Scaling Considerations

### Database Scaling
- **Read Replicas**: For reporting queries
- **Connection Pooling**: Optimize pool size
- **Query Optimization**: Index frequently queried columns
- **Archival Strategy**: Move old data to separate tables

### Application Scaling
- **Vercel Pro**: For higher limits and edge regions
- **CDN**: For static assets and images
- **Background Jobs**: Queue system for heavy processing
- **Caching**: Redis for session and query caching

### Monitoring Scaling
- **APM Tools**: Detailed application monitoring
- **Log Management**: Centralized log aggregation
- **Alerting**: PagerDuty or similar for 24/7 monitoring
- **Dashboards**: Grafana for comprehensive metrics

## 💰 Cost Optimization

### Current Costs (MVP)
- **Vercel**: $0/month (Hobby plan)
- **Supabase**: $0/month (Free tier)
- **GitHub**: $0/month (Actions included)
- **Sentry**: $0/month (Developer plan)
- **Total**: $0/month for MVP

### Scaling Costs
- **Vercel Pro**: $20/month (recommended for production)
- **Supabase Pro**: $25/month (for higher limits)
- **Sentry Team**: $26/month (for team features)
- **Total**: ~$71/month for production scale

### Cost Monitoring
- Set up billing alerts
- Monitor usage dashboards
- Optimize based on actual usage patterns
- Consider reserved capacity for predictable workloads

## 🔄 Maintenance Procedures

### Weekly Tasks
- Review performance metrics
- Check security alerts
- Update dependencies
- Backup verification

### Monthly Tasks
- Security audit
- Performance optimization
- Cost review
- Documentation updates

### Quarterly Tasks
- Disaster recovery testing
- Security penetration testing
- Architecture review
- Scaling assessment

## 📚 Additional Resources

### Documentation Links
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Monitoring Tools
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry](https://sentry.io)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub Actions](https://github.com/features/actions)

### Support Contacts
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com
- **GitHub Support**: support@github.com

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] Security headers validated
- [ ] Performance tests passed
- [ ] Monitoring configured

### Post-Deployment
- [ ] Health check responding
- [ ] All endpoints functional
- [ ] Monitoring alerts configured
- [ ] Backup systems tested
- [ ] Documentation updated

### Production Readiness
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Disaster recovery tested
- [ ] Team access configured
- [ ] Runbook documentation complete

---

**🎉 Congratulations! Your production infrastructure is now ready for the 6-week CRM MVP development cycle.**