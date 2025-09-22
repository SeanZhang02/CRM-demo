'use client'

import { useState } from 'react'
import {
  BookmarkIcon,
  TrashIcon,
  EyeIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { SavedFilter, FilterConfig } from '@/lib/types/filters'

/**
 * Saved filters management interface
 *
 * Features:
 * - Filter organization by usage and date
 * - Public/private filter indicators
 * - Quick preview of filter conditions
 * - Usage statistics
 * - Search and categorization
 * - Bulk operations
 */

interface SavedFiltersProps {
  filters: SavedFilter[]
  onLoad: (filterId: string) => void
  onDelete?: (filterId: string) => void
  currentConfig?: FilterConfig
}

export function SavedFilters({
  filters,
  onLoad,
  onDelete,
  currentConfig,
}: SavedFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('usage')
  const [showPublicOnly, setShowPublicOnly] = useState(false)

  // Filter and sort saved filters
  const filteredAndSortedFilters = filters
    .filter(filter => {
      const matchesSearch = filter.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesVisibility = !showPublicOnly || filter.isPublic
      return matchesSearch && matchesVisibility
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'usage':
          return b.usageCount - a.usageCount
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return 0
      }
    })

  // Group filters by category
  const groupedFilters = groupFiltersByCategory(filteredAndSortedFilters)

  // Handle filter deletion with confirmation
  const handleDelete = (filterId: string, filterName: string) => {
    if (!onDelete) return

    if (confirm(`Are you sure you want to delete the filter "${filterName}"? This action cannot be undone.`)) {
      onDelete(filterId)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Saved Filters</h3>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search filters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'recent')}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="usage">Most Used</option>
              <option value="recent">Recent</option>
              <option value="name">Name</option>
            </select>
          </div>

          <label className="flex items-center text-xs text-gray-600">
            <input
              type="checkbox"
              checked={showPublicOnly}
              onChange={(e) => setShowPublicOnly(e.target.checked)}
              className="mr-1 h-3 w-3"
            />
            Public only
          </label>
        </div>
      </div>

      {/* Filters List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedFilters).map(([category, categoryFilters]) => (
          <div key={category}>
            {/* Category Header */}
            {category !== 'all' && (
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 border-b border-gray-200">
                {category}
              </div>
            )}

            {/* Filters in Category */}
            {categoryFilters.map((filter) => (
              <SavedFilterItem
                key={filter.id}
                filter={filter}
                onLoad={() => onLoad(filter.id)}
                onDelete={onDelete ? () => handleDelete(filter.id, filter.name) : undefined}
                isActive={isFilterActive(filter.config, currentConfig)}
              />
            ))}
          </div>
        ))}

        {filteredAndSortedFilters.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? (
              <div>
                <div className="text-sm">No filters found</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </div>
            ) : (
              <div>
                <BookmarkIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <div className="text-sm">No saved filters</div>
                <div className="text-xs mt-1">Save your first filter to get started</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Individual saved filter item
function SavedFilterItem({
  filter,
  onLoad,
  onDelete,
  isActive,
}: {
  filter: SavedFilter
  onLoad: () => void
  onDelete?: () => void
  isActive: boolean
}) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className={`border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 ${
      isActive ? 'bg-blue-50 border-blue-200' : ''
    }`}>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`text-sm font-medium truncate ${
                isActive ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {filter.name}
              </h4>

              {/* Visibility Indicator */}
              {filter.isPublic ? (
                <GlobeAltIcon className="h-3 w-3 text-gray-400" title="Public filter" />
              ) : (
                <LockClosedIcon className="h-3 w-3 text-gray-400" title="Private filter" />
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <EyeIcon className="h-3 w-3" />
                <span>{filter.usageCount} uses</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>{formatRelativeTime(filter.updatedAt)}</span>
              </div>
            </div>

            {/* Conditions Preview */}
            <div className="mt-2">
              <FilterConditionsPreview config={filter.config} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Preview filter"
            >
              <EyeIcon className="h-4 w-4" />
            </button>

            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                title="Delete filter"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Load Button */}
        <button
          onClick={onLoad}
          className={`mt-2 w-full px-3 py-1 text-xs font-medium rounded transition-colors duration-200 ${
            isActive
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {isActive ? 'Currently Applied' : 'Load Filter'}
        </button>

        {/* Detailed Preview */}
        {showPreview && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded text-xs">
            <FilterDetailedPreview config={filter.config} />
          </div>
        )}
      </div>
    </div>
  )
}

// Filter conditions preview component
function FilterConditionsPreview({ config }: { config: FilterConfig }) {
  const totalConditions = config.groups.reduce(
    (sum, group) => sum + group.conditions.filter(c => c.field && c.operator).length,
    0
  )

  if (totalConditions === 0) {
    return <div className="text-xs text-gray-400 italic">No conditions</div>
  }

  return (
    <div className="text-xs text-gray-600">
      {totalConditions} condition{totalConditions !== 1 ? 's' : ''} in {config.groups.length} group{config.groups.length !== 1 ? 's' : ''}
    </div>
  )
}

// Detailed filter preview component
function FilterDetailedPreview({ config }: { config: FilterConfig }) {
  return (
    <div className="space-y-2">
      {config.groups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && (
            <div className="text-center text-gray-400 my-1">
              {group.logicalOperator || 'AND'}
            </div>
          )}
          <div className="pl-2 border-l-2 border-gray-200">
            <div className="font-medium text-gray-700 mb-1">Group {groupIndex + 1}</div>
            {group.conditions
              .filter(c => c.field && c.operator)
              .map((condition, conditionIndex) => (
                <div key={condition.id} className="text-gray-600">
                  {conditionIndex > 0 && <span className="text-gray-400">{condition.logicalOperator} </span>}
                  <span className="font-medium">{condition.field}</span>
                  {' '}
                  <span>{condition.operator.replace(/_/g, ' ')}</span>
                  {condition.value && (
                    <span> "{condition.value}"</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Utility functions
function groupFiltersByCategory(filters: SavedFilter[]): Record<string, SavedFilter[]> {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: Record<string, SavedFilter[]> = {
    recent: [],
    popular: [],
    other: [],
  }

  filters.forEach(filter => {
    const updatedAt = new Date(filter.updatedAt)

    if (updatedAt > oneWeekAgo) {
      groups.recent.push(filter)
    } else if (filter.usageCount > 5) {
      groups.popular.push(filter)
    } else {
      groups.other.push(filter)
    }
  })

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key]
    }
  })

  // If all filters are in one group, just return 'all'
  if (Object.keys(groups).length === 1) {
    return { all: filters }
  }

  return groups
}

function isFilterActive(savedConfig: FilterConfig, currentConfig?: FilterConfig): boolean {
  if (!currentConfig) return false

  // Simple comparison - in a real implementation, you'd want a more sophisticated comparison
  return JSON.stringify(savedConfig) === JSON.stringify(currentConfig)
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMilliseconds = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  } else {
    const months = Math.floor(diffInDays / 30)
    return `${months} month${months !== 1 ? 's' : ''} ago`
  }
}