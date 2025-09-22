/**
 * Global Jest Setup
 * Initializes test environment and database connection
 */

const { execSync } = require('child_process')

module.exports = async () => {
  console.log('🚀 Starting global test setup...')

  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/crm_test'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'

  try {
    // Ensure test database is set up
    console.log('📊 Setting up test database...')

    // Create test database if it doesn't exist
    execSync('npx prisma db push --force-reset', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    })

    // Seed test database with minimal data
    execSync('npx prisma db seed', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    })

    console.log('✅ Global test setup completed successfully')
  } catch (error) {
    console.error('❌ Global test setup failed:', error.message)
    throw error
  }
}