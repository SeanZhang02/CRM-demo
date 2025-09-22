'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { FilterCondition } from './filter-condition'
import {
  FilterGroup as FilterGroupType,
  FilterField,
  LogicalOperator,
  createEmptyCondition,
} from '@/lib/types/filters'

/**
 * Filter group component for AND/OR logic grouping
 *
 * Features:
 * - Visual grouping with borders
 * - Dynamic condition management
 * - Logical operator selection between groups
 * - Group deletion with confirmation
 * - Drag and drop reordering (future)
 */

interface FilterGroupProps {
  group: FilterGroupType
  groupIndex: number
  fields: FilterField[]
  isLast?: boolean
  canDelete?: boolean
  onUpdate: (group: FilterGroupType) => void
  onDelete: () => void
}

export function FilterGroup({
  group,
  groupIndex,
  fields,
  isLast = false,
  canDelete = true,
  onUpdate,
  onDelete,
}: FilterGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Handle condition updates
  const handleConditionUpdate = (conditionId: string, updatedCondition: any) => {
    const updatedConditions = group.conditions.map(condition =>
      condition.id === conditionId ? updatedCondition : condition
    )

    onUpdate({
      ...group,
      conditions: updatedConditions,
    })
  }

  // Handle condition deletion
  const handleConditionDelete = (conditionId: string) => {
    const updatedConditions = group.conditions.filter(
      condition => condition.id !== conditionId
    )

    // Ensure at least one condition remains
    if (updatedConditions.length === 0) {
      updatedConditions.push(createEmptyCondition())
    }

    onUpdate({
      ...group,
      conditions: updatedConditions,
    })
  }

  // Add new condition
  const handleAddCondition = () => {
    const newCondition = createEmptyCondition()
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition],
    })
  }

  // Handle group logical operator change
  const handleGroupLogicalOperatorChange = (logicalOperator: LogicalOperator) => {
    onUpdate({
      ...group,
      logicalOperator,
    })
  }

  // Handle group deletion with confirmation
  const handleGroupDelete = () => {
    if (group.conditions.some(c => c.field && c.operator)) {
      if (!confirm('Are you sure you want to delete this filter group? This action cannot be undone.')) {
        return
      }
    }
    onDelete()
  }

  return (
    <div className="relative">
      {/* Group Container */}
      <div className={`border rounded-lg transition-all duration-200 ${
        isCollapsed
          ? 'border-gray-200 bg-gray-50'
          : 'border-blue-200 bg-blue-50/30'
      }`}>
        {/* Group Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            {/* Group Label */}
            <div className="text-sm font-medium text-gray-700">
              Group {groupIndex + 1}
            </div>

            {/* Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </button>

            {/* Condition Count */}
            <div className="text-xs text-gray-500">
              {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Add Condition Button */}
            <button
              onClick={handleAddCondition}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Add Condition
            </button>

            {/* Delete Group Button */}
            {canDelete && (
              <button
                onClick={handleGroupDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                title="Delete group"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Group Content */}
        {!isCollapsed && (
          <div className="p-4 space-y-4">
            {group.conditions.map((condition, conditionIndex) => (
              <FilterCondition
                key={condition.id}
                condition={condition}
                fields={fields}
                isLast={conditionIndex === group.conditions.length - 1}
                canDelete={group.conditions.length > 1}
                showLogicalOperator={true}
                onUpdate={(updatedCondition) =>
                  handleConditionUpdate(condition.id, updatedCondition)
                }
                onDelete={() => handleConditionDelete(condition.id)}
              />
            ))}

            {/* Add Condition Button (Bottom) */}
            <button
              onClick={handleAddCondition}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Condition
            </button>
          </div>
        )}

        {/* Collapsed Preview */}
        {isCollapsed && (
          <div className="px-4 py-3">
            <div className="text-sm text-gray-600">
              {group.conditions
                .filter(c => c.field && c.operator)
                .map((condition, index) => {
                  const field = fields.find(f => f.key === condition.field)
                  return (
                    <span key={condition.id}>
                      {index > 0 && ` ${condition.logicalOperator} `}
                      <span className="font-medium">{field?.label}</span>
                      {' '}
                      <span className="text-gray-500">{condition.operator.replace(/_/g, ' ')}</span>
                      {condition.value && (
                        <>
                          {' '}
                          <span className="font-medium">"{condition.value}"</span>
                        </>
                      )}
                    </span>
                  )
                })
                .length === 0 && (
                <span className="text-gray-400 italic">No conditions set</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Group Logical Operator */}
      {!isLast && (
        <div className="flex justify-center mt-4 mb-4">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-full px-4 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-600">Groups joined by:</span>
            <button
              onClick={() => handleGroupLogicalOperatorChange('AND')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                group.logicalOperator === 'AND'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 border border-transparent'
              }`}
            >
              AND
            </button>
            <button
              onClick={() => handleGroupLogicalOperatorChange('OR')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                group.logicalOperator === 'OR'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 border border-transparent'
              }`}
            >
              OR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}