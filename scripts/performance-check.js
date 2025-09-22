const fs = require('fs');
const path = require('path');

/**
 * Performance Check Script for CI/CD Pipeline
 * Analyzes Lighthouse reports and validates performance targets
 */

const PERFORMANCE_THRESHOLDS = {
  PERFORMANCE: 90,
  ACCESSIBILITY: 95,
  BEST_PRACTICES: 90,
  SEO: 85,
  PWA: 80, // Optional for CRM
  FIRST_CONTENTFUL_PAINT: 2000, // ms
  LARGEST_CONTENTFUL_PAINT: 2500, // ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1,
  TOTAL_BLOCKING_TIME: 300 // ms
};

async function analyzePerformance() {
  console.log('🔍 Analyzing Lighthouse performance report...');

  try {
    // Read Lighthouse report
    const reportPath = path.join(process.cwd(), 'lighthouse-report.json');

    if (!fs.existsSync(reportPath)) {
      console.error('❌ Lighthouse report not found at:', reportPath);
      process.exit(1);
    }

    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    const scores = {
      performance: Math.round(reportData.categories.performance.score * 100),
      accessibility: Math.round(reportData.categories.accessibility.score * 100),
      bestPractices: Math.round(reportData.categories['best-practices'].score * 100),
      seo: Math.round(reportData.categories.seo.score * 100),
      pwa: reportData.categories.pwa ? Math.round(reportData.categories.pwa.score * 100) : null
    };

    const metrics = {
      firstContentfulPaint: reportData.audits['first-contentful-paint'].numericValue,
      largestContentfulPaint: reportData.audits['largest-contentful-paint'].numericValue,
      cumulativeLayoutShift: reportData.audits['cumulative-layout-shift'].numericValue,
      totalBlockingTime: reportData.audits['total-blocking-time'].numericValue,
      speedIndex: reportData.audits['speed-index'].numericValue,
      timeToInteractive: reportData.audits['interactive'].numericValue
    };

    console.log('\n📊 Lighthouse Scores');
    console.log('=' .repeat(40));

    // Check scores against thresholds
    const results = [];

    // Performance Score
    const perfStatus = scores.performance >= PERFORMANCE_THRESHOLDS.PERFORMANCE ? 'PASS' : 'FAIL';
    results.push({
      metric: 'Performance Score',
      value: scores.performance,
      threshold: PERFORMANCE_THRESHOLDS.PERFORMANCE,
      status: perfStatus
    });

    // Accessibility Score
    const a11yStatus = scores.accessibility >= PERFORMANCE_THRESHOLDS.ACCESSIBILITY ? 'PASS' : 'FAIL';
    results.push({
      metric: 'Accessibility Score',
      value: scores.accessibility,
      threshold: PERFORMANCE_THRESHOLDS.ACCESSIBILITY,
      status: a11yStatus
    });

    // Best Practices Score
    const bpStatus = scores.bestPractices >= PERFORMANCE_THRESHOLDS.BEST_PRACTICES ? 'PASS' : 'FAIL';
    results.push({
      metric: 'Best Practices Score',
      value: scores.bestPractices,
      threshold: PERFORMANCE_THRESHOLDS.BEST_PRACTICES,
      status: bpStatus
    });

    // SEO Score
    const seoStatus = scores.seo >= PERFORMANCE_THRESHOLDS.SEO ? 'PASS' : 'FAIL';
    results.push({
      metric: 'SEO Score',
      value: scores.seo,
      threshold: PERFORMANCE_THRESHOLDS.SEO,
      status: seoStatus
    });

    // Core Web Vitals
    const fcpStatus = metrics.firstContentfulPaint <= PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT ? 'PASS' : 'FAIL';
    results.push({
      metric: 'First Contentful Paint',
      value: Math.round(metrics.firstContentfulPaint),
      threshold: PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT,
      unit: 'ms',
      status: fcpStatus
    });

    const lcpStatus = metrics.largestContentfulPaint <= PERFORMANCE_THRESHOLDS.LARGEST_CONTENTFUL_PAINT ? 'PASS' : 'FAIL';
    results.push({
      metric: 'Largest Contentful Paint',
      value: Math.round(metrics.largestContentfulPaint),
      threshold: PERFORMANCE_THRESHOLDS.LARGEST_CONTENTFUL_PAINT,
      unit: 'ms',
      status: lcpStatus
    });

    const clsStatus = metrics.cumulativeLayoutShift <= PERFORMANCE_THRESHOLDS.CUMULATIVE_LAYOUT_SHIFT ? 'PASS' : 'FAIL';
    results.push({
      metric: 'Cumulative Layout Shift',
      value: metrics.cumulativeLayoutShift.toFixed(3),
      threshold: PERFORMANCE_THRESHOLDS.CUMULATIVE_LAYOUT_SHIFT,
      status: clsStatus
    });

    const tbtStatus = metrics.totalBlockingTime <= PERFORMANCE_THRESHOLDS.TOTAL_BLOCKING_TIME ? 'PASS' : 'FAIL';
    results.push({
      metric: 'Total Blocking Time',
      value: Math.round(metrics.totalBlockingTime),
      threshold: PERFORMANCE_THRESHOLDS.TOTAL_BLOCKING_TIME,
      unit: 'ms',
      status: tbtStatus
    });

    // Display results
    results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      const unit = result.unit ? result.unit : '';
      console.log(`${statusIcon} ${result.metric}: ${result.value}${unit} (threshold: ${result.threshold}${unit})`);
    });

    // Additional metrics for information
    console.log('\n📈 Additional Metrics');
    console.log('-'.repeat(30));
    console.log(`⏱️  Speed Index: ${Math.round(metrics.speedIndex)}ms`);
    console.log(`🎯 Time to Interactive: ${Math.round(metrics.timeToInteractive)}ms`);

    // Analyze failed tests
    const failedTests = results.filter(r => r.status === 'FAIL');
    const passedTests = results.filter(r => r.status === 'PASS');

    console.log('\n📋 Performance Summary');
    console.log('=' .repeat(40));
    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);

    if (failedTests.length > 0) {
      console.log('\n❌ Failed Performance Tests:');
      failedTests.forEach(test => {
        const unit = test.unit ? test.unit : '';
        console.log(`   • ${test.metric}: ${test.value}${unit} (needs: ${test.threshold}${unit})`);
      });

      console.log('\n💡 Performance Recommendations:');
      generateRecommendations(failedTests, metrics, scores);

      console.log('\n❌ Performance validation failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All performance tests passed!');
    }

    // Generate performance badge data
    generatePerformanceBadge(scores, metrics);

    return {
      scores,
      metrics,
      results,
      passed: failedTests.length === 0
    };

  } catch (error) {
    console.error('❌ Performance analysis failed:', error.message);
    process.exit(1);
  }
}

function generateRecommendations(failedTests, metrics, scores) {
  const recommendations = [];

  failedTests.forEach(test => {
    switch (test.metric) {
      case 'Performance Score':
        if (scores.performance < 50) {
          recommendations.push('• Consider implementing server-side rendering or static generation');
          recommendations.push('• Optimize images and use next-generation formats (WebP, AVIF)');
          recommendations.push('• Implement code splitting and lazy loading');
        } else if (scores.performance < 75) {
          recommendations.push('• Optimize critical rendering path');
          recommendations.push('• Minify and compress JavaScript and CSS');
        }
        break;

      case 'First Contentful Paint':
        recommendations.push('• Reduce server response time');
        recommendations.push('• Eliminate render-blocking resources');
        recommendations.push('• Use resource hints (preload, prefetch)');
        break;

      case 'Largest Contentful Paint':
        recommendations.push('• Optimize largest image or text element');
        recommendations.push('• Use CDN for faster asset delivery');
        recommendations.push('• Implement proper image sizing and compression');
        break;

      case 'Cumulative Layout Shift':
        recommendations.push('• Set explicit dimensions for images and videos');
        recommendations.push('• Avoid inserting content above existing content');
        recommendations.push('• Use CSS aspect-ratio for responsive images');
        break;

      case 'Total Blocking Time':
        recommendations.push('• Break up long JavaScript tasks');
        recommendations.push('• Use web workers for heavy computations');
        recommendations.push('• Defer non-critical JavaScript');
        break;

      case 'Accessibility Score':
        recommendations.push('• Ensure proper color contrast ratios');
        recommendations.push('• Add alt text to all images');
        recommendations.push('• Implement proper ARIA labels and roles');
        break;
    }
  });

  // Remove duplicates and display
  [...new Set(recommendations)].forEach(rec => console.log(rec));
}

function generatePerformanceBadge(scores, metrics) {
  const badgeData = {
    performance: scores.performance,
    accessibility: scores.accessibility,
    bestPractices: scores.bestPractices,
    seo: scores.seo,
    fcp: Math.round(metrics.firstContentfulPaint),
    lcp: Math.round(metrics.largestContentfulPaint),
    cls: metrics.cumulativeLayoutShift.toFixed(3),
    tbt: Math.round(metrics.totalBlockingTime),
    timestamp: new Date().toISOString()
  };

  const badgePath = path.join(process.cwd(), 'performance-badge.json');
  fs.writeFileSync(badgePath, JSON.stringify(badgeData, null, 2));

  console.log(`\n📊 Performance badge data saved to: ${badgePath}`);
}

// Run if called directly
if (require.main === module) {
  analyzePerformance().catch(error => {
    console.error('Performance check failed:', error);
    process.exit(1);
  });
}

module.exports = { analyzePerformance, PERFORMANCE_THRESHOLDS };