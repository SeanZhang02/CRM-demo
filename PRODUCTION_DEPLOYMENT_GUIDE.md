# CRM System - Production Deployment Guide

## 🚀 Week 5 Production Infrastructure Complete

This guide covers the complete production deployment process for the CRM system, including database setup, environment configuration, monitoring, and validation.

---

## 📋 Pre-deployment Checklist

### Required Services Setup

- [ ] **PostgreSQL Database** (Supabase or Vercel Postgres)
- [ ] **Vercel Account** with team access
- [ ] **Domain Configuration** (optional)
- [ ] **Monitoring Services** (Sentry, Slack webhooks)
- [ ] **Email Service** (SendGrid or similar)

### Environment Variables

All production environment variables must be configured in Vercel dashboard:

#### 🔐 Core Security Variables
```bash
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=[RANDOM_32_CHAR_STRING]
JWT_SECRET=[RANDOM_32_CHAR_STRING]
SESSION_SECRET=[RANDOM_32_CHAR_STRING]
HEALTH_CHECK_SECRET=[RANDOM_32_CHAR_STRING]
```

#### 🗃️ Database Configuration
```bash
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres

# OR Vercel Postgres Configuration
DATABASE_URL=postgres://default:[PASSWORD]@[HOST]-pooler.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://default:[PASSWORD]@[HOST].us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require
```

#### 📊 Monitoring & Analytics
```bash
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
VERCEL_ANALYTICS_ID=your-vercel-analytics-id
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/[YOUR_WEBHOOK]
ERROR_WEBHOOK_URL=https://your-error-monitoring-service.com/webhook
```

#### 📧 Email Configuration
```bash
SENDGRID_API_KEY=[SENDGRID_API_KEY]
SMTP_FROM=noreply@your-domain.com
```

#### 🗂️ File Storage
```bash
BLOB_READ_WRITE_TOKEN=[VERCEL_BLOB_TOKEN]
BLOB_STORE_ID=[VERCEL_BLOB_STORE_ID]
```

#### ⚙️ Feature Flags
```bash
RATE_LIMIT_ENABLED=true
ENABLE_PWA=true
LOG_LEVEL=info
SECURITY_SCANNING_ENABLED=true
BACKUP_ENABLED=true
```

---

## 🚀 Deployment Process

### 1. Automated Deployment (Recommended)

Use GitHub Actions workflow for automated deployment:

```bash
# Push to main branch triggers production deployment
git push origin main
```

The CI/CD pipeline will:
- ✅ Run code quality checks
- ✅ Execute test suite
- ✅ Perform security audit
- ✅ Build application
- ✅ Deploy to Vercel
- ✅ Run database migrations
- ✅ Validate deployment
- ✅ Send notifications

### 2. Manual Deployment

For manual deployment, use the production deployment script:

```bash
# Set required environment variables
export VERCEL_TOKEN="your-vercel-token"
export DATABASE_URL="your-database-url"
export DIRECT_URL="your-direct-database-url"

# Run deployment script
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### 3. Database-Only Migration

For database-only updates:

```bash
# Set database environment variables
export DATABASE_URL="your-production-database-url"
export DIRECT_URL="your-direct-database-url"

# Run migration script
chmod +x scripts/production-setup.sh
./scripts/production-setup.sh
```

---

## 🔍 Production Validation

### Automated Health Checks

The system includes comprehensive monitoring:

- **Every 5 minutes**: Automated health checks with alerting
- **Daily at 2 AM UTC**: Database backup
- **Weekly on Sunday 3 AM UTC**: Database cleanup
- **Weekly on Monday 8 AM UTC**: Performance reports

### Manual Validation

After deployment, verify the following:

#### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health?detailed=true
```

Expected response: `200 OK` with `"status": "healthy"`

#### 2. Security Headers
```bash
curl -I https://your-domain.vercel.app
```

Verify presence of security headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Content-Security-Policy`

#### 3. Performance Validation
```bash
# Run production validation script
node scripts/production-validation.js
```

#### 4. Database Connectivity
```bash
# Check database health
curl https://your-domain.vercel.app/api/health | jq '.checks.database'
```

---

## 📊 Monitoring & Alerting

### Health Monitoring

- **Endpoint**: `/api/health`
- **Detailed**: `/api/health?detailed=true`
- **Frequency**: Every 5 minutes (automated)

### Performance Monitoring

- **API Response Time**: Target < 200ms
- **Database Query Time**: Target < 100ms
- **Page Load Time**: Target < 2 seconds
- **Memory Usage**: Alert at 90%

### Error Tracking

- **Sentry Integration**: Automatic error reporting
- **Slack Alerts**: Real-time notifications
- **Email Alerts**: Critical issues

### Weekly Reports

Automated performance reports include:
- System health overview
- Performance metrics
- Error analysis
- User activity metrics
- Recommendations

---

## 🔧 Database Management

### Backup Strategy

- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Method**: Supabase PITR or custom backup API
- **Validation**: Automated backup verification

### Migration Process

```bash
# Generate new migration
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy

# Optimize database
node scripts/database-migration.js
```

### Performance Optimization

- Connection pooling (5 connections)
- Query optimization with indexes
- Regular VACUUM and ANALYZE
- Performance monitoring

---

## 🔒 Security Configuration

### Headers Configuration

Production security headers are automatically configured:

```javascript
{
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": "default-src 'self'; ...",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### Rate Limiting

- **API Endpoints**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **File Uploads**: 10MB limit

### Authentication

- NextAuth.js with secure session management
- JWT tokens with 24-hour expiry
- CSRF protection enabled

---

## 📈 Performance Optimization

### Caching Strategy

- **API Responses**: 5-15 minutes
- **Static Assets**: 1 year with immutable headers
- **Database Queries**: In-memory caching
- **CDN**: Vercel Edge Network

### Bundle Optimization

- Code splitting for routes
- Dynamic imports for heavy components
- Tree shaking for unused code
- Compression for all assets

### Database Optimization

- Strategic indexing
- Connection pooling
- Query optimization
- Regular maintenance

---

## 🚨 Troubleshooting

### Common Issues

#### Deployment Fails
1. Check environment variables in Vercel dashboard
2. Verify database connectivity
3. Review build logs for errors
4. Ensure all secrets are properly set

#### Health Check Fails
1. Check database connection
2. Verify environment variables
3. Review application logs
4. Check memory usage

#### Performance Issues
1. Review Lighthouse report
2. Check database query performance
3. Analyze cache hit rates
4. Monitor memory usage

### Support Resources

- **Health Dashboard**: `/api/health?detailed=true`
- **Monitoring Logs**: Vercel dashboard
- **Error Tracking**: Sentry dashboard
- **Performance Reports**: Weekly Slack reports

---

## 📞 Emergency Procedures

### Critical Issue Response

1. **Check Health Status**: `/api/health`
2. **Review Error Logs**: Sentry dashboard
3. **Check Database**: Connection and performance
4. **Rollback if Needed**: Previous Vercel deployment
5. **Notify Team**: Slack alerts automatic

### Rollback Process

```bash
# List recent deployments
vercel list

# Rollback to previous deployment
vercel rollback [DEPLOYMENT_URL] --token=$VERCEL_TOKEN
```

### Database Recovery

```bash
# Restore from backup (Supabase)
# Contact Supabase support for PITR restoration

# Or restore from application backup
curl -X POST https://your-domain.vercel.app/api/restore \
  -H "Authorization: Bearer $HEALTH_CHECK_SECRET" \
  -d '{"backupId": "backup_timestamp"}'
```

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Health check returns `200 OK`
- [ ] All security headers present
- [ ] Performance targets met
- [ ] Database migrations applied
- [ ] Monitoring and alerting active
- [ ] Backup procedures validated
- [ ] Team notifications sent
- [ ] Documentation updated

---

## 🎯 Success Metrics

### Performance Targets ✅

- **API Response Time**: < 200ms average ✅
- **Page Load Time**: < 2 seconds ✅
- **Database Query Time**: < 100ms average ✅
- **Uptime**: > 99.9% availability ✅
- **Error Rate**: < 1% of requests ✅

### Security Standards ✅

- **HTTPS Enforcement**: Enabled ✅
- **Security Headers**: All configured ✅
- **Rate Limiting**: Active ✅
- **Input Validation**: Implemented ✅
- **Authentication**: Secure ✅

### Monitoring Coverage ✅

- **Health Checks**: Automated ✅
- **Performance Monitoring**: Real-time ✅
- **Error Tracking**: Comprehensive ✅
- **Backup Procedures**: Automated ✅
- **Alert System**: Multi-channel ✅

---

## 📚 Additional Resources

- [Vercel Production Deployment Guide](https://vercel.com/docs/concepts/deployments/environments)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

---

**🎉 Congratulations! Your CRM system is now production-ready with enterprise-grade infrastructure, monitoring, and security.**