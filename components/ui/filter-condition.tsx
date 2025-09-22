'use client'

import { useState, useEffect } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { FieldSelector } from './field-selector'
import { OperatorSelector } from './operator-selector'
import { ValueInput } from './value-input'
import {
  FilterCondition as FilterConditionType,
  FilterField,
  FilterOperator,
  LogicalOperator,
  FILTER_OPERATORS,
  getOperatorsForFieldType,
} from '@/lib/types/filters'

/**
 * Individual filter condition component
 *
 * Features:
 * - Field selection with type-aware operators
 * - Dynamic value input based on field type
 * - Logical operator selection (AND/OR)
 * - Validation and error handling
 * - Smooth animations and interactions
 */

interface FilterConditionProps {
  condition: FilterConditionType
  fields: FilterField[]
  isLast?: boolean
  canDelete?: boolean
  showLogicalOperator?: boolean
  onUpdate: (condition: FilterConditionType) => void
  onDelete: () => void
}

export function FilterCondition({
  condition,
  fields,
  isLast = false,
  canDelete = true,
  showLogicalOperator = true,
  onUpdate,
  onDelete,
}: FilterConditionProps) {
  const [selectedField, setSelectedField] = useState<FilterField | null>(
    fields.find(f => f.key === condition.field) || null
  )
  const [availableOperators, setAvailableOperators] = useState<FilterOperator[]>([])
  const [isValid, setIsValid] = useState(false)

  // Update available operators when field changes
  useEffect(() => {
    if (selectedField) {
      const operators = getOperatorsForFieldType(selectedField.type)
      setAvailableOperators(operators)

      // Reset operator if current one is not valid for the new field type
      if (!operators.includes(condition.operator)) {
        handleOperatorChange(operators[0])
      }
    } else {
      setAvailableOperators([])
    }
  }, [selectedField, condition.operator])

  // Validate condition
  useEffect(() => {
    const operatorConfig = FILTER_OPERATORS[condition.operator]
    const hasField = !!condition.field
    const hasOperator = !!condition.operator
    const hasValue = !operatorConfig?.requiresValue || !!condition.value

    setIsValid(hasField && hasOperator && hasValue)
  }, [condition.field, condition.operator, condition.value])

  // Handle field selection
  const handleFieldChange = (field: FilterField | null) => {
    setSelectedField(field)

    if (field) {
      const operators = getOperatorsForFieldType(field.type)
      const newOperator = operators.includes(condition.operator)
        ? condition.operator
        : operators[0]

      onUpdate({
        ...condition,
        field: field.key,
        operator: newOperator,
        value: '', // Reset value when field changes
      })
    } else {
      onUpdate({
        ...condition,
        field: '',
        operator: 'equals',
        value: '',
      })
    }
  }

  // Handle operator selection
  const handleOperatorChange = (operator: FilterOperator) => {
    const operatorConfig = FILTER_OPERATORS[operator]

    onUpdate({
      ...condition,
      operator,
      value: operatorConfig.requiresValue ? condition.value : null,
    })
  }

  // Handle value change
  const handleValueChange = (value: any) => {
    onUpdate({
      ...condition,
      value,
    })
  }

  // Handle logical operator change
  const handleLogicalOperatorChange = (logicalOperator: LogicalOperator) => {
    onUpdate({
      ...condition,
      logicalOperator,
    })
  }

  const operatorConfig = FILTER_OPERATORS[condition.operator]

  return (
    <div className="group relative">
      {/* Condition Row */}
      <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${
        isValid
          ? 'border-gray-200 bg-white group-hover:border-gray-300'
          : 'border-red-200 bg-red-50'
      }`}>
        {/* Field Selector */}
        <div className="flex-1 min-w-0">
          <FieldSelector
            fields={fields}
            selected={selectedField}
            onChange={handleFieldChange}
            placeholder="Select field..."
          />
        </div>

        {/* Operator Selector */}
        <div className="flex-1 min-w-0">
          <OperatorSelector
            operators={availableOperators}
            selected={condition.operator}
            onChange={handleOperatorChange}
            disabled={!selectedField}
          />
        </div>

        {/* Value Input */}
        {operatorConfig?.requiresValue && (
          <div className="flex-1 min-w-0">
            <ValueInput
              field={selectedField}
              operator={condition.operator}
              value={condition.value}
              onChange={handleValueChange}
            />
          </div>
        )}

        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
            title="Remove condition"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Logical Operator */}
      {showLogicalOperator && !isLast && (
        <div className="flex justify-center mt-3 mb-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-3 py-1">
            <button
              onClick={() => handleLogicalOperatorChange('AND')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                condition.logicalOperator === 'AND'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              AND
            </button>
            <button
              onClick={() => handleLogicalOperatorChange('OR')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                condition.logicalOperator === 'OR'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              OR
            </button>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {!isValid && condition.field && (
        <div className="mt-2 text-sm text-red-600">
          {!condition.field && 'Please select a field'}
          {condition.field && !condition.operator && 'Please select an operator'}
          {condition.field && condition.operator && operatorConfig?.requiresValue && !condition.value && 'Please enter a value'}
        </div>
      )}
    </div>
  )
}