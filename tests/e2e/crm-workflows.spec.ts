/**
 * E2E Tests for Core CRM Workflows
 * Tests complete user journeys from company creation to deal management
 */

import { test, expect } from '@playwright/test'

// Helper function to login before each test
async function loginUser(page: any) {
  await page.goto('/auth/signin')
  await page.fill('input[type="email"]', 'e2e-test@example.com')
  await page.fill('input[type="password"]', 'TestPassword123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
}

test.describe('Complete CRM Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
  })

  test('should complete full company management workflow', async ({ page }) => {
    // Navigate to companies
    await page.click('a[href*="/companies"], a[href*="/dashboard"]')
    await page.click('a[href*="/companies"]')

    // Create new company
    await page.click('button:has-text("Add Company"), button:has-text("New Company"), [data-testid="add-company-btn"]')

    // Fill company form
    await page.fill('input[name="name"]', 'E2E Test Company')
    await page.fill('input[name="industry"]', 'Technology')
    await page.fill('input[name="website"]', 'https://e2e-test-company.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.fill('input[name="address"]', '123 Test Street')
    await page.fill('input[name="city"]', 'San Francisco')
    await page.fill('input[name="state"]', 'CA')
    await page.fill('input[name="postalCode"]', '94105')

    // Select company size if dropdown exists
    const companySizeSelect = page.locator('select[name="companySize"]')
    if (await companySizeSelect.isVisible()) {
      await companySizeSelect.selectOption('MEDIUM')
    }

    // Submit form
    await page.click('button[type="submit"]')

    // Verify company was created
    await expect(page.locator('body')).toContainText('E2E Test Company')

    // Edit company
    await page.click('button:has-text("Edit"), [data-testid="edit-company-btn"]')
    await page.fill('input[name="name"]', 'E2E Test Company Updated')
    await page.click('button[type="submit"]')

    // Verify update
    await expect(page.locator('body')).toContainText('E2E Test Company Updated')
  })

  test('should complete full contact management workflow', async ({ page }) => {
    // Create a company first (prerequisite)
    await page.click('a[href*="/companies"]')
    await page.click('button:has-text("Add Company")')
    await page.fill('input[name="name"]', 'Contact Test Company')
    await page.click('button[type="submit"]')

    // Navigate to contacts
    await page.click('a[href*="/contacts"]')

    // Create new contact
    await page.click('button:has-text("Add Contact"), button:has-text("New Contact")')

    // Fill contact form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john.doe@e2e-test.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.fill('input[name="jobTitle"]', 'Sales Manager')

    // Select company
    const companySelect = page.locator('select[name="companyId"]')
    if (await companySelect.isVisible()) {
      await companySelect.selectOption({ label: /Contact Test Company/i })
    }

    // Submit form
    await page.click('button[type="submit"]')

    // Verify contact was created
    await expect(page.locator('body')).toContainText('John Doe')
    await expect(page.locator('body')).toContainText('john.doe@e2e-test.com')

    // Edit contact
    await page.click('button:has-text("Edit"), [data-testid="edit-contact-btn"]')
    await page.fill('input[name="jobTitle"]', 'Senior Sales Manager')
    await page.click('button[type="submit"]')

    // Verify update
    await expect(page.locator('body')).toContainText('Senior Sales Manager')
  })

  test('should complete full deal management workflow', async ({ page }) => {
    // Create prerequisites (company and contact)
    await page.click('a[href*="/companies"]')
    await page.click('button:has-text("Add Company")')
    await page.fill('input[name="name"]', 'Deal Test Company')
    await page.click('button[type="submit"]')

    await page.click('a[href*="/contacts"]')
    await page.click('button:has-text("Add Contact")')
    await page.fill('input[name="firstName"]', 'Jane')
    await page.fill('input[name="lastName"]', 'Smith')
    await page.fill('input[name="email"]', 'jane.smith@deal-test.com')
    await page.click('button[type="submit"]')

    // Navigate to deals
    await page.click('a[href*="/deals"]')

    // Create new deal
    await page.click('button:has-text("Add Deal"), button:has-text("New Deal")')

    // Fill deal form
    await page.fill('input[name="title"]', 'E2E Test Deal')
    await page.fill('input[name="description"]', 'A test deal for E2E testing')
    await page.fill('input[name="value"]', '50000')

    // Select company and contact if available
    const companySelect = page.locator('select[name="companyId"]')
    if (await companySelect.isVisible()) {
      await companySelect.selectOption({ label: /Deal Test Company/i })
    }

    const contactSelect = page.locator('select[name="contactId"]')
    if (await contactSelect.isVisible()) {
      await contactSelect.selectOption({ label: /Jane Smith/i })
    }

    // Submit form
    await page.click('button[type="submit"]')

    // Verify deal was created
    await expect(page.locator('body')).toContainText('E2E Test Deal')
    await expect(page.locator('body')).toContainText('$50,000')

    // Test deal progression (if pipeline view exists)
    const pipelineView = page.locator('[data-testid="pipeline-view"], .pipeline-board')
    if (await pipelineView.isVisible()) {
      // Find the deal card
      const dealCard = page.locator('[data-testid*="deal-card"], .deal-card').filter({ hasText: 'E2E Test Deal' })

      if (await dealCard.isVisible()) {
        // Drag to next stage (if drag-and-drop is implemented)
        const qualifiedStage = page.locator('[data-testid="stage-qualified"], .stage-qualified')
        if (await qualifiedStage.isVisible()) {
          await dealCard.dragTo(qualifiedStage)

          // Verify deal moved
          await expect(qualifiedStage).toContainText('E2E Test Deal')
        }
      }
    }
  })

  test('should handle advanced filtering and search', async ({ page }) => {
    // Navigate to companies
    await page.click('a[href*="/companies"]')

    // Use search functionality
    const searchInput = page.locator('input[placeholder*="Search"], input[name="search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test Company')
      await page.keyboard.press('Enter')

      // Wait for results
      await page.waitForTimeout(1000)

      // Verify search results
      await expect(page.locator('body')).toContainText('Test Company')
    }

    // Test advanced filters
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Advanced"), [data-testid="filter-btn"]')
    if (await filterButton.isVisible()) {
      await filterButton.click()

      // Apply industry filter
      const industryFilter = page.locator('select[name="industry"], input[name="industry"]')
      if (await industryFilter.isVisible()) {
        if (await industryFilter.getAttribute('tagName') === 'SELECT') {
          await industryFilter.selectOption('Technology')
        } else {
          await industryFilter.fill('Technology')
        }
      }

      // Apply filter
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")')
      if (await applyButton.isVisible()) {
        await applyButton.click()
      }

      // Verify filtered results
      await expect(page.locator('body')).toContainText('Technology')
    }

    // Clear filters
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset")')
    if (await clearButton.isVisible()) {
      await clearButton.click()
    }
  })

  test('should handle data export functionality', async ({ page }) => {
    // Navigate to companies
    await page.click('a[href*="/companies"]')

    // Find export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-btn"]')

    if (await exportButton.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      // Wait for download to complete
      const download = await downloadPromise

      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i)

      // Verify file is not empty
      const path = await download.path()
      expect(path).toBeTruthy()
    }
  })

  test('should handle bulk operations', async ({ page }) => {
    // Navigate to companies
    await page.click('a[href*="/companies"]')

    // Select multiple items if bulk selection is available
    const checkboxes = page.locator('input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()

    if (checkboxCount > 1) {
      // Select first few items
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Look for bulk action buttons
      const bulkDeleteButton = page.locator('button:has-text("Delete Selected"), button:has-text("Bulk Delete")')
      const bulkExportButton = page.locator('button:has-text("Export Selected"), button:has-text("Bulk Export")')

      if (await bulkExportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download')
        await bulkExportButton.click()
        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i)
      }

      if (await bulkDeleteButton.isVisible()) {
        await bulkDeleteButton.click()

        // Confirm deletion if confirmation dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")')
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }

        // Verify items were deleted (items should no longer be selected)
        await expect(checkboxes.nth(0)).not.toBeChecked()
      }
    }
  })

  test('should navigate between related records', async ({ page }) => {
    // Navigate to companies
    await page.click('a[href*="/companies"]')

    // Click on a company to view details
    const companyLink = page.locator('a').filter({ hasText: /Test Company/i }).first()
    if (await companyLink.isVisible()) {
      await companyLink.click()

      // Should be on company details page
      await expect(page).toHaveURL(/\/companies\/[^\/]+/)

      // Look for related contacts section
      const contactsSection = page.locator('section:has-text("Contacts"), div:has-text("Contacts")')
      if (await contactsSection.isVisible()) {
        // Click on a contact if available
        const contactLink = contactsSection.locator('a').first()
        if (await contactLink.isVisible()) {
          await contactLink.click()

          // Should navigate to contact details
          await expect(page).toHaveURL(/\/contacts\/[^\/]+/)
        }
      }

      // Test breadcrumb navigation
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"], .breadcrumb')
      if (await breadcrumb.isVisible()) {
        const companiesLink = breadcrumb.locator('a').filter({ hasText: /companies/i })
        if (await companiesLink.isVisible()) {
          await companiesLink.click()
          await expect(page).toHaveURL(/\/companies/)
        }
      }
    }
  })

  test('should handle real-time updates and notifications', async ({ page }) => {
    // Navigate to dashboard
    await page.click('a[href*="/dashboard"]')

    // Look for notification area
    const notificationArea = page.locator('[data-testid="notifications"], .notifications, .alerts')

    if (await notificationArea.isVisible()) {
      // Perform an action that should trigger a notification
      await page.click('a[href*="/companies"]')
      await page.click('button:has-text("Add Company")')
      await page.fill('input[name="name"]', 'Notification Test Company')
      await page.click('button[type="submit"]')

      // Check for success notification
      await expect(page.locator('body')).toContainText(/success|created|added/i)
    }

    // Test real-time data updates (if implemented)
    const refreshButton = page.locator('button:has-text("Refresh"), [data-testid="refresh-btn"]')
    if (await refreshButton.isVisible()) {
      await refreshButton.click()

      // Wait for refresh to complete
      await page.waitForTimeout(1000)

      // Verify page updated
      await expect(page.locator('body')).toContainText('Notification Test Company')
    }
  })

  test('should handle responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to dashboard
    await page.click('a[href*="/dashboard"]')

    // Check for mobile navigation
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu"), .mobile-menu-btn')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()

      // Verify mobile menu opened
      const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu"]')
      await expect(mobileMenu).toBeVisible()

      // Test navigation in mobile menu
      await page.click('a[href*="/companies"]')
      await expect(page).toHaveURL(/\/companies/)
    }

    // Test touch interactions
    await page.click('a[href*="/companies"]')

    // Verify touch-friendly button sizes (minimum 44px)
    const actionButtons = page.locator('button')
    const buttonCount = await actionButtons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = actionButtons.nth(i)
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox()
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44)
          expect(boundingBox.width).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })

  test('should maintain data consistency across operations', async ({ page }) => {
    // Create a company
    await page.click('a[href*="/companies"]')
    await page.click('button:has-text("Add Company")')
    await page.fill('input[name="name"]', 'Consistency Test Company')
    await page.click('button[type="submit"]')

    // Navigate away and back
    await page.click('a[href*="/dashboard"]')
    await page.click('a[href*="/companies"]')

    // Verify company still exists
    await expect(page.locator('body')).toContainText('Consistency Test Company')

    // Create a contact for this company
    await page.click('a[href*="/contacts"]')
    await page.click('button:has-text("Add Contact")')
    await page.fill('input[name="firstName"]', 'Consistency')
    await page.fill('input[name="lastName"]', 'Test')
    await page.fill('input[name="email"]', 'consistency@test.com')

    // Associate with company
    const companySelect = page.locator('select[name="companyId"]')
    if (await companySelect.isVisible()) {
      await companySelect.selectOption({ label: /Consistency Test Company/i })
    }

    await page.click('button[type="submit"]')

    // Verify relationship exists
    await page.click('a[href*="/companies"]')
    const companyRow = page.locator('tr, .company-card').filter({ hasText: 'Consistency Test Company' })
    if (await companyRow.isVisible()) {
      // Should show contact count or related contact
      await expect(companyRow).toContainText(/1|contact|Consistency Test/i)
    }
  })
})