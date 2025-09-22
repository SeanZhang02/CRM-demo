# CRM Development Makefile
# Simplifies common development tasks

.PHONY: help setup dev build test clean deploy

# Default target
help:
	@echo "CRM Development Commands:"
	@echo "  setup     - Initial project setup (install deps, start services, migrate DB)"
	@echo "  dev       - Start development servers (frontend + backend)"
	@echo "  build     - Build all applications for production"
	@echo "  test      - Run all tests (unit, integration, e2e)"
	@echo "  lint      - Run linting on all code"
	@echo "  clean     - Clean all build artifacts and dependencies"
	@echo "  db-reset  - Reset database with fresh migrations and seed data"
	@echo "  docker-up - Start all Docker services"
	@echo "  docker-down - Stop all Docker services"

# Initial project setup
setup:
	@echo "🚀 Setting up CRM development environment..."
	npm install
	make docker-up
	@echo "⏳ Waiting for services to be ready..."
	sleep 10
	make db-setup
	@echo "✅ Setup complete! Run 'make dev' to start development."

# Start development servers
dev:
	@echo "🔄 Starting development servers..."
	npm run dev

# Start individual services
dev-frontend:
	@echo "🎨 Starting frontend development server..."
	npm run dev:frontend

dev-backend:
	@echo "⚡ Starting backend development server..."
	npm run dev:backend

# Build for production
build:
	@echo "🏗️ Building all applications..."
	npm run build

# Run all tests
test:
	@echo "🧪 Running all tests..."
	npm run test

test-unit:
	@echo "🧪 Running unit tests..."
	npm run test:backend && npm run test:frontend

test-e2e:
	@echo "🧪 Running end-to-end tests..."
	npm run test:e2e

# Code quality
lint:
	@echo "🔍 Running linting..."
	npm run lint

type-check:
	@echo "📝 Running TypeScript type checking..."
	npm run type-check

# Database operations
db-setup:
	@echo "🗄️ Setting up database..."
	npm run db:setup

db-reset:
	@echo "🗄️ Resetting database..."
	npm run db:reset

db-studio:
	@echo "🗄️ Opening Prisma Studio..."
	npm run db:studio

# Docker operations
docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d
	@echo "⏳ Waiting for services to be healthy..."
	sleep 5

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-reset:
	@echo "🐳 Resetting Docker services..."
	docker-compose down -v
	docker-compose up -d

docker-logs:
	@echo "📋 Showing Docker logs..."
	docker-compose logs -f

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	npm run clean

clean-all: clean
	@echo "🧹 Deep cleaning (including Docker volumes)..."
	docker-compose down -v
	docker system prune -f

# Production deployment
deploy-staging:
	@echo "🚀 Deploying to staging..."
	# Add your staging deployment commands here

deploy-production:
	@echo "🚀 Deploying to production..."
	# Add your production deployment commands here

# Development utilities
install:
	@echo "📦 Installing dependencies..."
	npm install

update:
	@echo "📦 Updating dependencies..."
	npm update

# Security and maintenance
security-audit:
	@echo "🔒 Running security audit..."
	npm audit

backup-db:
	@echo "💾 Creating database backup..."
	docker exec crm-postgres pg_dump -U crm_user crm_development > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Performance testing
perf-test:
	@echo "⚡ Running performance tests..."
	# Add performance testing commands

# Mobile testing
mobile-test:
	@echo "📱 Running mobile tests..."
	# Add mobile-specific testing commands

# Agent coordination helpers
agent-status:
	@echo "🤖 Checking agent status..."
	@echo "Check TASK.md for current agent assignments and progress"

sync-agents:
	@echo "🔄 Syncing agent work..."
	@echo "Ensure all agents have latest code and documentation"