/**
 * Global Jest Teardown
 * Cleans up test environment and database connections
 */

module.exports = async () => {
  console.log('🧹 Starting global test teardown...')

  try {
    // Clean up any global resources
    // Database connections are handled by individual tests

    console.log('✅ Global test teardown completed successfully')
  } catch (error) {
    console.error('❌ Global test teardown failed:', error.message)
    // Don't throw error to avoid masking test failures
  }
}