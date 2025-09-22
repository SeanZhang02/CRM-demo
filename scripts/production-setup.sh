#!/bin/bash
# Production Database Setup and Deployment Script
# CRM System - Week 5 Production Infrastructure

set -e # Exit on any error

echo "🚀 CRM Production Deployment Setup"
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment validation
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}Warning: NODE_ENV is not set to 'production'${NC}"
fi

# Check required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "DIRECT_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "JWT_SECRET"
)

echo "🔍 Validating environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required environment variables are set${NC}"

# Database setup
echo "📊 Setting up production database..."

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️ Running database migrations..."
npx prisma migrate deploy

# Verify database connection
echo "🔗 Verifying database connection..."
npx prisma db push --accept-data-loss

# Create initial pipeline stages if not exists
echo "📋 Setting up initial data..."
node scripts/seed-production.js

# Build production application
echo "🏗️ Building production application..."
npm run build

echo -e "${GREEN}✅ Production setup completed successfully!${NC}"
echo "🌐 Application ready for deployment"