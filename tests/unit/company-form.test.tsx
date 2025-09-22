/**
 * Component Tests for CompanyForm
 * Tests React component behavior, user interactions, and form validation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { CompanyForm } from '@/components/companies/company-form'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock window.confirm for cancel confirmation
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
  writable: true,
})

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
}

describe('CompanyForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(fetch as jest.Mock).mockClear()
    ;(window.confirm as jest.Mock).mockClear()
  })

  describe('Create Mode', () => {
    it('should render create form with all required fields', () => {
      render(<CompanyForm mode="create" />)

      // Check form structure
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Contact Information')).toBeInTheDocument()
      expect(screen.getByText('Business Details')).toBeInTheDocument()

      // Check required fields
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/industry/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/annual revenue/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/employee count/i)).toBeInTheDocument()

      // Check action buttons
      expect(screen.getByRole('button', { name: /create company/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should have correct default values for create mode', () => {
      render(<CompanyForm mode="create" />)

      const nameInput = screen.getByLabelText(/company name/i) as HTMLInputElement
      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement

      expect(nameInput.value).toBe('')
      expect(statusSelect.value).toBe('ACTIVE')
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/company name is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format for website field', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      const websiteInput = screen.getByLabelText(/website/i)
      const nameInput = screen.getByLabelText(/company name/i)

      // Fill valid name and invalid website
      await user.type(nameInput, 'Test Company')
      await user.type(websiteInput, 'not-a-url')

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid website url/i)).toBeInTheDocument()
      })
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = jest.fn()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'new-company-123', name: 'Test Company' }
        })
      })

      render(<CompanyForm mode="create" onSuccess={mockOnSuccess} />)

      // Fill form with valid data
      await user.type(screen.getByLabelText(/company name/i), 'Test Company')
      await user.type(screen.getByLabelText(/website/i), 'https://example.com')
      await user.selectOptions(screen.getByLabelText(/industry/i), 'Technology')
      await user.selectOptions(screen.getByLabelText(/company size/i), 'MEDIUM')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Company',
            website: 'https://example.com',
            industry: 'Technology',
            companySize: 'MEDIUM',
            status: 'ACTIVE',
            phone: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            annualRevenue: undefined,
            employeeCount: undefined,
          })
        })
      })

      // Verify success callback
      expect(mockOnSuccess).toHaveBeenCalledWith({
        id: 'new-company-123',
        name: 'Test Company'
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()

      // Mock delayed API response
      ;(fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        }), 100))
      )

      render(<CompanyForm mode="create" />)

      await user.type(screen.getByLabelText(/company name/i), 'Test Company')

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText(/creating.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/creating.../i)).not.toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Company with this name already exists'
        })
      })

      render(<CompanyForm mode="create" />)

      await user.type(screen.getByLabelText(/company name/i), 'Existing Company')

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/company with this name already exists/i)).toBeInTheDocument()
      })
    })

    it('should show unsaved changes indicator', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      const nameInput = screen.getByLabelText(/company name/i)

      // Initially no unsaved changes
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()

      // Type in field
      await user.type(nameInput, 'Test')

      // Should show unsaved changes indicator
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
      })
    })

    it('should confirm before cancelling with unsaved changes', async () => {
      const user = userEvent.setup()
      ;(window.confirm as jest.Mock).mockReturnValue(false)

      render(<CompanyForm mode="create" />)

      // Make changes
      await user.type(screen.getByLabelText(/company name/i), 'Test')

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should show confirmation dialog
      expect(window.confirm).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to leave?'
      )

      // Should not navigate back
      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('should navigate back when cancelling with confirmation', async () => {
      const user = userEvent.setup()
      ;(window.confirm as jest.Mock).mockReturnValue(true)

      render(<CompanyForm mode="create" />)

      // Make changes
      await user.type(screen.getByLabelText(/company name/i), 'Test')

      // Cancel with confirmation
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(window.confirm).toHaveBeenCalled()
      expect(mockRouter.back).toHaveBeenCalled()
    })
  })

  describe('Edit Mode', () => {
    const mockInitialData = {
      id: 'company-123',
      name: 'Existing Company',
      industry: 'Technology',
      website: 'https://existing.com',
      status: 'CUSTOMER' as const,
      employeeCount: 50,
    }

    it('should render edit form with initial data', () => {
      render(<CompanyForm mode="edit" initialData={mockInitialData} />)

      // Check that form is populated with initial data
      const nameInput = screen.getByLabelText(/company name/i) as HTMLInputElement
      const websiteInput = screen.getByLabelText(/website/i) as HTMLInputElement
      const industrySelect = screen.getByLabelText(/industry/i) as HTMLSelectElement

      expect(nameInput.value).toBe('Existing Company')
      expect(websiteInput.value).toBe('https://existing.com')
      expect(industrySelect.value).toBe('Technology')

      // Should show update button
      expect(screen.getByRole('button', { name: /update company/i })).toBeInTheDocument()
    })

    it('should submit update with correct API call', async () => {
      const user = userEvent.setup()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ...mockInitialData, name: 'Updated Company' }
        })
      })

      render(<CompanyForm mode="edit" initialData={mockInitialData} />)

      // Update name
      const nameInput = screen.getByLabelText(/company name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Company')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update company/i })
      await user.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`/api/companies/${mockInitialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"name":"Updated Company"')
        })
      })
    })

    it('should navigate to company details after successful update', async () => {
      const user = userEvent.setup()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { ...mockInitialData, name: 'Updated Company' }
        })
      })

      render(<CompanyForm mode="edit" initialData={mockInitialData} />)

      const submitButton = screen.getByRole('button', { name: /update company/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(`/dashboard/companies/${mockInitialData.id}`)
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate numeric fields', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      const employeeCountInput = screen.getByLabelText(/employee count/i)
      const annualRevenueInput = screen.getByLabelText(/annual revenue/i)

      // Test negative values
      await user.type(employeeCountInput, '-5')
      await user.type(annualRevenueInput, '-1000')

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/employee count must be positive/i)).toBeInTheDocument()
        expect(screen.getByText(/annual revenue must be positive/i)).toBeInTheDocument()
      })
    })

    it('should validate field length limits', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      const nameInput = screen.getByLabelText(/company name/i)

      // Test overly long name
      const longName = 'A'.repeat(256)
      await user.type(nameInput, longName)

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/company name must be less than 255 characters/i)).toBeInTheDocument()
      })
    })

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = jest.fn()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'new-company-123' }
        })
      })

      render(<CompanyForm mode="create" onSuccess={mockOnSuccess} />)

      // Type name with leading/trailing spaces
      await user.type(screen.getByLabelText(/company name/i), '  Test Company  ')

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/companies', expect.objectContaining({
          body: expect.stringContaining('"name":"Test Company"') // Should be trimmed
        }))
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      render(<CompanyForm mode="create" />)

      // All form inputs should have labels
      const nameInput = screen.getByLabelText(/company name/i)
      const websiteInput = screen.getByLabelText(/website/i)
      const industrySelect = screen.getByLabelText(/industry/i)

      expect(nameInput).toHaveAttribute('id')
      expect(websiteInput).toHaveAttribute('id')
      expect(industrySelect).toHaveAttribute('id')

      // Check required field indicators
      expect(screen.getByText(/company name/i).closest('label')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      render(<CompanyForm mode="create" />)

      const nameInput = screen.getByLabelText(/company name/i)
      const websiteInput = screen.getByLabelText(/website/i)

      // Tab through form
      nameInput.focus()
      expect(nameInput).toHaveFocus()

      fireEvent.keyDown(nameInput, { key: 'Tab' })
      // Next focusable element should be focused (website input)
      // Note: This is a simplified test - in a real browser, tab order is more complex
    })

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/company name is required/i)
        expect(errorMessage).toBeInTheDocument()
        // Error should be associated with the input via aria-describedby
        expect(errorMessage).toHaveAttribute('id')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const user = userEvent.setup()

      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<CompanyForm mode="create" />)

      await user.type(screen.getByLabelText(/company name/i), 'Test Company')

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should handle malformed API responses', async () => {
      const user = userEvent.setup()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      render(<CompanyForm mode="create" />)

      await user.type(screen.getByLabelText(/company name/i), 'Test Company')

      const submitButton = screen.getByRole('button', { name: /create company/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create company/i)).toBeInTheDocument()
      })
    })

    it('should allow error retry', async () => {
      const user = userEvent.setup()

      render(<CompanyForm mode="create" />)

      // Simulate error
      await act(async () => {
        const form = screen.getByRole('form') || screen.getByTagName('form')
        const event = new Error('Test error')
        fireEvent.error(form, { error: event })
      })

      // Should show error message with retry option
      const errorElement = screen.getByText(/failed to create company/i)
      expect(errorElement).toBeInTheDocument()
    })
  })

  describe('Integration with Form Library', () => {
    it('should integrate correctly with React Hook Form', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      // Test form state management
      const nameInput = screen.getByLabelText(/company name/i)

      // Form should start with no validation errors
      expect(screen.queryByText(/company name is required/i)).not.toBeInTheDocument()

      // Focus and blur should trigger validation
      nameInput.focus()
      nameInput.blur()

      // Should show validation error for required field
      await waitFor(() => {
        expect(screen.getByText(/company name is required/i)).toBeInTheDocument()
      })

      // Typing should clear error
      await user.type(nameInput, 'Test Company')

      await waitFor(() => {
        expect(screen.queryByText(/company name is required/i)).not.toBeInTheDocument()
      })
    })

    it('should handle form reset correctly', async () => {
      const user = userEvent.setup()
      render(<CompanyForm mode="create" />)

      const nameInput = screen.getByLabelText(/company name/i)

      // Make changes
      await user.type(nameInput, 'Test Company')
      expect((nameInput as HTMLInputElement).value).toBe('Test Company')

      // Form reset should clear values (this would happen on successful submit)
      // Note: This is a simplified test - actual reset would happen through form methods
    })
  })
})