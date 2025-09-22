/**
 * E2E Tests for User Authentication
 * Tests complete authentication workflows across browsers
 */

import { test, expect } from '@playwright/test'

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Should redirect to sign-in page or show sign-in form
    await expect(page).toHaveURL(/\/auth\/signin/)

    // Verify sign-in page elements
    await expect(page.locator('h1, h2')).toContainText(/sign in|login/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle user registration flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/auth/signin')

    // Look for registration link or form
    const registerLink = page.locator('a').filter({ hasText: /sign up|register|create account/i })

    if (await registerLink.isVisible()) {
      await registerLink.click()

      // Fill registration form
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'e2e-test@example.com')
      await page.fill('input[name="password"]', 'TestPassword123!')

      // Submit registration
      await page.click('button[type="submit"]')

      // Should either redirect to dashboard or show verification message
      await expect(page.locator('body')).toContainText(/welcome|verify|dashboard|success/i)
    }
  })

  test('should authenticate with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin')

    // Fill login form
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')

    // Submit login
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

    // Verify user is authenticated
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('nav, header')).toContainText(/dashboard|companies|contacts|deals/i)
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')

    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit login
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('body')).toContainText(/invalid|incorrect|error|failed/i)

    // Should remain on login page
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/signin')

    // Fill with invalid email format
    await page.fill('input[type="email"]', 'not-an-email')
    await page.fill('input[type="password"]', 'somepassword')

    // Attempt to submit
    await page.click('button[type="submit"]')

    // Should show validation error (either browser native or custom)
    const emailInput = page.locator('input[type="email"]')
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)

    expect(validationMessage).toBeTruthy()
  })

  test('should handle logout functionality', async ({ page }) => {
    // First login
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)

    // Find and click logout
    const logoutButton = page.locator('button, a').filter({ hasText: /logout|sign out/i })
    await logoutButton.click()

    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 5000 })

    // Should not be able to access protected routes
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page directly
    await page.goto('/dashboard/companies')

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/signin/)

    // Login
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Should redirect back to intended page
    await expect(page).toHaveURL(/\/dashboard\/companies/)
  })

  test('should handle session timeout gracefully', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    // Simulate session expiration by clearing cookies
    await page.context().clearCookies()

    // Try to access protected page
    await page.goto('/dashboard/companies')

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should persist login state across browser refresh', async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    // Refresh the page
    await page.reload()

    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('nav, header')).toContainText(/dashboard|companies/i)
  })

  test('should handle loading states during authentication', async ({ page }) => {
    await page.goto('/auth/signin')

    // Fill form
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')

    // Watch for loading state when submitting
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Button should show loading state or be disabled
    await expect(submitButton).toHaveAttribute('disabled', '')
      .or(expect(submitButton).toContainText(/loading|signing/i))
  })

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/auth/signin')

    // Navigate using tab key
    await page.keyboard.press('Tab') // Focus first element
    await page.keyboard.press('Tab') // Should focus email input

    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeFocused()

    // Type email
    await page.keyboard.type('e2e-test@example.com')

    // Tab to password
    await page.keyboard.press('Tab')
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeFocused()

    // Type password
    await page.keyboard.type('TestPassword123!')

    // Tab to submit button
    await page.keyboard.press('Tab')
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeFocused()

    // Submit with Enter
    await page.keyboard.press('Enter')

    // Should authenticate
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('/auth/signin')

    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.locator('button').filter({ hasText: /show|hide|eye/i })

    if (await toggleButton.isVisible()) {
      // Type password
      await passwordInput.fill('TestPassword123!')

      // Click toggle to show password
      await toggleButton.click()

      // Input type should change to text
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click toggle to hide password
      await toggleButton.click()

      // Input type should change back to password
      await expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/auth/signin')

    const forgotPasswordLink = page.locator('a').filter({ hasText: /forgot.*password|reset.*password/i })

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click()

      // Should navigate to forgot password page
      await expect(page).toHaveURL(/\/auth\/forgot-password/)

      // Fill email for password reset
      await page.fill('input[type="email"]', 'e2e-test@example.com')
      await page.click('button[type="submit"]')

      // Should show success message
      await expect(page.locator('body')).toContainText(/sent|check.*email|reset.*link/i)
    }
  })
})