'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { FilterOperator, FILTER_OPERATORS } from '@/lib/types/filters'

/**
 * Operator selector dropdown for filter conditions
 *
 * Features:
 * - Grouped operators by category
 * - Clear operator descriptions
 * - Keyboard navigation
 * - Disabled state handling
 * - Visual operator categories
 */

interface OperatorSelectorProps {
  operators: FilterOperator[]
  selected: FilterOperator
  onChange: (operator: FilterOperator) => void
  disabled?: boolean
}

export function OperatorSelector({
  operators,
  selected,
  onChange,
  disabled = false,
}: OperatorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Group operators by category
  const groupedOperators = groupOperatorsByCategory(operators)

  // Handle operator selection
  const handleSelect = (operator: FilterOperator) => {
    onChange(operator)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  // Handle dropdown toggle
  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggle()
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev < operators.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : operators.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && operators[focusedIndex]) {
          handleSelect(operators[focusedIndex])
        }
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOperatorConfig = FILTER_OPERATORS[selected]

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-left transition-colors duration-200 ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20'
            : 'bg-white border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className="text-sm text-gray-900 truncate">
          {selectedOperatorConfig?.label || 'Select operator...'}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(groupedOperators).map(([category, categoryOperators]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  {category}
                </div>

                {/* Operators in Category */}
                {categoryOperators.map((operator) => {
                  const operatorConfig = FILTER_OPERATORS[operator]
                  const globalIndex = operators.indexOf(operator)
                  const isFocused = globalIndex === focusedIndex

                  return (
                    <button
                      key={operator}
                      type="button"
                      onClick={() => handleSelect(operator)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-200 ${
                        isFocused ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      } ${
                        selected === operator ? 'bg-blue-100 text-blue-900' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {operatorConfig.label}
                        </div>
                        {getOperatorDescription(operator) && (
                          <div className="text-xs text-gray-500">
                            {getOperatorDescription(operator)}
                          </div>
                        )}
                      </div>

                      {/* Value Type Indicator */}
                      <div className="ml-2">
                        <OperatorTypeIndicator operator={operator} />
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}

            {operators.length === 0 && (
              <div className="px-3 py-8 text-center text-gray-500">
                <div className="text-sm">No operators available</div>
                <div className="text-xs mt-1">Select a field first</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Operator type indicator component
function OperatorTypeIndicator({ operator }: { operator: FilterOperator }) {
  const config = FILTER_OPERATORS[operator]

  if (!config.requiresValue) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        No value
      </span>
    )
  }

  if (config.valueType === 'double') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
        2 values
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
      1 value
    </span>
  )
}

// Group operators by category for better organization
function groupOperatorsByCategory(operators: FilterOperator[]): Record<string, FilterOperator[]> {
  const groups: Record<string, FilterOperator[]> = {}

  operators.forEach(operator => {
    const category = getOperatorCategory(operator)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(operator)
  })

  return groups
}

// Get operator category for grouping
function getOperatorCategory(operator: FilterOperator): string {
  // Text operators
  if (['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'].includes(operator)) {
    return 'Text & Selection'
  }

  // Number operators
  if (['greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'between', 'not_between'].includes(operator)) {
    return 'Number'
  }

  // Date operators
  if (['before', 'after', 'on_or_before', 'on_or_after', 'date_between', 'date_is'].includes(operator)) {
    return 'Date'
  }

  // Relative date operators
  if (['is_today', 'is_yesterday', 'is_this_week', 'is_last_week', 'is_this_month', 'is_last_month', 'is_this_year', 'is_last_year'].includes(operator)) {
    return 'Relative Date'
  }

  // Boolean operators
  if (['is_true', 'is_false'].includes(operator)) {
    return 'Boolean'
  }

  return 'Other'
}

// Get operator description for better UX
function getOperatorDescription(operator: FilterOperator): string {
  const descriptions: Record<FilterOperator, string> = {
    equals: 'Exact match',
    not_equals: 'Does not match exactly',
    contains: 'Contains the text',
    not_contains: 'Does not contain the text',
    starts_with: 'Begins with the text',
    ends_with: 'Ends with the text',
    is_empty: 'Field has no value',
    is_not_empty: 'Field has any value',
    greater_than: 'Greater than the number',
    less_than: 'Less than the number',
    greater_than_or_equal: 'Greater than or equal to',
    less_than_or_equal: 'Less than or equal to',
    between: 'Between two numbers',
    not_between: 'Not between two numbers',
    before: 'Before the date',
    after: 'After the date',
    on_or_before: 'On or before the date',
    on_or_after: 'On or after the date',
    date_between: 'Between two dates',
    date_is: 'Exactly on the date',
    is_today: 'Is today',
    is_yesterday: 'Was yesterday',
    is_this_week: 'Is this week',
    is_last_week: 'Was last week',
    is_this_month: 'Is this month',
    is_last_month: 'Was last month',
    is_this_year: 'Is this year',
    is_last_year: 'Was last year',
    is_true: 'Is checked/true',
    is_false: 'Is unchecked/false',
  }

  return descriptions[operator] || ''
}