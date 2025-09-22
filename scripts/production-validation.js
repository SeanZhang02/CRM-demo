const { performance } = require('perf_hooks');

/**
 * Production Environment Validation Script
 * Validates that the production deployment meets all performance and security targets
 */

const PERFORMANCE_TARGETS = {
  API_RESPONSE_TIME: 200, // ms
  PAGE_LOAD_TIME: 2000,   // ms
  DATABASE_QUERY_TIME: 100, // ms
  UPTIME_REQUIREMENT: 99.9  // percentage
};

const SECURITY_REQUIREMENTS = [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Content-Security-Policy'
];

async function validateProduction() {
  console.log('🔍 Starting production environment validation...');
  console.log('=' .repeat(60));

  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  console.log(`🌐 Testing URL: ${baseUrl}`);

  const results = {
    performance: {},
    security: {},
    functionality: {},
    overall: { passed: 0, failed: 0, warnings: 0 }
  };

  try {
    // Performance Validation
    console.log('\n📊 Performance Validation');
    console.log('-'.repeat(30));

    results.performance = await validatePerformance(baseUrl);

    // Security Validation
    console.log('\n🔒 Security Validation');
    console.log('-'.repeat(30));

    results.security = await validateSecurity(baseUrl);

    // Functionality Validation
    console.log('\n⚙️ Functionality Validation');
    console.log('-'.repeat(30));

    results.functionality = await validateFunctionality(baseUrl);

    // Calculate overall results
    Object.values(results).forEach(category => {
      if (category.tests) {
        category.tests.forEach(test => {
          if (test.status === 'PASS') results.overall.passed++;
          else if (test.status === 'FAIL') results.overall.failed++;
          else if (test.status === 'WARN') results.overall.warnings++;
        });
      }
    });

    // Display Summary
    console.log('\n📋 Validation Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${results.overall.passed}`);
    console.log(`❌ Failed: ${results.overall.failed}`);
    console.log(`⚠️  Warnings: ${results.overall.warnings}`);

    const overallStatus = results.overall.failed === 0 ? 'PASSED' : 'FAILED';
    console.log(`\n🎯 Overall Status: ${overallStatus}`);

    if (overallStatus === 'FAILED') {
      console.log('\n❌ Production validation failed. Review failed tests before deploying.');
      process.exit(1);
    } else {
      console.log('\n✅ Production validation passed! Ready for deployment.');
    }

    return results;

  } catch (error) {
    console.error('\n💥 Validation failed with error:', error.message);
    process.exit(1);
  }
}

async function validatePerformance(baseUrl) {
  const tests = [];

  // Health Check Response Time
  const healthStart = performance.now();
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const healthTime = performance.now() - healthStart;

    tests.push({
      name: 'Health Check Response Time',
      target: `< ${PERFORMANCE_TARGETS.API_RESPONSE_TIME}ms`,
      actual: `${Math.round(healthTime)}ms`,
      status: healthTime < PERFORMANCE_TARGETS.API_RESPONSE_TIME ? 'PASS' : 'FAIL'
    });

    if (response.ok) {
      const healthData = await response.json();

      // Database Response Time
      const dbLatency = healthData.checks?.database?.latency || 0;
      tests.push({
        name: 'Database Response Time',
        target: `< ${PERFORMANCE_TARGETS.DATABASE_QUERY_TIME}ms`,
        actual: `${dbLatency}ms`,
        status: dbLatency < PERFORMANCE_TARGETS.DATABASE_QUERY_TIME ? 'PASS' : 'FAIL'
      });

      // Memory Usage
      const memUsage = healthData.checks?.memory?.utilization;
      if (memUsage) {
        const memValue = parseInt(memUsage.replace('%', ''));
        tests.push({
          name: 'Memory Usage',
          target: '< 90%',
          actual: memUsage,
          status: memValue < 90 ? 'PASS' : 'WARN'
        });
      }
    }
  } catch (error) {
    tests.push({
      name: 'Health Check Response Time',
      target: `< ${PERFORMANCE_TARGETS.API_RESPONSE_TIME}ms`,
      actual: 'ERROR',
      status: 'FAIL',
      error: error.message
    });
  }

  // API Endpoints Performance
  const apiEndpoints = [
    '/api/companies',
    '/api/contacts',
    '/api/deals',
    '/api/pipeline-stages'
  ];

  for (const endpoint of apiEndpoints) {
    const apiStart = performance.now();
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: { 'Accept': 'application/json' }
      });
      const apiTime = performance.now() - apiStart;

      tests.push({
        name: `API ${endpoint} Response Time`,
        target: `< ${PERFORMANCE_TARGETS.API_RESPONSE_TIME}ms`,
        actual: `${Math.round(apiTime)}ms`,
        status: apiTime < PERFORMANCE_TARGETS.API_RESPONSE_TIME ? 'PASS' : 'FAIL'
      });

    } catch (error) {
      tests.push({
        name: `API ${endpoint} Response Time`,
        target: `< ${PERFORMANCE_TARGETS.API_RESPONSE_TIME}ms`,
        actual: 'ERROR',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  // Display results
  tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${test.name}: ${test.actual} (target: ${test.target})`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  return { tests };
}

async function validateSecurity(baseUrl) {
  const tests = [];

  try {
    const response = await fetch(baseUrl, { method: 'HEAD' });

    // Check security headers
    SECURITY_REQUIREMENTS.forEach(header => {
      const headerValue = response.headers.get(header);
      tests.push({
        name: `Security Header: ${header}`,
        target: 'Present',
        actual: headerValue ? 'Present' : 'Missing',
        status: headerValue ? 'PASS' : 'FAIL'
      });
    });

    // Check HTTPS
    const isHttps = baseUrl.startsWith('https://');
    tests.push({
      name: 'HTTPS Enabled',
      target: 'true',
      actual: isHttps.toString(),
      status: isHttps ? 'PASS' : 'FAIL'
    });

    // Check HSTS header specifically
    const hstsHeader = response.headers.get('Strict-Transport-Security');
    const hasHSTS = hstsHeader && hstsHeader.includes('max-age=');
    tests.push({
      name: 'HSTS Configuration',
      target: 'max-age present',
      actual: hasHSTS ? 'Configured' : 'Missing/Invalid',
      status: hasHSTS ? 'PASS' : 'FAIL'
    });

    // Check Content-Security-Policy
    const cspHeader = response.headers.get('Content-Security-Policy');
    const hasCSP = cspHeader && cspHeader.includes("default-src 'self'");
    tests.push({
      name: 'Content Security Policy',
      target: 'Restrictive policy',
      actual: hasCSP ? 'Configured' : 'Missing/Weak',
      status: hasCSP ? 'PASS' : 'WARN'
    });

  } catch (error) {
    tests.push({
      name: 'Security Headers Check',
      target: 'All headers present',
      actual: 'ERROR',
      status: 'FAIL',
      error: error.message
    });
  }

  // Display results
  tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${test.name}: ${test.actual} (target: ${test.target})`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  return { tests };
}

async function validateFunctionality(baseUrl) {
  const tests = [];

  // Health check endpoint
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const isHealthy = healthResponse.ok;

    tests.push({
      name: 'Health Check Endpoint',
      target: 'HTTP 200',
      actual: `HTTP ${healthResponse.status}`,
      status: isHealthy ? 'PASS' : 'FAIL'
    });

    if (isHealthy) {
      const healthData = await healthResponse.json();
      tests.push({
        name: 'Health Check Data',
        target: 'Valid JSON with status',
        actual: healthData.status || 'No status field',
        status: healthData.status ? 'PASS' : 'FAIL'
      });
    }

  } catch (error) {
    tests.push({
      name: 'Health Check Endpoint',
      target: 'HTTP 200',
      actual: 'ERROR',
      status: 'FAIL',
      error: error.message
    });
  }

  // Database connectivity (via health check)
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health?detailed=true`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      const dbStatus = healthData.checks?.database?.status;

      tests.push({
        name: 'Database Connectivity',
        target: 'healthy',
        actual: dbStatus || 'unknown',
        status: dbStatus === 'healthy' ? 'PASS' : 'FAIL'
      });
    }
  } catch (error) {
    tests.push({
      name: 'Database Connectivity',
      target: 'healthy',
      actual: 'ERROR',
      status: 'FAIL',
      error: error.message
    });
  }

  // Main application routes
  const appRoutes = ['/dashboard', '/auth/signin'];
  for (const route of appRoutes) {
    try {
      const response = await fetch(`${baseUrl}${route}`);
      const isAccessible = response.status < 500; // Accept redirects and auth challenges

      tests.push({
        name: `Route ${route}`,
        target: 'Accessible (< 500)',
        actual: `HTTP ${response.status}`,
        status: isAccessible ? 'PASS' : 'FAIL'
      });

    } catch (error) {
      tests.push({
        name: `Route ${route}`,
        target: 'Accessible (< 500)',
        actual: 'ERROR',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  // Display results
  tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${test.name}: ${test.actual} (target: ${test.target})`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  return { tests };
}

// Run validation if called directly
if (require.main === module) {
  validateProduction().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = { validateProduction, PERFORMANCE_TARGETS };