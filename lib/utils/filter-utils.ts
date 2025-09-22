/**
 * Filter utilities for URL persistence and state management
 */

import { FilterConfig, createEmptyFilterConfig } from '@/lib/types/filters'

/**
 * Encode filter config to URL-safe string
 */
export function encodeFiltersToUrl(config: FilterConfig): string {
  try {
    const compressedConfig = compressFilterConfig(config)
    return btoa(JSON.stringify(compressedConfig))
  } catch (error) {
    console.error('Failed to encode filters to URL:', error)
    return ''
  }
}

/**
 * Decode filter config from URL string
 */
export function decodeFiltersFromUrl(encoded: string): FilterConfig {
  try {
    if (!encoded) return createEmptyFilterConfig()

    const decoded = atob(encoded)
    const config = JSON.parse(decoded)
    return expandFilterConfig(config)
  } catch (error) {
    console.error('Failed to decode filters from URL:', error)
    return createEmptyFilterConfig()
  }
}

/**
 * Compress filter config for URL encoding
 */
function compressFilterConfig(config: FilterConfig): any {
  return {
    g: config.groups.map(group => ({
      id: group.id,
      c: group.conditions
        .filter(condition => condition.field && condition.operator)
        .map(condition => ({
          id: condition.id,
          f: condition.field,
          o: condition.operator,
          v: condition.value,
          l: condition.logicalOperator,
        })),
      l: group.logicalOperator,
    })).filter(group => group.c.length > 0),
    n: config.name,
    p: config.isPublic,
  }
}

/**
 * Expand compressed filter config
 */
function expandFilterConfig(compressed: any): FilterConfig {
  return {
    groups: (compressed.g || []).map((group: any) => ({
      id: group.id,
      conditions: (group.c || []).map((condition: any) => ({
        id: condition.id,
        field: condition.f,
        operator: condition.o,
        value: condition.v,
        logicalOperator: condition.l,
      })),
      logicalOperator: group.l,
    })),
    name: compressed.n,
    isPublic: compressed.p,
  }
}

/**
 * Update URL with current filter state
 */
export function updateUrlWithFilters(config: FilterConfig, pathname: string): void {
  try {
    const encoded = encodeFiltersToUrl(config)
    const url = new URL(window.location.href)

    if (encoded && hasValidConditions(config)) {
      url.searchParams.set('filters', encoded)
    } else {
      url.searchParams.delete('filters')
    }

    // Use history.replaceState to avoid adding to browser history
    window.history.replaceState({}, '', url.toString())
  } catch (error) {
    console.error('Failed to update URL with filters:', error)
  }
}

/**
 * Get filters from current URL
 */
export function getFiltersFromUrl(): FilterConfig {
  try {
    if (typeof window === 'undefined') return createEmptyFilterConfig()

    const url = new URL(window.location.href)
    const encoded = url.searchParams.get('filters')

    return encoded ? decodeFiltersFromUrl(encoded) : createEmptyFilterConfig()
  } catch (error) {
    console.error('Failed to get filters from URL:', error)
    return createEmptyFilterConfig()
  }
}

/**
 * Check if filter config has valid conditions
 */
function hasValidConditions(config: FilterConfig): boolean {
  return config.groups.some(group =>
    group.conditions.some(condition =>
      condition.field && condition.operator
    )
  )
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Create a human-readable filter description
 */
export function createFilterDescription(config: FilterConfig, fields: any[]): string {
  if (!hasValidConditions(config)) {
    return 'No filters applied'
  }

  const descriptions: string[] = []

  config.groups.forEach((group, groupIndex) => {
    const validConditions = group.conditions.filter(c => c.field && c.operator)

    if (validConditions.length === 0) return

    if (groupIndex > 0) {
      descriptions.push(group.logicalOperator || 'AND')
    }

    const conditionDescriptions = validConditions.map((condition, conditionIndex) => {
      const field = fields.find(f => f.key === condition.field)
      const fieldLabel = field?.label || condition.field
      const operatorLabel = condition.operator.replace(/_/g, ' ')

      let desc = `${fieldLabel} ${operatorLabel}`

      if (condition.value) {
        if (Array.isArray(condition.value)) {
          desc += ` ${condition.value.join(' and ')}`
        } else {
          desc += ` "${condition.value}"`
        }
      }

      if (conditionIndex > 0) {
        desc = `${condition.logicalOperator} ${desc}`
      }

      return desc
    })

    if (validConditions.length > 1) {
      descriptions.push(`(${conditionDescriptions.join(' ')})`)
    } else {
      descriptions.push(conditionDescriptions[0])
    }
  })

  return descriptions.join(' ')
}

/**
 * Validate filter configuration
 */
export function validateFilterConfig(config: FilterConfig): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.groups || config.groups.length === 0) {
    errors.push('At least one filter group is required')
    return { isValid: false, errors }
  }

  config.groups.forEach((group, groupIndex) => {
    if (!group.conditions || group.conditions.length === 0) {
      errors.push(`Group ${groupIndex + 1} must have at least one condition`)
      return
    }

    group.conditions.forEach((condition, conditionIndex) => {
      if (!condition.field) {
        errors.push(`Group ${groupIndex + 1}, Condition ${conditionIndex + 1}: Field is required`)
      }

      if (!condition.operator) {
        errors.push(`Group ${groupIndex + 1}, Condition ${conditionIndex + 1}: Operator is required`)
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Convert filter config to API query parameters
 */
export function convertFiltersToQueryParams(config: FilterConfig): Record<string, any> {
  if (!hasValidConditions(config)) {
    return {}
  }

  return {
    advancedFilters: JSON.stringify(config),
    filterHash: generateFilterHash(config), // For caching
  }
}

/**
 * Generate a hash for filter configuration (useful for caching)
 */
function generateFilterHash(config: FilterConfig): string {
  try {
    const simplified = JSON.stringify(config, Object.keys(config).sort())
    return btoa(simplified).substring(0, 16)
  } catch (error) {
    return Math.random().toString(36).substring(2, 18)
  }
}