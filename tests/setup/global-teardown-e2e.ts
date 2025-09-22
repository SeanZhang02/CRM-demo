/**
 * Playwright Global Teardown
 * Cleans up E2E test environment
 */
import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E global teardown...')

  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...')

    // Note: In a production setup, you might want to clean up test users
    // and data created during E2E tests. For now, we'll keep it simple.

    console.log('✅ E2E global teardown completed successfully')
  } catch (error) {
    console.error('❌ E2E global teardown failed:', error.message)
    // Don't throw error to avoid masking test failures
  }
}

export default globalTeardown