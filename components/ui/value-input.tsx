'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { FilterField, FilterOperator, FILTER_OPERATORS } from '@/lib/types/filters'

/**
 * Dynamic value input component for filter conditions
 *
 * Features:
 * - Type-specific input components
 * - Date picker integration
 * - Number validation
 * - Select dropdown for options
 * - Range inputs for between operations
 * - Autocomplete for relationship fields
 */

interface ValueInputProps {
  field: FilterField | null
  operator: FilterOperator
  value: any
  onChange: (value: any) => void
}

export function ValueInput({
  field,
  operator,
  value,
  onChange,
}: ValueInputProps) {
  const operatorConfig = FILTER_OPERATORS[operator]

  if (!field || !operatorConfig.requiresValue) {
    return null
  }

  // Handle different value types based on operator
  if (operatorConfig.valueType === 'double') {
    return (
      <DoubleValueInput
        field={field}
        operator={operator}
        value={value}
        onChange={onChange}
      />
    )
  }

  return (
    <SingleValueInput
      field={field}
      operator={operator}
      value={value}
      onChange={onChange}
    />
  )
}

// Single value input component
function SingleValueInput({
  field,
  operator,
  value,
  onChange,
}: ValueInputProps) {
  switch (field?.type) {
    case 'text':
      return (
        <TextInput
          placeholder={getPlaceholder(field, operator)}
          value={value || ''}
          onChange={onChange}
        />
      )

    case 'number':
      return (
        <NumberInput
          placeholder={getPlaceholder(field, operator)}
          value={value || ''}
          onChange={onChange}
        />
      )

    case 'date':
      return (
        <DateInput
          value={value || ''}
          onChange={onChange}
        />
      )

    case 'select':
      return (
        <SelectInput
          options={field.options || []}
          value={value || ''}
          onChange={onChange}
          placeholder={getPlaceholder(field, operator)}
        />
      )

    case 'relationship':
      return (
        <RelationshipInput
          field={field}
          value={value || ''}
          onChange={onChange}
          placeholder={getPlaceholder(field, operator)}
        />
      )

    default:
      return (
        <TextInput
          placeholder={getPlaceholder(field, operator)}
          value={value || ''}
          onChange={onChange}
        />
      )
  }
}

// Double value input component (for between operations)
function DoubleValueInput({
  field,
  operator,
  value,
  onChange,
}: ValueInputProps) {
  const [fromValue, toValue] = Array.isArray(value) ? value : ['', '']

  const handleFromChange = (newFromValue: any) => {
    onChange([newFromValue, toValue])
  }

  const handleToChange = (newToValue: any) => {
    onChange([fromValue, newToValue])
  }

  const InputComponent = field?.type === 'date' ? DateInput :
                         field?.type === 'number' ? NumberInput :
                         TextInput

  return (
    <div className="grid grid-cols-2 gap-2">
      <InputComponent
        placeholder="From"
        value={fromValue}
        onChange={handleFromChange}
      />
      <InputComponent
        placeholder="To"
        value={toValue}
        onChange={handleToChange}
      />
    </div>
  )
}

// Text input component
function TextInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  )
}

// Number input component
function NumberInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string | number
  onChange: (value: number | '') => void
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange('')
    } else {
      const num = parseFloat(val)
      if (!isNaN(num)) {
        onChange(num)
      }
    }
  }

  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  )
}

// Date input component
function DateInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}

// Select input component
function SelectInput({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// Relationship input component (with autocomplete)
function RelationshipInput({
  field,
  value,
  onChange,
  placeholder,
}: {
  field: FilterField
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch suggestions based on field entity
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // This would be replaced with actual API calls
      const endpoint = getRelationshipEndpoint(field.entity!)
      const response = await fetch(`${endpoint}?search=${encodeURIComponent(query)}&limit=10`)

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setShowSuggestions(true)
    fetchSuggestions(newValue)
  }

  const handleSuggestionSelect = (suggestion: any) => {
    const displayValue = getDisplayValue(suggestion, field.entity!)
    onChange(displayValue)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              >
                {getDisplayValue(suggestion, field.entity!)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Utility functions
function getPlaceholder(field: FilterField, operator: FilterOperator): string {
  const operatorConfig = FILTER_OPERATORS[operator]

  if (field.type === 'number') {
    return 'Enter number...'
  }

  if (field.type === 'date') {
    return 'Select date...'
  }

  if (field.type === 'select') {
    return `Select ${field.label.toLowerCase()}...`
  }

  if (field.type === 'relationship') {
    return `Search ${field.entity}...`
  }

  return `Enter ${field.label.toLowerCase()}...`
}

function getRelationshipEndpoint(entity: string): string {
  const endpoints: Record<string, string> = {
    company: '/api/companies',
    contact: '/api/contacts',
    deal: '/api/deals',
    stage: '/api/pipeline-stages',
  }

  return endpoints[entity] || '/api/search'
}

function getDisplayValue(item: any, entity: string): string {
  switch (entity) {
    case 'company':
      return item.name || item.title || 'Unknown Company'
    case 'contact':
      return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Unknown Contact'
    case 'deal':
      return item.title || 'Unknown Deal'
    case 'stage':
      return item.name || 'Unknown Stage'
    default:
      return item.name || item.title || 'Unknown'
  }
}