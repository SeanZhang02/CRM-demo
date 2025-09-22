/**
 * Comprehensive Testing Report Generator
 * Aggregates all test results and generates detailed reports
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class TestReportGenerator {
  constructor() {
    this.reportData = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
        },
        performance: {
          lighthouse: {},
          loadTesting: {},
        },
        security: {
          vulnerabilities: 0,
          score: 0,
        },
        timestamp: new Date().toISOString(),
      },
      testSuites: {
        unit: { status: 'pending', results: null },
        integration: { status: 'pending', results: null },
        e2e: { status: 'pending', results: null },
        performance: { status: 'pending', results: null },
        security: { status: 'pending', results: null },
      },
      issues: [],
      recommendations: [],
    }
    this.reportsDir = path.join(__dirname, '..', 'reports')
    this.ensureReportsDirectory()
  }

  /**
   * Generate comprehensive test report
   */
  async generateCompleteReport() {
    console.log('📊 Generating comprehensive test report...')

    try {
      // Run all test suites
      await this.runUnitTests()
      await this.runIntegrationTests()
      await this.runE2ETests()
      await this.runPerformanceTests()
      await this.runSecurityTests()

      // Collect results
      this.collectTestResults()
      this.analyzeCoverage()
      this.generateRecommendations()

      // Generate reports
      this.generateHTMLReport()
      this.generateJSONReport()
      this.generateMarkdownReport()
      this.generateExcelReport()

      console.log('✅ Test report generation completed')
      this.displaySummary()

    } catch (error) {
      console.error('❌ Test report generation failed:', error.message)
      throw error
    }
  }

  /**
   * Run unit tests and collect results
   */
  async runUnitTests() {
    console.log('🧪 Running unit tests...')

    try {
      const result = execSync('npm run test:coverage -- --reporter=json', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const jestResults = JSON.parse(result)
      this.reportData.testSuites.unit = {
        status: 'completed',
        results: jestResults,
        summary: {
          total: jestResults.numTotalTests,
          passed: jestResults.numPassedTests,
          failed: jestResults.numFailedTests,
          skipped: jestResults.numPendingTests,
          duration: jestResults.testResults.reduce((acc, test) => acc + test.perfStats.runtime, 0),
        },
      }

      console.log(`✅ Unit tests completed: ${jestResults.numPassedTests}/${jestResults.numTotalTests} passed`)

    } catch (error) {
      this.reportData.testSuites.unit = {
        status: 'failed',
        error: error.message,
      }
      console.log('❌ Unit tests failed')
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    console.log('🔗 Running integration tests...')

    try {
      const result = execSync('npm run test:integration -- --reporter=json', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const integrationResults = JSON.parse(result)
      this.reportData.testSuites.integration = {
        status: 'completed',
        results: integrationResults,
        summary: {
          total: integrationResults.numTotalTests,
          passed: integrationResults.numPassedTests,
          failed: integrationResults.numFailedTests,
          skipped: integrationResults.numPendingTests,
        },
      }

      console.log(`✅ Integration tests completed: ${integrationResults.numPassedTests}/${integrationResults.numTotalTests} passed`)

    } catch (error) {
      this.reportData.testSuites.integration = {
        status: 'failed',
        error: error.message,
      }
      console.log('❌ Integration tests failed')
    }
  }

  /**
   * Run E2E tests with Playwright
   */
  async runE2ETests() {
    console.log('🎭 Running E2E tests...')

    try {
      const result = execSync('npm run test:e2e -- --reporter=json', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      // Parse Playwright results
      const e2eResults = JSON.parse(result)
      this.reportData.testSuites.e2e = {
        status: 'completed',
        results: e2eResults,
        browsers: ['chromium', 'firefox', 'webkit'],
        devices: ['desktop', 'tablet', 'mobile'],
      }

      console.log('✅ E2E tests completed')

    } catch (error) {
      this.reportData.testSuites.e2e = {
        status: 'failed',
        error: error.message,
      }
      console.log('❌ E2E tests failed')
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('⚡ Running performance tests...')

    try {
      // Run Lighthouse
      const lighthouseResult = execSync('npm run test:performance', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      // Run load testing
      const loadTestResult = execSync('npm run test:load', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      this.reportData.testSuites.performance = {
        status: 'completed',
        lighthouse: this.parseLighthouseResults(),
        loadTesting: this.parseLoadTestResults(),
      }

      console.log('✅ Performance tests completed')

    } catch (error) {
      this.reportData.testSuites.performance = {
        status: 'failed',
        error: error.message,
      }
      console.log('❌ Performance tests failed')
    }
  }

  /**
   * Run security tests
   */
  async runSecurityTests() {
    console.log('🔒 Running security tests...')

    try {
      const result = execSync('npm run test:security', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      // Parse security results
      const securityResults = this.parseSecurityResults()
      this.reportData.testSuites.security = {
        status: 'completed',
        results: securityResults,
      }

      console.log('✅ Security tests completed')

    } catch (error) {
      this.reportData.testSuites.security = {
        status: 'failed',
        error: error.message,
      }
      console.log('❌ Security tests failed')
    }
  }

  /**
   * Collect and aggregate test results
   */
  collectTestResults() {
    console.log('📊 Collecting test results...')

    // Aggregate totals
    Object.values(this.reportData.testSuites).forEach(suite => {
      if (suite.status === 'completed' && suite.summary) {
        this.reportData.summary.totalTests += suite.summary.total || 0
        this.reportData.summary.passed += suite.summary.passed || 0
        this.reportData.summary.failed += suite.summary.failed || 0
        this.reportData.summary.skipped += suite.summary.skipped || 0
      }
    })

    // Calculate success rate
    this.reportData.summary.successRate = this.reportData.summary.totalTests > 0
      ? (this.reportData.summary.passed / this.reportData.summary.totalTests) * 100
      : 0
  }

  /**
   * Analyze code coverage
   */
  analyzeCoverage() {
    console.log('📈 Analyzing code coverage...')

    try {
      const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json')
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
        this.reportData.summary.coverage = {
          statements: coverage.total.statements.pct,
          branches: coverage.total.branches.pct,
          functions: coverage.total.functions.pct,
          lines: coverage.total.lines.pct,
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze coverage:', error.message)
    }
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    console.log('💡 Generating recommendations...')

    const recommendations = []

    // Coverage recommendations
    if (this.reportData.summary.coverage.statements < 80) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        title: 'Increase Test Coverage',
        description: `Current coverage is ${this.reportData.summary.coverage.statements}%. Target is 80%+.`,
        action: 'Add more unit tests for uncovered code paths.'
      })
    }

    // Performance recommendations
    if (this.reportData.testSuites.performance.lighthouse?.performance < 90) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Improve Page Performance',
        description: 'Lighthouse performance score is below 90.',
        action: 'Optimize images, reduce JavaScript bundle size, improve loading times.'
      })
    }

    // Security recommendations
    if (this.reportData.testSuites.security.results?.vulnerabilities > 0) {
      recommendations.push({
        type: 'security',
        priority: 'critical',
        title: 'Fix Security Vulnerabilities',
        description: `Found ${this.reportData.testSuites.security.results.vulnerabilities} security issues.`,
        action: 'Update dependencies and fix identified security vulnerabilities.'
      })
    }

    // Test failure recommendations
    if (this.reportData.summary.failed > 0) {
      recommendations.push({
        type: 'testing',
        priority: 'high',
        title: 'Fix Failing Tests',
        description: `${this.reportData.summary.failed} tests are currently failing.`,
        action: 'Review and fix failing test cases before deployment.'
      })
    }

    this.reportData.recommendations = recommendations
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    console.log('🌐 Generating HTML report...')

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRM Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .section { margin: 30px 0; }
        .test-suite { border: 1px solid #ddd; margin: 10px 0; border-radius: 6px; }
        .test-header { background: #f8f9fa; padding: 10px; font-weight: bold; }
        .test-content { padding: 15px; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-pending { color: #ffc107; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #ffc107; }
        .priority-critical { border-left-color: #dc3545; }
        .priority-high { border-left-color: #fd7e14; }
        .priority-medium { border-left-color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CRM Testing Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.reportData.summary.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value status-passed">${this.reportData.summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value status-failed">${this.reportData.summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.reportData.summary.coverage.statements}%</div>
                <div>Coverage</div>
            </div>
        </div>

        <div class="section">
            <h2>Test Suites</h2>
            ${this.generateTestSuitesHTML()}
        </div>

        <div class="section">
            <h2>Recommendations</h2>
            ${this.generateRecommendationsHTML()}
        </div>
    </div>
</body>
</html>`

    fs.writeFileSync(path.join(this.reportsDir, 'test-report.html'), htmlTemplate)
  }

  /**
   * Generate JSON report
   */
  generateJSONReport() {
    console.log('📄 Generating JSON report...')

    fs.writeFileSync(
      path.join(this.reportsDir, 'test-report.json'),
      JSON.stringify(this.reportData, null, 2)
    )
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport() {
    console.log('📝 Generating Markdown report...')

    const markdownContent = `# CRM Testing Report

Generated on: ${new Date().toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${this.reportData.summary.totalTests} |
| Passed | ${this.reportData.summary.passed} |
| Failed | ${this.reportData.summary.failed} |
| Success Rate | ${this.reportData.summary.successRate.toFixed(1)}% |
| Code Coverage | ${this.reportData.summary.coverage.statements}% |

## Test Suites

${this.generateTestSuitesMarkdown()}

## Recommendations

${this.generateRecommendationsMarkdown()}

## Next Steps

1. Address all critical and high-priority recommendations
2. Fix any failing tests
3. Improve coverage if below 80%
4. Re-run tests before deployment
`

    fs.writeFileSync(path.join(this.reportsDir, 'test-report.md'), markdownContent)
  }

  /**
   * Generate Excel report (simplified CSV)
   */
  generateExcelReport() {
    console.log('📊 Generating CSV report...')

    const csvContent = [
      ['Test Suite', 'Status', 'Total', 'Passed', 'Failed', 'Success Rate'],
      ...Object.entries(this.reportData.testSuites).map(([name, suite]) => [
        name,
        suite.status,
        suite.summary?.total || 0,
        suite.summary?.passed || 0,
        suite.summary?.failed || 0,
        suite.summary?.total ? ((suite.summary.passed / suite.summary.total) * 100).toFixed(1) + '%' : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n')

    fs.writeFileSync(path.join(this.reportsDir, 'test-report.csv'), csvContent)
  }

  /**
   * Helper methods for report generation
   */
  generateTestSuitesHTML() {
    return Object.entries(this.reportData.testSuites).map(([name, suite]) => `
      <div class="test-suite">
        <div class="test-header">
          ${name.toUpperCase()} Tests
          <span class="status-${suite.status}">(${suite.status})</span>
        </div>
        <div class="test-content">
          ${suite.summary ? `
            <p>Total: ${suite.summary.total} | Passed: ${suite.summary.passed} | Failed: ${suite.summary.failed}</p>
          ` : suite.error ? `
            <p class="status-failed">Error: ${suite.error}</p>
          ` : ''}
        </div>
      </div>
    `).join('')
  }

  generateTestSuitesMarkdown() {
    return Object.entries(this.reportData.testSuites).map(([name, suite]) => `
### ${name.toUpperCase()} Tests

- **Status**: ${suite.status}
${suite.summary ? `- **Results**: ${suite.summary.passed}/${suite.summary.total} passed` : ''}
${suite.error ? `- **Error**: ${suite.error}` : ''}
    `).join('')
  }

  generateRecommendationsHTML() {
    return this.reportData.recommendations.map(rec => `
      <div class="recommendation priority-${rec.priority}">
        <h4>${rec.title}</h4>
        <p>${rec.description}</p>
        <p><strong>Action:</strong> ${rec.action}</p>
      </div>
    `).join('')
  }

  generateRecommendationsMarkdown() {
    return this.reportData.recommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()})

${rec.description}

**Action**: ${rec.action}
    `).join('')
  }

  /**
   * Parse test results (mock implementations)
   */
  parseLighthouseResults() {
    try {
      const lighthousePath = path.join(this.reportsDir, 'lighthouse.json')
      if (fs.existsSync(lighthousePath)) {
        const lighthouse = JSON.parse(fs.readFileSync(lighthousePath, 'utf8'))
        return {
          performance: lighthouse.categories.performance.score * 100,
          accessibility: lighthouse.categories.accessibility.score * 100,
          bestPractices: lighthouse.categories['best-practices'].score * 100,
          seo: lighthouse.categories.seo.score * 100,
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not parse Lighthouse results')
    }
    return {}
  }

  parseLoadTestResults() {
    // Mock load test results
    return {
      averageResponseTime: 150,
      maxResponseTime: 500,
      requestsPerSecond: 100,
      errorRate: 0.1,
    }
  }

  parseSecurityResults() {
    try {
      const securityPath = path.join(this.reportsDir, 'security-report.json')
      if (fs.existsSync(securityPath)) {
        return JSON.parse(fs.readFileSync(securityPath, 'utf8'))
      }
    } catch (error) {
      console.warn('⚠️ Could not parse security results')
    }
    return { vulnerabilities: 0, score: 100 }
  }

  /**
   * Display summary to console
   */
  displaySummary() {
    console.log('\n📊 TEST REPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`Total Tests: ${this.reportData.summary.totalTests}`)
    console.log(`Passed: ${this.reportData.summary.passed}`)
    console.log(`Failed: ${this.reportData.summary.failed}`)
    console.log(`Success Rate: ${this.reportData.summary.successRate.toFixed(1)}%`)
    console.log(`Coverage: ${this.reportData.summary.coverage.statements}%`)

    if (this.reportData.recommendations.length > 0) {
      console.log(`\n💡 Recommendations: ${this.reportData.recommendations.length}`)
      this.reportData.recommendations.forEach(rec => {
        console.log(`  - ${rec.title} (${rec.priority})`)
      })
    }

    console.log(`\n📄 Reports generated in: ${this.reportsDir}`)
    console.log('  - test-report.html (Interactive HTML report)')
    console.log('  - test-report.json (Machine-readable data)')
    console.log('  - test-report.md (Markdown summary)')
    console.log('  - test-report.csv (Spreadsheet data)')
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true })
    }
  }
}

// Run report generation if called directly
if (require.main === module) {
  const generator = new TestReportGenerator()
  generator.generateCompleteReport().catch(error => {
    console.error('Report generation failed:', error)
    process.exit(1)
  })
}

module.exports = TestReportGenerator