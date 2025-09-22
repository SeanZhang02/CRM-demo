/**
 * Unit Tests for Filter Utilities
 * Tests core business logic for filter encoding, decoding, and validation
 */

import {
  encodeFiltersToUrl,
  decodeFiltersFromUrl,
  updateUrlWithFilters,
  getFiltersFromUrl,
  debounce,
  createFilterDescription,
  validateFilterConfig,
  convertFiltersToQueryParams,
} from '@/lib/utils/filter-utils'
import { FilterConfig, createEmptyFilterConfig } from '@/lib/types/filters'

// Mock window object for URL testing
const mockLocation = {
  href: 'https://example.com/dashboard',
  origin: 'https://example.com',
  search: '',
}

const mockHistory = {
  replaceState: jest.fn(),
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true,
})

// Mock console methods to reduce test noise
console.error = jest.fn()

describe('Filter Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHistory.replaceState.mockClear()
  })

  describe('encodeFiltersToUrl', () => {
    it('should encode valid filter config to base64 string', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const encoded = encodeFiltersToUrl(config)
      expect(encoded).toBeTruthy()
      expect(typeof encoded).toBe('string')

      // Should be valid base64
      expect(() => atob(encoded)).not.toThrow()
    })

    it('should return empty string for invalid config', () => {
      const invalidConfig = null as any
      const encoded = encodeFiltersToUrl(invalidConfig)
      expect(encoded).toBe('')
    })

    it('should filter out empty conditions', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
              {
                id: 'cond-2',
                field: '',
                operator: '',
                value: '',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const encoded = encodeFiltersToUrl(config)
      const decoded = decodeFiltersFromUrl(encoded)

      expect(decoded.groups[0].conditions).toHaveLength(1)
      expect(decoded.groups[0].conditions[0].field).toBe('name')
    })
  })

  describe('decodeFiltersFromUrl', () => {
    it('should decode valid encoded filter config', () => {
      const originalConfig: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const encoded = encodeFiltersToUrl(originalConfig)
      const decoded = decodeFiltersFromUrl(encoded)

      expect(decoded.groups).toHaveLength(1)
      expect(decoded.groups[0].conditions).toHaveLength(1)
      expect(decoded.groups[0].conditions[0].field).toBe('name')
      expect(decoded.groups[0].conditions[0].operator).toBe('contains')
      expect(decoded.groups[0].conditions[0].value).toBe('test')
      expect(decoded.name).toBe('Test Filter')
      expect(decoded.isPublic).toBe(false)
    })

    it('should return empty config for empty string', () => {
      const decoded = decodeFiltersFromUrl('')
      const emptyConfig = createEmptyFilterConfig()

      expect(decoded).toEqual(emptyConfig)
    })

    it('should return empty config for invalid base64', () => {
      const decoded = decodeFiltersFromUrl('invalid-base64-string!')
      const emptyConfig = createEmptyFilterConfig()

      expect(decoded).toEqual(emptyConfig)
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle malformed JSON gracefully', () => {
      const invalidJson = btoa('{"invalid": json}')
      const decoded = decodeFiltersFromUrl(invalidJson)
      const emptyConfig = createEmptyFilterConfig()

      expect(decoded).toEqual(emptyConfig)
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('updateUrlWithFilters', () => {
    beforeEach(() => {
      // Reset URL
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          href: 'https://example.com/dashboard',
        },
        writable: true,
      })
    })

    it('should update URL with valid filters', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      updateUrlWithFilters(config, '/dashboard')

      expect(mockHistory.replaceState).toHaveBeenCalled()
      const callArgs = mockHistory.replaceState.mock.calls[0]
      const newUrl = callArgs[2]

      expect(newUrl).toContain('filters=')
    })

    it('should remove filters parameter when no valid conditions', () => {
      const emptyConfig = createEmptyFilterConfig()

      updateUrlWithFilters(emptyConfig, '/dashboard')

      expect(mockHistory.replaceState).toHaveBeenCalled()
      const callArgs = mockHistory.replaceState.mock.calls[0]
      const newUrl = callArgs[2]

      expect(newUrl).not.toContain('filters=')
    })
  })

  describe('getFiltersFromUrl', () => {
    it('should return empty config when no filters in URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          href: 'https://example.com/dashboard',
        },
        writable: true,
      })

      const filters = getFiltersFromUrl()
      const emptyConfig = createEmptyFilterConfig()

      expect(filters).toEqual(emptyConfig)
    })

    it('should decode filters from URL parameters', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const encoded = encodeFiltersToUrl(config)

      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          href: `https://example.com/dashboard?filters=${encoded}`,
        },
        writable: true,
      })

      const filters = getFiltersFromUrl()

      expect(filters.groups).toHaveLength(1)
      expect(filters.groups[0].conditions[0].field).toBe('name')
    })

    it('should handle server-side rendering (no window)', () => {
      const originalWindow = global.window
      delete (global as any).window

      const filters = getFiltersFromUrl()
      const emptyConfig = createEmptyFilterConfig()

      expect(filters).toEqual(emptyConfig)

      global.window = originalWindow
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('test')
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)
      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should cancel previous calls when called multiple times', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      jest.advanceTimersByTime(50)

      debouncedFn('second')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('second')
    })

    it('should preserve function arguments and context', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2', { key: 'value' })
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' })
    })
  })

  describe('createFilterDescription', () => {
    const mockFields = [
      { key: 'name', label: 'Company Name' },
      { key: 'industry', label: 'Industry' },
      { key: 'employees', label: 'Employee Count' },
    ]

    it('should return no filters message for empty config', () => {
      const emptyConfig = createEmptyFilterConfig()
      const description = createFilterDescription(emptyConfig, mockFields)

      expect(description).toBe('No filters applied')
    })

    it('should create description for single condition', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'Acme',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const description = createFilterDescription(config, mockFields)

      expect(description).toBe('Company Name contains "Acme"')
    })

    it('should create description for multiple conditions', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'Acme',
                logicalOperator: 'AND',
              },
              {
                id: 'cond-2',
                field: 'industry',
                operator: 'equals',
                value: 'Technology',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const description = createFilterDescription(config, mockFields)

      expect(description).toContain('Company Name contains "Acme"')
      expect(description).toContain('AND Industry equals "Technology"')
    })

    it('should handle array values', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'industry',
                operator: 'in',
                value: ['Technology', 'Healthcare'],
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const description = createFilterDescription(config, mockFields)

      expect(description).toBe('Industry in Technology and Healthcare')
    })

    it('should handle unknown fields gracefully', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'unknown_field',
                operator: 'equals',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const description = createFilterDescription(config, mockFields)

      expect(description).toBe('unknown_field equals "test"')
    })
  })

  describe('validateFilterConfig', () => {
    it('should validate correct filter config', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const result = validateFilterConfig(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject config with no groups', () => {
      const config: FilterConfig = {
        groups: [],
        name: 'Test Filter',
        isPublic: false,
      }

      const result = validateFilterConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one filter group is required')
    })

    it('should reject groups with no conditions', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const result = validateFilterConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Group 1 must have at least one condition')
    })

    it('should reject conditions without required fields', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: '',
                operator: '',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const result = validateFilterConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Group 1, Condition 1: Field is required')
      expect(result.errors).toContain('Group 1, Condition 1: Operator is required')
    })
  })

  describe('convertFiltersToQueryParams', () => {
    it('should convert valid config to query parameters', () => {
      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      const params = convertFiltersToQueryParams(config)

      expect(params).toHaveProperty('advancedFilters')
      expect(params).toHaveProperty('filterHash')
      expect(typeof params.advancedFilters).toBe('string')
      expect(typeof params.filterHash).toBe('string')

      const parsedFilters = JSON.parse(params.advancedFilters)
      expect(parsedFilters.groups).toHaveLength(1)
    })

    it('should return empty object for config without valid conditions', () => {
      const emptyConfig = createEmptyFilterConfig()
      const params = convertFiltersToQueryParams(emptyConfig)

      expect(params).toEqual({})
    })
  })

  describe('Error Handling', () => {
    it('should handle encoding errors gracefully', () => {
      // Create a config with circular reference
      const config: any = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      // Create circular reference
      config.groups[0].self = config

      const encoded = encodeFiltersToUrl(config)

      expect(encoded).toBe('')
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle URL update errors gracefully', () => {
      // Mock URL constructor to throw error
      const originalURL = window.URL
      window.URL = class {
        constructor() {
          throw new Error('URL error')
        }
      } as any

      const config: FilterConfig = {
        groups: [
          {
            id: 'group-1',
            conditions: [
              {
                id: 'cond-1',
                field: 'name',
                operator: 'contains',
                value: 'test',
                logicalOperator: 'AND',
              },
            ],
            logicalOperator: 'AND',
          },
        ],
        name: 'Test Filter',
        isPublic: false,
      }

      expect(() => {
        updateUrlWithFilters(config, '/dashboard')
      }).not.toThrow()

      expect(console.error).toHaveBeenCalled()

      // Restore original URL
      window.URL = originalURL
    })
  })
})