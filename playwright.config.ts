import { defineConfig, devices } from '@playwright/test'

/**
 * Week 6 Comprehensive E2E Testing Configuration
 * Tests critical user journeys across desktop and mobile devices
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }],
    ['list'],
  ],

  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    // Browser trace for debugging
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Timeout for actions
    actionTimeout: 30000,

    // Timeout for navigation
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 120000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Project configurations for different browsers and devices
  projects: [
    // Desktop Chrome - Primary testing browser
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Desktop Firefox - Cross-browser validation
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Desktop Safari - WebKit engine testing
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Desktop Edge - Enterprise browser testing
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile testing - iOS Safari
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14 Pro'],
      },
    },

    // Mobile testing - Android Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
      },
    },

    // Tablet testing - iPad
    {
      name: 'tablet-safari',
      use: {
        ...devices['iPad Pro'],
      },
    },

    // Small desktop viewport (minimum supported)
    {
      name: 'small-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },
  ],

  // Web server configuration for local testing
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
      },

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Global setup and teardown
  globalSetup: require.resolve('./tests/setup/global-setup-e2e.ts'),
  globalTeardown: require.resolve('./tests/setup/global-teardown-e2e.ts'),
})