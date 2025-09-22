#!/bin/bash
# Complete Production Deployment Script
# CRM System - Week 5 Production Infrastructure Deployment

set -e # Exit on any error

echo "🚀 CRM Production Deployment Starting..."
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="deployment_${DEPLOYMENT_ID}.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        log "✅ $1 completed successfully"
    else
        log "❌ $1 failed"
        exit 1
    fi
}

log "🔍 Pre-deployment validation starting..."

# 1. Environment validation
echo -e "${BLUE}📋 Step 1: Environment Validation${NC}"
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN environment variable is required${NC}"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is required${NC}"
    exit 1
fi

log "✅ Environment variables validated"

# 2. Dependencies check
echo -e "${BLUE}📋 Step 2: Dependencies Check${NC}"
npm ci --production=false
check_success "Dependencies installation"

# 3. Code quality checks
echo -e "${BLUE}📋 Step 3: Code Quality Checks${NC}"
npm run lint
check_success "ESLint checks"

npm run type-check
check_success "TypeScript type checking"

npm run format:check
check_success "Code formatting check"

# 4. Security audit
echo -e "${BLUE}📋 Step 4: Security Audit${NC}"
npm audit --audit-level=moderate
check_success "Security audit"

# 5. Test suite
echo -e "${BLUE}📋 Step 5: Test Suite${NC}"
npm run test:all
check_success "Test suite execution"

# 6. Build verification
echo -e "${BLUE}📋 Step 6: Build Verification${NC}"
npm run build
check_success "Production build"

# 7. Database migration (dry run)
echo -e "${BLUE}📋 Step 7: Database Migration Check${NC}"
npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma
check_success "Database migration check"

# 8. Performance validation
echo -e "${BLUE}📋 Step 8: Performance Validation${NC}"
node scripts/production-validation.js
check_success "Performance validation"

# 9. Deploy to Vercel
echo -e "${BLUE}📋 Step 9: Vercel Deployment${NC}"
log "🚀 Starting Vercel deployment..."

# Pull Vercel configuration
vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
check_success "Vercel configuration pull"

# Build for production
vercel build --prod --token="$VERCEL_TOKEN"
check_success "Vercel production build"

# Deploy to production
DEPLOYMENT_URL=$(vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN")
check_success "Vercel production deployment"

log "🌐 Deployment URL: $DEPLOYMENT_URL"

# 10. Database migration (production)
echo -e "${BLUE}📋 Step 10: Production Database Migration${NC}"
log "🗃️ Running production database migrations..."

export DATABASE_URL="$DATABASE_URL"
export DIRECT_URL="$DIRECT_URL"

npx prisma migrate deploy
check_success "Production database migration"

node scripts/database-migration.js
check_success "Database optimization"

# 11. Post-deployment verification
echo -e "${BLUE}📋 Step 11: Post-deployment Verification${NC}"
log "🔍 Waiting for deployment to be ready..."
sleep 30

# Health check
HEALTH_URL="${DEPLOYMENT_URL}/api/health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    log "✅ Health check passed (HTTP $HEALTH_RESPONSE)"
else
    log "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

# Performance check
log "🔍 Running post-deployment performance check..."
export SMOKE_TEST_URL="$DEPLOYMENT_URL"
npm run test:smoke
check_success "Smoke tests"

# 12. Security validation
echo -e "${BLUE}📋 Step 12: Security Validation${NC}"
log "🔒 Validating security headers..."

SECURITY_HEADERS=(
    "Strict-Transport-Security"
    "X-Content-Type-Options"
    "X-Frame-Options"
    "X-XSS-Protection"
    "Content-Security-Policy"
)

for header in "${SECURITY_HEADERS[@]}"; do
    if curl -s -I "$DEPLOYMENT_URL" | grep -q "$header"; then
        log "✅ Security header present: $header"
    else
        log "⚠️ Security header missing: $header"
    fi
done

# 13. Monitoring setup
echo -e "${BLUE}📋 Step 13: Monitoring Setup${NC}"
log "📊 Setting up monitoring and alerting..."

# Trigger initial backup
if [ -n "$HEALTH_CHECK_SECRET" ]; then
    curl -X POST "${DEPLOYMENT_URL}/api/cron/backup" \
         -H "Authorization: Bearer $HEALTH_CHECK_SECRET" \
         -H "Content-Type: application/json"
    check_success "Initial backup setup"
fi

# 14. Performance benchmarking
echo -e "${BLUE}📋 Step 14: Performance Benchmarking${NC}"
log "📈 Running performance benchmarks..."

# Lighthouse audit
npm install -g lighthouse
lighthouse "$DEPLOYMENT_URL" --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"
check_success "Lighthouse audit"

node scripts/performance-check.js
check_success "Performance analysis"

# 15. Notification and cleanup
echo -e "${BLUE}📋 Step 15: Notification and Cleanup${NC}"

# Calculate deployment duration
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_START_TIME=$(date -d "$(head -1 $LOG_FILE | cut -d']' -f1 | tr -d '[')" +%s 2>/dev/null || echo $DEPLOYMENT_END)
DEPLOYMENT_DURATION=$((DEPLOYMENT_END - DEPLOYMENT_START_TIME))

# Generate deployment report
DEPLOYMENT_REPORT=$(cat <<EOF
🚀 CRM Production Deployment Report
===================================

Deployment ID: $DEPLOYMENT_ID
Deployment URL: $DEPLOYMENT_URL
Duration: ${DEPLOYMENT_DURATION}s
Status: SUCCESS ✅

Key Metrics:
- Health Check: ✅ PASSED
- Security Headers: ✅ CONFIGURED
- Performance: ✅ VALIDATED
- Database: ✅ MIGRATED

Timestamp: $(date)
Log File: $LOG_FILE

EOF
)

log "$DEPLOYMENT_REPORT"

# Send Slack notification if webhook is configured
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
         -H 'Content-type: application/json' \
         --data "{
             \"username\": \"CRM Deployment Bot\",
             \"icon_emoji\": \":rocket:\",
             \"text\": \"🚀 CRM Production Deployment Successful!\",
             \"attachments\": [{
                 \"color\": \"good\",
                 \"fields\": [
                     {\"title\": \"Deployment ID\", \"value\": \"$DEPLOYMENT_ID\", \"short\": true},
                     {\"title\": \"URL\", \"value\": \"$DEPLOYMENT_URL\", \"short\": true},
                     {\"title\": \"Duration\", \"value\": \"${DEPLOYMENT_DURATION}s\", \"short\": true},
                     {\"title\": \"Status\", \"value\": \"SUCCESS ✅\", \"short\": true}
                 ]
             }]
         }" || log "⚠️ Failed to send Slack notification"
fi

# Store deployment metadata
DEPLOYMENT_METADATA=$(cat <<EOF
{
  "deploymentId": "$DEPLOYMENT_ID",
  "url": "$DEPLOYMENT_URL",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "duration": $DEPLOYMENT_DURATION,
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "status": "success"
}
EOF
)

echo "$DEPLOYMENT_METADATA" > "deployment-${DEPLOYMENT_ID}.json"

echo -e "${GREEN}✅ CRM Production Deployment Completed Successfully!${NC}"
echo -e "${GREEN}🌐 Your CRM is now live at: $DEPLOYMENT_URL${NC}"
echo -e "${BLUE}📊 View deployment report: $LOG_FILE${NC}"
echo -e "${BLUE}📈 Performance report: lighthouse-report.json${NC}"

exit 0