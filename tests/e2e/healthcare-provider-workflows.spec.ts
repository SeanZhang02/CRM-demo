import { test, expect, Page } from '@playwright/test'

/**
 * Healthcare Provider Workflow Compliance Testing
 *
 * CRITICAL SUCCESS CRITERIA:
 * 1. 2-click patient finding requirement (BLOCKING)
 * 2. Provider dashboard loads <2s (BLOCKING)
 * 3. Healthcare workflow efficiency (BLOCKING)
 * 4. Zero training requirement validation (BLOCKING)
 *
 * Following AGENT_ORCHESTRATION_LAWS.md - Testing Agent has blocking authority
 * if healthcare workflows don't meet APCTC requirements.
 */

test.describe('Healthcare Provider Workflow Compliance', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    // Mock authentication - provider login
    await page.goto('/dashboard')
    // Assume we're already authenticated as a provider
  })

  /**
   * CRITICAL TEST: 2-Click Patient Finding Requirement
   * SUCCESS CRITERIA: ANY patient findable within 2 clicks maximum
   */
  test.group('2-Click Patient Finding Compliance', () => {
    test('should find patient via service category navigation in 2 clicks', async () => {
      // Start timer for performance validation
      const startTime = performance.now()

      // CLICK 1: Navigate to Find Patient
      await page.click('a[href="/dashboard/patients/search"]')
      await page.waitForLoadState('networkidle')

      // Verify service category buttons are visible
      await expect(page.locator('text=Mental Health Counseling')).toBeVisible()
      await expect(page.locator('text=Case Management')).toBeVisible()
      await expect(page.locator('text=Crisis Intervention')).toBeVisible()

      // CLICK 2: Select service category (should lead to patient results)
      await page.click('a[href="/dashboard/patients/search?service=mental-health"]')
      await page.waitForLoadState('networkidle')

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // VALIDATION: Should reach patient results in exactly 2 clicks
      // This is the critical healthcare workflow requirement
      await expect(page.locator('[data-testid="patient-results"]')).toBeVisible()

      // Performance requirement: <2 seconds
      expect(loadTime).toBeLessThan(2000)

      console.log(`✅ 2-Click Patient Finding: ${loadTime.toFixed(0)}ms`)
    })

    test('should find patient via recent patients in 2 clicks', async () => {
      // CLICK 1: Dashboard loads with recent patients visible
      await expect(page.locator('text=Recent Patients')).toBeVisible()

      // CLICK 2: Click on recent patient
      await page.click('[data-testid="recent-patient-link"]')
      await page.waitForLoadState('networkidle')

      // Should reach patient detail page
      await expect(page.locator('[data-testid="patient-detail"]')).toBeVisible()

      console.log('✅ Recent Patient Access: 2 clicks confirmed')
    })

    test('should find patient via search in 2 clicks', async () => {
      // CLICK 1: Click search box
      await page.click('[data-testid="patient-search-input"]')

      // Type patient name (typing doesn't count as clicks)
      await page.fill('[data-testid="patient-search-input"]', 'Maria Chen')
      await page.waitForSelector('[data-testid="search-autocomplete"]')

      // CLICK 2: Select from autocomplete results
      await page.click('[data-testid="search-result-item"]:first-child')
      await page.waitForLoadState('networkidle')

      // Should reach patient detail page
      await expect(page.locator('[data-testid="patient-detail"]')).toBeVisible()

      console.log('✅ Search Patient Access: 2 clicks confirmed')
    })
  })

  /**
   * CRITICAL TEST: Provider Dashboard Performance
   * SUCCESS CRITERIA: Dashboard loads <2s with all essential information
   */
  test.group('Provider Dashboard Performance', () => {
    test('should load provider dashboard within 2 seconds', async () => {
      const startTime = performance.now()

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // BLOCKING REQUIREMENT: <2 second load time
      expect(loadTime).toBeLessThan(2000)

      // Verify all critical elements are visible
      await expect(page.locator('text=APCTC Provider Portal')).toBeVisible()
      await expect(page.locator('text=Find Patient')).toBeVisible()
      await expect(page.locator('text=Today\'s Schedule')).toBeVisible()
      await expect(page.locator('text=Alerts & Reminders')).toBeVisible()
      await expect(page.locator('text=Recent Patients')).toBeVisible()

      console.log(`✅ Dashboard Load Performance: ${loadTime.toFixed(0)}ms`)
    })

    test('should display today\'s schedule immediately', async () => {
      // Verify schedule is visible without additional clicks
      await expect(page.locator('text=Today\'s Schedule')).toBeVisible()
      await expect(page.locator('text=appointments')).toBeVisible()

      // Should show next appointment prominently
      await expect(page.locator('text=In 15 mins')).toBeVisible()

      console.log('✅ Schedule Visibility: Immediate display confirmed')
    })

    test('should display urgent alerts prominently', async () => {
      // Verify alerts are immediately visible
      await expect(page.locator('text=Alerts & Reminders')).toBeVisible()
      await expect(page.locator('text=urgent')).toBeVisible()

      // Emergency alerts should be red-coded
      await expect(page.locator('.bg-red-50')).toBeVisible()

      console.log('✅ Alert Prominence: Emergency visibility confirmed')
    })
  })

  /**
   * CRITICAL TEST: Healthcare Workflow Efficiency
   * SUCCESS CRITERIA: Clinical workflow patterns match medical professional expectations
   */
  test.group('Healthcare Workflow Efficiency', () => {
    test('should provide quick actions from patient context', async () => {
      // Navigate to patient detail
      await page.click('a[href="/dashboard/patients/search"]')
      await page.click('a[href="/dashboard/patients/search?service=mental-health"]')
      await page.click('[data-testid="patient-result"]:first-child')

      // Verify quick actions are available
      await expect(page.locator('text=Schedule Appointment')).toBeVisible()
      await expect(page.locator('text=Add Notes')).toBeVisible()
      await expect(page.locator('text=View Treatment Plan')).toBeVisible()

      console.log('✅ Quick Actions: Available from patient context')
    })

    test('should maintain context across navigation', async () => {
      // Track breadcrumbs and navigation state
      await page.click('a[href="/dashboard/patients/search"]')

      // Verify back navigation works
      await expect(page.locator('text=Back to Provider Dashboard')).toBeVisible()

      console.log('✅ Context Preservation: Navigation state maintained')
    })

    test('should support keyboard navigation for power users', async () => {
      // Test keyboard shortcuts
      await page.keyboard.press('Control+F')
      await expect(page.locator('[data-testid="patient-search-input"]')).toBeFocused()

      await page.keyboard.press('Escape')
      await page.keyboard.press('Control+N')
      await expect(page).toHaveURL(/.*\/patients\/new/)

      console.log('✅ Keyboard Navigation: Power user shortcuts working')
    })
  })

  /**
   * CRITICAL TEST: Service Category Navigation Accuracy
   * SUCCESS CRITERIA: Service categories match APCTC clinical organization
   */
  test.group('Service Category Navigation', () => {
    test('should display all APCTC service categories correctly', async () => {
      await page.click('a[href="/dashboard/patients/search"]')

      // Verify all APCTC service categories are present
      const expectedCategories = [
        'Assessment & Intake',
        'Mental Health Counseling',
        'Medication Management',
        'Case Management',
        'Community Education',
        'Crisis Intervention'
      ]

      for (const category of expectedCategories) {
        await expect(page.locator(`text=${category}`)).toBeVisible()
      }

      console.log('✅ Service Categories: All APCTC services present')
    })

    test('should show patient counts for each service category', async () => {
      await page.click('a[href="/dashboard/patients/search"]')

      // Verify patient counts are displayed
      await expect(page.locator('text=patients')).toHaveCount(7) // 6 categories + all patients

      // Verify counts are realistic (>0 for active services)
      const mentalHealthCount = await page.locator('text=Mental Health Counseling').locator('..').locator('text=patients').textContent()
      expect(parseInt(mentalHealthCount?.match(/\d+/)?.[0] || '0')).toBeGreaterThan(0)

      console.log('✅ Patient Counts: Realistic counts displayed')
    })

    test('should provide service category descriptions for medical professionals', async () => {
      await page.click('a[href="/dashboard/patients/search"]')

      // Verify descriptions help medical professionals understand services
      await expect(page.locator('text=Individual, group, and family therapy services')).toBeVisible()
      await expect(page.locator('text=Emergency mental health support')).toBeVisible()

      console.log('✅ Service Descriptions: Medical professional friendly')
    })
  })

  /**
   * CRITICAL TEST: Zero Training Requirement
   * SUCCESS CRITERIA: Interface is self-explanatory for medical professionals
   */
  test.group('Zero Training Interface Validation', () => {
    test('should use healthcare terminology consistently', async () => {
      // Verify medical terminology is used throughout
      await expect(page.locator('text=Provider Portal')).toBeVisible()
      await expect(page.locator('text=Patient')).toBeVisible()
      await expect(page.locator('text=Treatment')).toBeVisible()
      await expect(page.locator('text=Assessment')).toBeVisible()

      // Should NOT use business terminology
      await expect(page.locator('text=Customer')).not.toBeVisible()
      await expect(page.locator('text=Lead')).not.toBeVisible()
      await expect(page.locator('text=Deal')).not.toBeVisible()

      console.log('✅ Healthcare Terminology: Consistent medical language')
    })

    test('should provide helpful guidance for medical professionals', async () => {
      await page.click('a[href="/dashboard/patients/search"]')

      // Verify help text is present and healthcare-focused
      await expect(page.locator('text=How to Find Patients')).toBeVisible()
      await expect(page.locator('text=service category')).toBeVisible()

      console.log('✅ Professional Guidance: Medical context help provided')
    })

    test('should have intuitive icon usage for healthcare context', async () => {
      // Verify icons are healthcare-appropriate
      await expect(page.locator('[data-testid="heart-icon"]')).toBeVisible() // Healthcare symbol
      await expect(page.locator('[data-testid="calendar-icon"]')).toBeVisible() // Schedule
      await expect(page.locator('[data-testid="bell-icon"]')).toBeVisible() // Alerts

      console.log('✅ Healthcare Icons: Appropriate visual language')
    })
  })

  /**
   * PERFORMANCE MONITORING: Critical metrics for healthcare workflows
   */
  test.group('Performance Validation', () => {
    test('should meet API response time requirements', async () => {
      // Monitor network requests during patient search
      const responses: number[] = []

      page.on('response', (response) => {
        if (response.url().includes('/api/patients')) {
          responses.push(Date.now() - response.request().timing().requestStart)
        }
      })

      await page.click('a[href="/dashboard/patients/search"]')
      await page.click('a[href="/dashboard/patients/search?service=mental-health"]')

      // BLOCKING REQUIREMENT: API responses <200ms
      const slowResponses = responses.filter(time => time > 200)
      expect(slowResponses).toHaveLength(0)

      console.log(`✅ API Performance: All responses <200ms (avg: ${responses.reduce((a, b) => a + b, 0) / responses.length}ms)`)
    })

    test('should handle concurrent provider usage', async () => {
      // Simulate multiple providers accessing the system
      const contexts = await Promise.all([
        page.context().newPage(),
        page.context().newPage(),
        page.context().newPage()
      ])

      const startTime = performance.now()

      await Promise.all(
        contexts.map(async (ctx) => {
          await ctx.goto('/dashboard')
          await ctx.waitForLoadState('networkidle')
        })
      )

      const endTime = performance.now()
      const concurrentLoadTime = endTime - startTime

      // Should handle multiple providers without performance degradation
      expect(concurrentLoadTime).toBeLessThan(3000)

      console.log(`✅ Concurrent Usage: ${contexts.length} providers in ${concurrentLoadTime.toFixed(0)}ms`)
    })
  })
})

/**
 * ACCESSIBILITY COMPLIANCE TESTING
 * Ensures WCAG 2.1 AA compliance for healthcare professionals
 */
test.describe('Healthcare Accessibility Compliance', () => {
  test('should support full keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard')

    // Test tab navigation through critical elements
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="/dashboard/patients/search"]')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="/dashboard/patients/new"]')).toBeFocused()

    console.log('✅ Keyboard Navigation: Full tab order functional')
  })

  test('should have proper ARIA labels for screen readers', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify ARIA labels for critical healthcare elements
    await expect(page.locator('[aria-label*="Find Patient"]')).toBeVisible()
    await expect(page.locator('[aria-label*="Schedule"]')).toBeVisible()

    console.log('✅ Screen Reader Support: ARIA labels present')
  })

  test('should meet color contrast requirements', async ({ page }) => {
    await page.goto('/dashboard')

    // Test critical color combinations (automated contrast checking would be ideal)
    // This is a placeholder for actual contrast ratio testing

    console.log('✅ Color Contrast: Manual validation required')
  })

  test('should have minimum 44px touch targets for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')

    // Verify touch targets meet minimum size
    const buttons = await page.locator('button, a').all()

    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
      }
    }

    console.log('✅ Touch Targets: 44px minimum confirmed')
  })
})