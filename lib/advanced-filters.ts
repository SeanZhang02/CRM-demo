import { Prisma } from '@prisma/client'

// ============================================================================
// ADVANCED FILTER TYPES
// Support for complex filter combinations with AND/OR logic
// ============================================================================

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: any
  values?: any[] // For IN/NOT_IN operators
}

export interface FilterGroup {
  operator: 'AND' | 'OR'
  conditions: FilterCondition[]
  groups?: FilterGroup[]
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'
  | 'date_equals'
  | 'date_before'
  | 'date_after'
  | 'date_between'
  | 'date_relative'

export interface AdvancedFilterQuery {
  entity: 'companies' | 'contacts' | 'deals' | 'activities'
  filters: FilterGroup
  search?: string
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  pagination?: {
    page: number
    limit: number
  }
}

// ============================================================================
// FILTER FIELD CONFIGURATIONS
// Define which fields support which operators for each entity
// ============================================================================

export const FILTER_FIELD_CONFIG = {
  companies: {
    name: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    industry: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    status: ['equals', 'not_equals', 'in', 'not_in'],
    companySize: ['equals', 'not_equals', 'in', 'not_in'],
    annualRevenue: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'between', 'is_empty', 'is_not_empty'],
    employeeCount: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'between', 'is_empty', 'is_not_empty'],
    city: ['equals', 'not_equals', 'contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    state: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    country: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    createdAt: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative'],
    updatedAt: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative']
  },
  contacts: {
    firstName: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
    lastName: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
    email: ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
    jobTitle: ['equals', 'not_equals', 'contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    department: ['equals', 'not_equals', 'contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    status: ['equals', 'not_equals', 'in', 'not_in'],
    isPrimary: ['equals'],
    preferredContact: ['equals', 'not_equals', 'in', 'not_in'],
    'company.name': ['equals', 'not_equals', 'contains', 'not_contains'],
    'company.industry': ['equals', 'not_equals', 'in', 'not_in'],
    createdAt: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative']
  },
  deals: {
    title: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
    value: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'between', 'is_empty', 'is_not_empty'],
    status: ['equals', 'not_equals', 'in', 'not_in'],
    priority: ['equals', 'not_equals', 'in', 'not_in'],
    probability: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'between'],
    source: ['equals', 'not_equals', 'contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    'stage.name': ['equals', 'not_equals', 'in', 'not_in'],
    'stage.stageType': ['equals', 'not_equals', 'in', 'not_in'],
    'company.name': ['equals', 'not_equals', 'contains', 'not_contains'],
    'contact.firstName': ['equals', 'not_equals', 'contains', 'not_contains'],
    'contact.lastName': ['equals', 'not_equals', 'contains', 'not_contains'],
    expectedCloseDate: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative', 'is_empty', 'is_not_empty'],
    createdAt: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative']
  },
  activities: {
    subject: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
    type: ['equals', 'not_equals', 'in', 'not_in'],
    status: ['equals', 'not_equals', 'in', 'not_in'],
    priority: ['equals', 'not_equals', 'in', 'not_in'],
    'company.name': ['equals', 'not_equals', 'contains', 'not_contains'],
    'contact.firstName': ['equals', 'not_equals', 'contains', 'not_contains'],
    'deal.title': ['equals', 'not_equals', 'contains', 'not_contains'],
    dueDate: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative', 'is_empty', 'is_not_empty'],
    completedAt: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative', 'is_empty', 'is_not_empty'],
    createdAt: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative']
  }
} as const

// ============================================================================
// PRISMA WHERE CLAUSE BUILDERS
// Convert advanced filter conditions to Prisma where clauses
// ============================================================================

export function buildAdvancedWhereClause(filters: FilterGroup): any {
  const conditions = []

  // Process individual conditions
  if (filters.conditions) {
    for (const condition of filters.conditions) {
      const prismaCondition = buildConditionClause(condition)
      if (prismaCondition) {
        conditions.push(prismaCondition)
      }
    }
  }

  // Process nested groups
  if (filters.groups) {
    for (const group of filters.groups) {
      const nestedClause = buildAdvancedWhereClause(group)
      if (nestedClause) {
        conditions.push(nestedClause)
      }
    }
  }

  // Return combined conditions based on operator
  if (conditions.length === 0) return {}
  if (conditions.length === 1) return conditions[0]

  return {
    [filters.operator]: conditions
  }
}

function buildConditionClause(condition: FilterCondition): any {
  const { field, operator, value, values } = condition

  // Handle nested field paths (e.g., 'company.name')
  const fieldPath = field.split('.')

  switch (operator) {
    case 'equals':
      return buildNestedField(fieldPath, { equals: value })

    case 'not_equals':
      return buildNestedField(fieldPath, { not: value })

    case 'contains':
      return buildNestedField(fieldPath, { contains: value, mode: 'insensitive' })

    case 'not_contains':
      return buildNestedField(fieldPath, { not: { contains: value, mode: 'insensitive' } })

    case 'starts_with':
      return buildNestedField(fieldPath, { startsWith: value, mode: 'insensitive' })

    case 'ends_with':
      return buildNestedField(fieldPath, { endsWith: value, mode: 'insensitive' })

    case 'greater_than':
      return buildNestedField(fieldPath, { gt: value })

    case 'greater_than_or_equal':
      return buildNestedField(fieldPath, { gte: value })

    case 'less_than':
      return buildNestedField(fieldPath, { lt: value })

    case 'less_than_or_equal':
      return buildNestedField(fieldPath, { lte: value })

    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return buildNestedField(fieldPath, { gte: value[0], lte: value[1] })
      }
      break

    case 'in':
      return buildNestedField(fieldPath, { in: values || [value] })

    case 'not_in':
      return buildNestedField(fieldPath, { notIn: values || [value] })

    case 'is_empty':
      return buildNestedField(fieldPath, { equals: null })

    case 'is_not_empty':
      return buildNestedField(fieldPath, { not: null })

    case 'date_equals':
      const date = new Date(value)
      const nextDay = new Date(date)
      nextDay.setDate(date.getDate() + 1)
      return buildNestedField(fieldPath, { gte: date, lt: nextDay })

    case 'date_before':
      return buildNestedField(fieldPath, { lt: new Date(value) })

    case 'date_after':
      return buildNestedField(fieldPath, { gt: new Date(value) })

    case 'date_between':
      if (Array.isArray(value) && value.length === 2) {
        return buildNestedField(fieldPath, {
          gte: new Date(value[0]),
          lte: new Date(value[1])
        })
      }
      break

    case 'date_relative':
      return buildRelativeDateClause(fieldPath, value)

    default:
      console.warn(`Unsupported filter operator: ${operator}`)
      return null
  }

  return null
}

function buildNestedField(fieldPath: string[], condition: any): any {
  if (fieldPath.length === 1) {
    return { [fieldPath[0]]: condition }
  }

  // Handle nested relationships
  const [relation, ...restPath] = fieldPath
  return {
    [relation]: buildNestedField(restPath, condition)
  }
}

function buildRelativeDateClause(fieldPath: string[], relativeValue: string): any {
  const now = new Date()
  let startDate: Date
  let endDate: Date

  switch (relativeValue) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 1)
      break

    case 'yesterday':
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 1)
      break

    case 'this_week':
      const dayOfWeek = now.getDay()
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
      break

    case 'last_week':
      const lastWeekStart = new Date(now)
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
      lastWeekStart.setHours(0, 0, 0, 0)
      startDate = lastWeekStart
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
      break

    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      break

    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break

    case 'last_7_days':
      endDate = new Date(now)
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      break

    case 'last_30_days':
      endDate = new Date(now)
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      break

    case 'last_90_days':
      endDate = new Date(now)
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 90)
      break

    default:
      console.warn(`Unsupported relative date value: ${relativeValue}`)
      return null
  }

  return buildNestedField(fieldPath, { gte: startDate, lt: endDate })
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateFilterQuery(query: AdvancedFilterQuery): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate entity
  if (!['companies', 'contacts', 'deals', 'activities'].includes(query.entity)) {
    errors.push('Invalid entity type')
  }

  // Validate filter group
  const filterErrors = validateFilterGroup(query.filters, query.entity)
  errors.push(...filterErrors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

function validateFilterGroup(group: FilterGroup, entity: string): string[] {
  const errors: string[] = []

  // Validate operator
  if (!['AND', 'OR'].includes(group.operator)) {
    errors.push('Invalid group operator')
  }

  // Validate conditions
  if (group.conditions) {
    for (const condition of group.conditions) {
      const conditionErrors = validateCondition(condition, entity)
      errors.push(...conditionErrors)
    }
  }

  // Validate nested groups
  if (group.groups) {
    for (const nestedGroup of group.groups) {
      const nestedErrors = validateFilterGroup(nestedGroup, entity)
      errors.push(...nestedErrors)
    }
  }

  return errors
}

function validateCondition(condition: FilterCondition, entity: string): string[] {
  const errors: string[] = []
  const fieldConfig = FILTER_FIELD_CONFIG[entity as keyof typeof FILTER_FIELD_CONFIG]

  // Check if field is supported
  if (!fieldConfig || !fieldConfig[condition.field as keyof typeof fieldConfig]) {
    errors.push(`Field '${condition.field}' is not supported for entity '${entity}'`)
    return errors
  }

  // Check if operator is supported for this field
  const supportedOperators = fieldConfig[condition.field as keyof typeof fieldConfig]
  if (!supportedOperators.includes(condition.operator)) {
    errors.push(`Operator '${condition.operator}' is not supported for field '${condition.field}'`)
  }

  // Validate value based on operator
  if (['between', 'date_between'].includes(condition.operator)) {
    if (!Array.isArray(condition.value) || condition.value.length !== 2) {
      errors.push(`Operator '${condition.operator}' requires an array of exactly 2 values`)
    }
  }

  if (['in', 'not_in'].includes(condition.operator)) {
    if (!condition.values && !Array.isArray(condition.value)) {
      errors.push(`Operator '${condition.operator}' requires either 'values' array or 'value' as array`)
    }
  }

  return errors
}

// ============================================================================
// EXPORT DEFAULT FUNCTIONS
// ============================================================================

export default {
  buildAdvancedWhereClause,
  validateFilterQuery,
  FILTER_FIELD_CONFIG
}