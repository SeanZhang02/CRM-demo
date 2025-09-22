#!/usr/bin/env node

/**
 * Infrastructure Testing Script
 *
 * Comprehensive testing suite for validating production infrastructure:
 * - Database connectivity and performance
 * - API endpoint functionality
 * - Security headers and CORS
 * - Performance benchmarks
 * - Monitoring and health checks
 */

const https = require('https')
const http = require('http')

// Configuration
const CONFIG = {
  // Update these with your actual deployment URLs
  baseUrl: process.env.VERCEL_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  timeout: 30000,
  expectedResponseTime: 2000, // 2 seconds
  healthCheckSecret: process.env.HEALTH_CHECK_SECRET
}

/**
 * Test suite runner
 */
async function runInfrastructureTests() {
  console.log('🚀 Starting infrastructure tests...')
  console.log(`📍 Testing base URL: ${CONFIG.baseUrl}`)
  console.log('=' .repeat(60))

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  }

  try {
    // Test suite
    await testHealthEndpoint(results)
    await testSecurityHeaders(results)
    await testCorsConfiguration(results)
    await testRateLimiting(results)
    await testPerformance(results)
    await testMonitoringEndpoints(results)
    await testErrorHandling(results)

    // Summary
    console.log('=' .repeat(60))
    console.log('📊 Test Results Summary:')
    console.log(`✅ Passed: ${results.passed}`)
    console.log(`❌ Failed: ${results.failed}`)
    console.log(`⚠️  Warnings: ${results.warnings}`)

    if (results.failed > 0) {
      console.log('\n❌ Infrastructure tests failed!')
      console.log('Failed tests:')
      results.tests
        .filter(test => test.status === 'failed')
        .forEach(test => console.log(`  - ${test.name}: ${test.error}`))
      process.exit(1)
    } else if (results.warnings > 0) {
      console.log('\n⚠️  Infrastructure tests passed with warnings!')
      results.tests
        .filter(test => test.status === 'warning')
        .forEach(test => console.log(`  - ${test.name}: ${test.message}`))
    } else {
      console.log('\n✅ All infrastructure tests passed!')
    }

  } catch (error) {
    console.error('💥 Test suite crashed:', error.message)
    process.exit(1)
  }
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint(results) {
  const testName = 'Health Endpoint'
  console.log(`🔍 Testing: ${testName}`)

  try {
    const startTime = Date.now()
    const response = await makeRequest('/api/health', 'GET', {
      'Authorization': CONFIG.healthCheckSecret ? `Bearer ${CONFIG.healthCheckSecret}` : undefined
    })
    const duration = Date.now() - startTime

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`)
    }

    const data = JSON.parse(response.body)

    // Validate response structure
    if (!data.status || !data.timestamp || !data.metrics) {
      throw new Error('Invalid health response structure')
    }

    // Check performance
    if (duration > CONFIG.expectedResponseTime) {
      addResult(results, testName, 'warning',
        `Health check took ${duration}ms (expected <${CONFIG.expectedResponseTime}ms)`)
    } else {
      addResult(results, testName, 'passed', `Responded in ${duration}ms`)
    }

    console.log(`  ✅ Status: ${data.status}`)
    console.log(`  📊 Response time: ${duration}ms`)
    console.log(`  💾 Database latency: ${data.components?.database?.latency || 'N/A'}ms`)

  } catch (error) {
    addResult(results, testName, 'failed', error.message)
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

/**
 * Test security headers
 */
async function testSecurityHeaders(results) {
  const testName = 'Security Headers'
  console.log(`🔍 Testing: ${testName}`)

  try {
    const response = await makeRequest('/', 'GET')

    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'strict-transport-security'
    ]

    const missingHeaders = []
    const presentHeaders = []

    requiredHeaders.forEach(header => {
      if (response.headers[header]) {
        presentHeaders.push(header)
      } else {
        missingHeaders.push(header)
      }
    })

    if (missingHeaders.length > 0) {
      addResult(results, testName, 'failed', `Missing headers: ${missingHeaders.join(', ')}`)
      console.log(`  ❌ Missing: ${missingHeaders.join(', ')}`)
    } else {
      addResult(results, testName, 'passed', 'All security headers present')
      console.log(`  ✅ All security headers present`)
    }

    console.log(`  📋 Present headers: ${presentHeaders.join(', ')}`)

  } catch (error) {
    addResult(results, testName, 'failed', error.message)
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

/**
 * Test CORS configuration
 */
async function testCorsConfiguration(results) {
  const testName = 'CORS Configuration'
  console.log(`🔍 Testing: ${testName}`)

  try {
    // Test preflight request
    const response = await makeRequest('/api/health', 'OPTIONS', {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    })

    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ]

    const presentCorsHeaders = corsHeaders.filter(header => response.headers[header])

    if (presentCorsHeaders.length === corsHeaders.length) {
      addResult(results, testName, 'passed', 'CORS headers properly configured')
      console.log(`  ✅ CORS headers properly configured`)
    } else {
      addResult(results, testName, 'warning', 'Some CORS headers missing')
      console.log(`  ⚠️  Some CORS headers missing`)
    }

    console.log(`  🌐 Present CORS headers: ${presentCorsHeaders.join(', ')}`)

  } catch (error) {
    addResult(results, testName, 'failed', error.message)
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

/**
 * Test rate limiting
 */
async function testRateLimiting(results) {
  const testName = 'Rate Limiting'
  console.log(`🔍 Testing: ${testName}`)

  try {
    // Make multiple requests quickly
    const requests = []
    for (let i = 0; i < 5; i++) {
      requests.push(makeRequest('/api/health', 'GET'))
    }

    const responses = await Promise.all(requests)
    const rateLimitHeaders = responses[0].headers

    if (rateLimitHeaders['x-ratelimit-limit']) {
      addResult(results, testName, 'passed', 'Rate limiting headers present')
      console.log(`  ✅ Rate limiting configured`)
      console.log(`  🚦 Limit: ${rateLimitHeaders['x-ratelimit-limit']}`)
      console.log(`  📊 Remaining: ${rateLimitHeaders['x-ratelimit-remaining']}`)
    } else {
      addResult(results, testName, 'warning', 'Rate limiting headers not found (may be disabled in development)')
      console.log(`  ⚠️  Rate limiting headers not found`)
    }

  } catch (error) {
    addResult(results, testName, 'failed', error.message)
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

/**
 * Test performance benchmarks
 */
async function testPerformance(results) {
  const testName = 'Performance Benchmarks'
  console.log(`🔍 Testing: ${testName}`)

  try {
    const endpoints = [
      '/api/health',
      '/'
    ]

    const performanceResults = []

    for (const endpoint of endpoints) {
      const times = []

      // Make 3 requests to get average
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now()
        await makeRequest(endpoint, 'GET')
        times.push(Date.now() - startTime)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      performanceResults.push({ endpoint, avgTime })

      console.log(`  📊 ${endpoint}: ${avgTime.toFixed(0)}ms avg`)
    }

    const slowEndpoints = performanceResults.filter(
      result => result.avgTime > CONFIG.expectedResponseTime
    )

    if (slowEndpoints.length > 0) {
      addResult(results, testName, 'warning',
        `Slow endpoints: ${slowEndpoints.map(e => `${e.endpoint} (${e.avgTime.toFixed(0)}ms)`).join(', ')}`)
    } else {
      addResult(results, testName, 'passed', 'All endpoints meet performance targets')
    }

  } catch (error) {
    addResult(results, testName, 'failed', error.message)
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

/**
 * Test monitoring endpoints
 */
async function testMonitoringEndpoints(results) {
  const testName = 'Monitoring Endpoints'
  console.log(`🔍 Testing: ${testName}`)

  try {
    const monitoringEndpoints = [
      '/api/health',
      '/api/monitoring/metrics'
    ]

    let successCount = 0

    for (const endpoint of monitoringEndpoints) {
      try {
        const response = await makeRequest(endpoint, 'GET', {
          'Authorization': CONFIG.healthCheckSecret ? `Bearer ${CONFIG.healthCheckSecret}` : undefined
        })

        if (response.status === 200 || response.status === 401) { // 401 is OK if auth is required
          successCount++
          console.log(`  ✅ ${endpoint}: Available`)
        } else {
          console.log(`  ❌ ${endpoint}: Status ${response.status}`)
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint}: ${error.message}`)
      }
    }

    if (successCount === monitoringEndpoints.length) {
      addResult(results, testName, 'passed', 'All monitoring endpoints available')
    } else {
      addResult(results, testName, 'warning', `${successCount}/${monitoringEndpoints.length} monitoring endpoints available`)
    }

  } catch (error) {
    addResult(results, testName, 'failed', error.message)
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

/**
 * Test error handling
 */
async function testErrorHandling(results) {
  const testName = 'Error Handling'
  console.log(`🔍 Testing: ${testName}`)

  try {
    // Test 404 handling
    const response404 = await makeRequest('/api/nonexistent', 'GET')

    if (response404.status === 404) {
      addResult(results, testName, 'passed', '404 errors handled correctly')
      console.log(`  ✅ 404 errors handled correctly`)
    } else {
      addResult(results, testName, 'warning', `Expected 404, got ${response404.status}`)
      console.log(`  ⚠️  Expected 404, got ${response404.status}`)
    }

  } catch (error) {
    addResult(results, testName, 'failed', error.message)
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

/**
 * Make HTTP request
 */
function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.baseUrl)
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'User-Agent': 'Infrastructure-Test-Suite/1.0',
        ...headers
      },
      timeout: CONFIG.timeout
    }

    const req = client.request(options, (res) => {
      let body = ''

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        })
      })
    })

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timeout after ${CONFIG.timeout}ms`))
    })

    req.end()
  })
}

/**
 * Add test result
 */
function addResult(results, name, status, message) {
  results.tests.push({ name, status, message, error: status === 'failed' ? message : undefined })

  if (status === 'passed') {
    results.passed++
  } else if (status === 'failed') {
    results.failed++
  } else if (status === 'warning') {
    results.warnings++
  }
}

// Run tests if called directly
if (require.main === module) {
  runInfrastructureTests().catch(error => {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  })
}

module.exports = { runInfrastructureTests }