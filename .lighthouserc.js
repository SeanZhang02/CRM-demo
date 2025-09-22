module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/pipeline', 'http://localhost:3000/contacts'],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
      settings: {
        // Mobile-first testing configuration
        preset: 'mobile',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // Simulate 3G network for realistic testing
        throttling: {
          rttMs: 150,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      // Performance budgets enforced
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1200 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // Mobile-specific metrics
        'speed-index': ['error', { maxNumericValue: 2000 }],
        'interactive': ['error', { maxNumericValue: 2000 }],
        'server-response-time': ['error', { maxNumericValue: 600 }],

        // Touch targets for mobile usability
        'tap-targets': ['error', { minScore: 1 }],
        'content-width': ['error', { minScore: 1 }],

        // Accessibility requirements
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'aria-valid-attr': ['error', { minScore: 1 }],

        // Performance optimizations
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],
        'uses-optimized-images': ['error', { minScore: 0.9 }],
        'uses-webp-images': ['warn', { minScore: 0.8 }],

        // Bundle size budgets
        'total-byte-weight': ['error', { maxNumericValue: 1000000 }], // 1MB total
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
    },
  },

  // Mobile device simulation settings
  puppeteerScript: './lighthouse-puppeteer-script.js',

  // Budget enforcement for different page types
  budgets: [
    {
      path: '/*',
      resourceSizes: [
        { resourceType: 'total', budget: 1000 }, // 1MB total budget
        { resourceType: 'script', budget: 400 },  // 400KB JS budget
        { resourceType: 'stylesheet', budget: 100 }, // 100KB CSS budget
        { resourceType: 'image', budget: 400 },   // 400KB images budget
        { resourceType: 'font', budget: 100 },    // 100KB fonts budget
      ],
      resourceCounts: [
        { resourceType: 'total', budget: 50 },    // Max 50 resources
        { resourceType: 'script', budget: 10 },   // Max 10 JS files
        { resourceType: 'stylesheet', budget: 5 }, // Max 5 CSS files
        { resourceType: 'image', budget: 15 },    // Max 15 images
      ],
      timings: [
        { metric: 'first-contentful-paint', budget: 1200 },
        { metric: 'largest-contentful-paint', budget: 2000 },
        { metric: 'speed-index', budget: 2000 },
        { metric: 'interactive', budget: 2000 },
      ],
    },
  ],
}