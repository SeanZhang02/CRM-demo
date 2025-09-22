/**
 * Advanced Airtable-style filter system types
 * Supports complex nested filtering with AND/OR logic
 */

export type FilterOperator =
  // Text operators
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  // Number operators
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'not_between'
  // Date operators
  | 'before'
  | 'after'
  | 'on_or_before'
  | 'on_or_after'
  | 'date_between'
  | 'date_is'
  | 'is_today'
  | 'is_yesterday'
  | 'is_this_week'
  | 'is_last_week'
  | 'is_this_month'
  | 'is_last_month'
  | 'is_this_year'
  | 'is_last_year'
  // Boolean operators
  | 'is_true'
  | 'is_false'

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'relationship'

export type LogicalOperator = 'AND' | 'OR'

export interface FilterField {
  key: string
  label: string
  type: FieldType
  options?: { label: string; value: string }[] // For select fields
  entity?: string // For relationship fields
}

export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: any
  logicalOperator?: LogicalOperator // Operator to connect to next condition
}

export interface FilterGroup {
  id: string
  conditions: FilterCondition[]
  logicalOperator?: LogicalOperator // Operator to connect to next group
}

export interface FilterConfig {
  groups: FilterGroup[]
  name?: string // For saved filters
  isPublic?: boolean
}

export interface SavedFilter {
  id: string
  name: string
  config: FilterConfig
  isPublic: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
}

export interface FilterPreview {
  count: number
  sample: any[] // Sample of filtered results
  totalCount: number
  percentage: number
}

// Operator definitions with metadata
export const FILTER_OPERATORS: Record<FilterOperator, {
  label: string
  requiresValue: boolean
  valueType: 'single' | 'double' | 'none'
  supportedTypes: FieldType[]
}> = {
  // Text operators
  equals: {
    label: 'equals',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['text', 'select']
  },
  not_equals: {
    label: 'does not equal',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['text', 'select']
  },
  contains: {
    label: 'contains',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['text']
  },
  not_contains: {
    label: 'does not contain',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['text']
  },
  starts_with: {
    label: 'starts with',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['text']
  },
  ends_with: {
    label: 'ends with',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['text']
  },
  is_empty: {
    label: 'is empty',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['text', 'select']
  },
  is_not_empty: {
    label: 'is not empty',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['text', 'select']
  },

  // Number operators
  greater_than: {
    label: 'greater than',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['number']
  },
  less_than: {
    label: 'less than',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['number']
  },
  greater_than_or_equal: {
    label: 'greater than or equal to',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['number']
  },
  less_than_or_equal: {
    label: 'less than or equal to',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['number']
  },
  between: {
    label: 'between',
    requiresValue: true,
    valueType: 'double',
    supportedTypes: ['number']
  },
  not_between: {
    label: 'not between',
    requiresValue: true,
    valueType: 'double',
    supportedTypes: ['number']
  },

  // Date operators
  before: {
    label: 'before',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['date']
  },
  after: {
    label: 'after',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['date']
  },
  on_or_before: {
    label: 'on or before',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['date']
  },
  on_or_after: {
    label: 'on or after',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['date']
  },
  date_between: {
    label: 'between',
    requiresValue: true,
    valueType: 'double',
    supportedTypes: ['date']
  },
  date_is: {
    label: 'is',
    requiresValue: true,
    valueType: 'single',
    supportedTypes: ['date']
  },
  is_today: {
    label: 'is today',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },
  is_yesterday: {
    label: 'is yesterday',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },
  is_this_week: {
    label: 'is this week',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },
  is_last_week: {
    label: 'is last week',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },
  is_this_month: {
    label: 'is this month',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },
  is_last_month: {
    label: 'is last month',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },
  is_this_year: {
    label: 'is this year',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },
  is_last_year: {
    label: 'is last year',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['date']
  },

  // Boolean operators
  is_true: {
    label: 'is true',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['boolean']
  },
  is_false: {
    label: 'is false',
    requiresValue: false,
    valueType: 'none',
    supportedTypes: ['boolean']
  }
}

// Default field definitions for entities
export const COMPANY_FIELDS: FilterField[] = [
  { key: 'name', label: 'Company Name', type: 'text' },
  { key: 'industry', label: 'Industry', type: 'select', options: [
    { label: 'Technology', value: 'technology' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'Finance', value: 'finance' },
    { label: 'Manufacturing', value: 'manufacturing' },
    { label: 'Retail', value: 'retail' },
    { label: 'Education', value: 'education' },
    { label: 'Other', value: 'other' }
  ]},
  { key: 'companySize', label: 'Company Size', type: 'select', options: [
    { label: '1-10 employees', value: 'startup' },
    { label: '11-50 employees', value: 'small' },
    { label: '51-200 employees', value: 'medium' },
    { label: '201-1000 employees', value: 'large' },
    { label: '1000+ employees', value: 'enterprise' }
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Prospect', value: 'PROSPECT' },
    { label: 'Customer', value: 'CUSTOMER' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Churned', value: 'CHURNED' }
  ]},
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'createdAt', label: 'Created Date', type: 'date' },
  { key: 'updatedAt', label: 'Updated Date', type: 'date' },
  { key: '_count.contacts', label: 'Number of Contacts', type: 'number' },
  { key: '_count.deals', label: 'Number of Deals', type: 'number' },
  { key: '_count.activities', label: 'Number of Activities', type: 'number' }
]

export const CONTACT_FIELDS: FilterField[] = [
  { key: 'firstName', label: 'First Name', type: 'text' },
  { key: 'lastName', label: 'Last Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'jobTitle', label: 'Job Title', type: 'text' },
  { key: 'isPrimary', label: 'Is Primary Contact', type: 'boolean' },
  { key: 'company.name', label: 'Company Name', type: 'relationship', entity: 'company' },
  { key: 'company.industry', label: 'Company Industry', type: 'select', options: COMPANY_FIELDS.find(f => f.key === 'industry')?.options },
  { key: 'createdAt', label: 'Created Date', type: 'date' },
  { key: 'updatedAt', label: 'Updated Date', type: 'date' },
  { key: '_count.deals', label: 'Number of Deals', type: 'number' },
  { key: '_count.activities', label: 'Number of Activities', type: 'number' }
]

export const DEAL_FIELDS: FilterField[] = [
  { key: 'title', label: 'Deal Title', type: 'text' },
  { key: 'value', label: 'Deal Value', type: 'number' },
  { key: 'probability', label: 'Probability', type: 'number' },
  { key: 'expectedCloseDate', label: 'Expected Close Date', type: 'date' },
  { key: 'stage.name', label: 'Pipeline Stage', type: 'relationship', entity: 'stage' },
  { key: 'company.name', label: 'Company Name', type: 'relationship', entity: 'company' },
  { key: 'contact.firstName', label: 'Contact First Name', type: 'relationship', entity: 'contact' },
  { key: 'contact.lastName', label: 'Contact Last Name', type: 'relationship', entity: 'contact' },
  { key: 'createdAt', label: 'Created Date', type: 'date' },
  { key: 'updatedAt', label: 'Updated Date', type: 'date' },
  { key: '_count.activities', label: 'Number of Activities', type: 'number' }
]

export const ENTITY_FIELDS: Record<string, FilterField[]> = {
  companies: COMPANY_FIELDS,
  contacts: CONTACT_FIELDS,
  deals: DEAL_FIELDS
}

// Utility functions
export function getOperatorsForFieldType(fieldType: FieldType): FilterOperator[] {
  return Object.entries(FILTER_OPERATORS)
    .filter(([_, config]) => config.supportedTypes.includes(fieldType))
    .map(([operator, _]) => operator as FilterOperator)
}

export function getFieldsForEntity(entity: string): FilterField[] {
  return ENTITY_FIELDS[entity] || []
}

export function createEmptyCondition(): FilterCondition {
  return {
    id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    field: '',
    operator: 'equals',
    value: '',
    logicalOperator: 'AND'
  }
}

export function createEmptyGroup(): FilterGroup {
  return {
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conditions: [createEmptyCondition()],
    logicalOperator: 'AND'
  }
}

export function createEmptyFilterConfig(): FilterConfig {
  return {
    groups: [createEmptyGroup()]
  }
}