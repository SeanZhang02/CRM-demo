/**
 * Unit Tests for Company Validation Schemas
 * Tests Zod validation schemas for company data
 */

import {
  companySchema,
  createCompanySchema,
  updateCompanySchema,
  companyQuerySchema,
  companySizeOptions,
  companyStatusOptions,
  industryOptions,
  type Company,
  type CreateCompanyInput,
  type UpdateCompanyInput,
  type CompanyQueryInput,
} from '@/lib/validations/company'

describe('Company Validation Schemas', () => {
  describe('companySchema', () => {
    const validCompanyData = {
      name: 'Test Company',
      industry: 'Technology',
      website: 'https://example.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
      companySize: 'MEDIUM' as const,
      status: 'ACTIVE' as const,
      annualRevenue: 1000000,
      employeeCount: 100,
    }

    it('should validate correct company data', () => {
      const result = companySchema.safeParse(validCompanyData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Company')
        expect(result.data.status).toBe('ACTIVE')
      }
    })

    it('should require company name', () => {
      const invalidData = { ...validCompanyData, name: '' }
      const result = companySchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Company name is required')
      }
    })

    it('should enforce name length limits', () => {
      const longName = 'A'.repeat(256) // Exceeds 255 char limit
      const invalidData = { ...validCompanyData, name: longName }
      const result = companySchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Company name must be less than 255 characters')
      }
    })

    it('should trim whitespace from company name', () => {
      const dataWithWhitespace = { ...validCompanyData, name: '  Test Company  ' }
      const result = companySchema.safeParse(dataWithWhitespace)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Company')
      }
    })

    it('should validate website URLs', () => {
      const invalidWebsite = { ...validCompanyData, website: 'not-a-url' }
      const result = companySchema.safeParse(invalidWebsite)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid website URL')
      }
    })

    it('should allow empty string for optional website', () => {
      const emptyWebsite = { ...validCompanyData, website: '' }
      const result = companySchema.safeParse(emptyWebsite)

      expect(result.success).toBe(true)
    })

    it('should validate company size enum', () => {
      const invalidSize = { ...validCompanyData, companySize: 'INVALID' }
      const result = companySchema.safeParse(invalidSize)

      expect(result.success).toBe(false)
    })

    it('should validate status enum', () => {
      const invalidStatus = { ...validCompanyData, status: 'INVALID' }
      const result = companySchema.safeParse(invalidStatus)

      expect(result.success).toBe(false)
    })

    it('should default status to ACTIVE', () => {
      const { status, ...dataWithoutStatus } = validCompanyData
      const result = companySchema.safeParse(dataWithoutStatus)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('ACTIVE')
      }
    })

    it('should validate positive annual revenue', () => {
      const negativeRevenue = { ...validCompanyData, annualRevenue: -1000 }
      const result = companySchema.safeParse(negativeRevenue)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Annual revenue must be positive')
      }
    })

    it('should validate employee count as positive integer', () => {
      const invalidEmployeeCount = { ...validCompanyData, employeeCount: -5 }
      const result = companySchema.safeParse(invalidEmployeeCount)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Employee count must be positive')
      }
    })

    it('should validate employee count as integer', () => {
      const decimalEmployeeCount = { ...validCompanyData, employeeCount: 10.5 }
      const result = companySchema.safeParse(decimalEmployeeCount)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Employee count must be a whole number')
      }
    })

    it('should allow null values for optional fields', () => {
      const dataWithNulls = {
        name: 'Test Company',
        industry: null,
        website: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        postalCode: null,
        country: null,
        companySize: null,
        status: 'ACTIVE' as const,
        annualRevenue: null,
        employeeCount: null,
      }

      const result = companySchema.safeParse(dataWithNulls)

      expect(result.success).toBe(true)
    })

    it('should enforce length limits on all text fields', () => {
      const testCases = [
        { field: 'industry', maxLength: 100 },
        { field: 'website', maxLength: 255 },
        { field: 'phone', maxLength: 50 },
        { field: 'address', maxLength: 500 },
        { field: 'city', maxLength: 100 },
        { field: 'state', maxLength: 100 },
        { field: 'postalCode', maxLength: 20 },
        { field: 'country', maxLength: 100 },
      ]

      testCases.forEach(({ field, maxLength }) => {
        const longValue = 'A'.repeat(maxLength + 1)
        const invalidData = { ...validCompanyData, [field]: longValue }
        const result = companySchema.safeParse(invalidData)

        expect(result.success).toBe(false)
      })
    })
  })

  describe('createCompanySchema', () => {
    it('should be identical to base company schema', () => {
      const validData = {
        name: 'New Company',
        industry: 'Technology',
        status: 'PROSPECT' as const,
      }

      const baseResult = companySchema.safeParse(validData)
      const createResult = createCompanySchema.safeParse(validData)

      expect(baseResult.success).toBe(true)
      expect(createResult.success).toBe(true)
      expect(baseResult.data).toEqual(createResult.data)
    })
  })

  describe('updateCompanySchema', () => {
    it('should require valid UUID for ID', () => {
      const invalidData = {
        id: 'invalid-uuid',
        name: 'Updated Company',
      }

      const result = updateCompanySchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid company ID')
      }
    })

    it('should accept valid UUID for ID', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Company',
      }

      const result = updateCompanySchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should make all fields optional except ID', () => {
      const minimalData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = updateCompanySchema.safeParse(minimalData)

      expect(result.success).toBe(true)
    })

    it('should still validate provided fields', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '', // Invalid: empty name
      }

      const result = updateCompanySchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  describe('companyQuerySchema', () => {
    it('should provide defaults for pagination and sorting', () => {
      const emptyQuery = {}
      const result = companyQuerySchema.safeParse(emptyQuery)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortBy).toBe('name')
        expect(result.data.sortOrder).toBe('asc')
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should coerce string numbers to integers', () => {
      const queryWithStrings = {
        page: '2',
        limit: '50',
      }

      const result = companyQuerySchema.safeParse(queryWithStrings)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
        expect(typeof result.data.page).toBe('number')
        expect(typeof result.data.limit).toBe('number')
      }
    })

    it('should validate page as positive integer', () => {
      const invalidQuery = { page: 0 }
      const result = companyQuerySchema.safeParse(invalidQuery)

      expect(result.success).toBe(false)
    })

    it('should validate limit as positive integer with max 100', () => {
      const invalidQuery = { limit: 101 }
      const result = companyQuerySchema.safeParse(invalidQuery)

      expect(result.success).toBe(false)
    })

    it('should validate enum values for filter fields', () => {
      const validQuery = {
        companySize: 'MEDIUM',
        status: 'CUSTOMER',
        sortOrder: 'desc',
      }

      const result = companyQuerySchema.safeParse(validQuery)

      expect(result.success).toBe(true)
    })

    it('should reject invalid enum values', () => {
      const invalidQuery = {
        companySize: 'INVALID_SIZE',
      }

      const result = companyQuerySchema.safeParse(invalidQuery)

      expect(result.success).toBe(false)
    })

    it('should allow optional search and filter parameters', () => {
      const query = {
        search: 'test company',
        industry: 'Technology',
      }

      const result = companyQuerySchema.safeParse(query)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.search).toBe('test company')
        expect(result.data.industry).toBe('Technology')
      }
    })
  })

  describe('Type Definitions', () => {
    it('should provide correct TypeScript types', () => {
      // This test ensures the types are properly exported and can be used
      const company: Company = {
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        companySize: 'MEDIUM',
        status: 'ACTIVE',
        annualRevenue: 1000000,
        employeeCount: 100,
      }

      const createInput: CreateCompanyInput = {
        name: 'New Company',
        status: 'PROSPECT',
      }

      const updateInput: UpdateCompanyInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Company',
      }

      const queryInput: CompanyQueryInput = {
        search: 'test',
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      }

      // If this compiles without errors, the types are correct
      expect(company.name).toBe('Test Company')
      expect(createInput.name).toBe('New Company')
      expect(updateInput.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(queryInput.search).toBe('test')
    })
  })

  describe('Options Arrays', () => {
    it('should provide company size options', () => {
      expect(companySizeOptions).toHaveLength(5)
      expect(companySizeOptions[0]).toEqual({
        value: 'STARTUP',
        label: 'Startup (1-10 employees)',
      })
    })

    it('should provide company status options', () => {
      expect(companyStatusOptions).toHaveLength(5)
      expect(companyStatusOptions.find(opt => opt.value === 'ACTIVE')).toEqual({
        value: 'ACTIVE',
        label: 'Active',
      })
    })

    it('should provide industry options', () => {
      expect(industryOptions).toContain('Technology')
      expect(industryOptions).toContain('Healthcare')
      expect(industryOptions).toContain('Other')
    })

    it('should have consistent option values with schema enums', () => {
      // Test that option values match schema enum values
      companySizeOptions.forEach(option => {
        const testData = { name: 'Test', companySize: option.value }
        const result = companySchema.safeParse(testData)
        expect(result.success).toBe(true)
      })

      companyStatusOptions.forEach(option => {
        const testData = { name: 'Test', status: option.value }
        const result = companySchema.safeParse(testData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle extremely large valid values', () => {
      const largeValidData = {
        name: 'Test Company',
        annualRevenue: 999999999999, // Max allowed
        employeeCount: 10000000, // Max allowed
      }

      const result = companySchema.safeParse(largeValidData)

      expect(result.success).toBe(true)
    })

    it('should reject values that exceed maximum limits', () => {
      const tooLargeData = {
        name: 'Test Company',
        annualRevenue: 1000000000000, // Exceeds max
      }

      const result = companySchema.safeParse(tooLargeData)

      expect(result.success).toBe(false)
    })

    it('should handle unicode characters in text fields', () => {
      const unicodeData = {
        name: 'Test Company 测试公司',
        city: 'São Paulo',
        country: 'España',
      }

      const result = companySchema.safeParse(unicodeData)

      expect(result.success).toBe(true)
    })

    it('should handle various URL formats', () => {
      const urlTestCases = [
        'https://example.com',
        'http://example.com',
        'https://sub.example.com',
        'https://example.com/path',
        'https://example.com:8080',
      ]

      urlTestCases.forEach(url => {
        const data = { name: 'Test', website: url }
        const result = companySchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })
})