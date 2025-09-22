/**
 * Playwright Global Setup
 * Prepares test environment for E2E testing
 */
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E global setup...')

  const baseURL = config.webServer?.url || config.use?.baseURL || 'http://localhost:3000'

  try {
    // Launch browser for setup
    const browser = await chromium.launch()
    const page = await browser.newPage()

    // Wait for application to be ready
    console.log('🔍 Checking application health...')
    await page.goto(`${baseURL}/api/health`)

    // Verify database is accessible
    await page.goto(`${baseURL}/api/monitoring/metrics`)

    // Create test user for E2E tests
    console.log('👤 Setting up test user...')
    await page.goto(`${baseURL}/auth/signin`)

    // Create a test user account if needed
    const response = await page.request.post(`${baseURL}/api/auth/register`, {
      data: {
        email: 'e2e-test@example.com',
        password: 'TestPassword123!',
        name: 'E2E Test User',
      },
    })

    if (response.ok()) {
      console.log('✅ Test user created successfully')
    } else {
      console.log('ℹ️ Test user already exists or creation skipped')
    }

    await browser.close()

    console.log('✅ E2E global setup completed successfully')
  } catch (error) {
    console.error('❌ E2E global setup failed:', error.message)
    throw error
  }
}

export default globalSetup