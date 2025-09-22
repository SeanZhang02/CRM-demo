/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically called by Next.js when the server starts.
 * It's the perfect place to initialize monitoring and observability tools.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize monitoring in server environments
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side monitoring
    const { initSentry } = await import('./lib/monitoring/sentry')
    initSentry()

    // Log successful initialization
    console.log('✅ Server-side monitoring initialized')

    // Performance monitoring setup
    if (process.env.NODE_ENV === 'production') {
      // Initialize performance monitoring
      console.log('📊 Production performance monitoring enabled')

      // Set up process monitoring
      process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error)
        // Sentry will automatically capture this
      })

      process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection:', reason)
        // Sentry will automatically capture this
      })

      // Monitor memory usage
      setInterval(() => {
        const memUsage = process.memoryUsage()
        const memUsedMB = memUsage.heapUsed / 1024 / 1024

        // Alert if memory usage is high (>500MB)
        if (memUsedMB > 500) {
          console.warn(`⚠️  High memory usage: ${memUsedMB.toFixed(2)}MB`)
        }
      }, 60000) // Check every minute
    }
  }

  // Initialize client-side monitoring
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('🌐 Edge runtime monitoring initialized')
  }
}