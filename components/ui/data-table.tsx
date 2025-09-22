'use client'

import { useState, useMemo } from 'react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner, SkeletonTable } from './loading-spinner'
import { FilterOverlay } from './filter-overlay'
import {
  FilterConfig,
  FilterField,
  FilterPreview as FilterPreviewType,
  createEmptyFilterConfig,
} from '@/lib/types/filters'

/**
 * Professional data table component inspired by Airtable
 *
 * Features:
 * - Desktop-optimized with responsive design
 * - Column sorting and filtering
 * - Global search functionality
 * - Row selection with bulk actions
 * - Export functionality
 * - Loading and empty states
 * - Keyboard navigation
 */

export interface Column<T = any> {
  key: string
  title: string
  dataIndex: string
  width?: string
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select' | 'date' | 'number'
  filterOptions?: { label: string; value: string }[]
  render?: (value: any, record: T, index: number) => React.ReactNode
}

export interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  selectable?: boolean
  exportable?: boolean
  advancedFiltering?: boolean
  entityType?: string
  filterFields?: FilterField[]
  savedFilters?: any[]
  onSearch?: (query: string) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, any>) => void
  onAdvancedFilter?: (config: FilterConfig) => void
  onFilterPreview?: (config: FilterConfig) => Promise<FilterPreviewType>
  onSaveFilter?: (name: string, config: FilterConfig, isPublic: boolean) => Promise<void>
  onLoadFilter?: (filterId: string) => void
  onDeleteFilter?: (filterId: string) => void
  onRowClick?: (record: T, index: number) => void
  onSelect?: (selectedRows: T[]) => void
  emptyText?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchable = true,
  selectable = false,
  exportable = true,
  advancedFiltering = false,
  entityType = 'records',
  filterFields = [],
  savedFilters = [],
  onSearch,
  onSort,
  onFilter,
  onAdvancedFilter,
  onFilterPreview,
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  onRowClick,
  onSelect,
  emptyText = 'No data available',
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedRows, setSelectedRows] = useState<T[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [currentFilterConfig, setCurrentFilterConfig] = useState<FilterConfig>(createEmptyFilterConfig())
  const [hasActiveAdvancedFilters, setHasActiveAdvancedFilters] = useState(false)

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    onSort?.(key, direction)
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  // Handle filtering
  const handleFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    if (!value) {
      delete newFilters[key]
    }
    setFilters(newFilters)
    onFilter?.(newFilters)
  }

  // Handle advanced filtering
  const handleAdvancedFilter = (config: FilterConfig) => {
    setCurrentFilterConfig(config)
    setHasActiveAdvancedFilters(hasValidConditions(config))
    onAdvancedFilter?.(config)
  }

  // Handle opening advanced filters
  const handleOpenAdvancedFilters = () => {
    setShowAdvancedFilters(true)
  }

  // Handle closing advanced filters
  const handleCloseAdvancedFilters = () => {
    setShowAdvancedFilters(false)
  }

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    setFilters({})
    setCurrentFilterConfig(createEmptyFilterConfig())
    setHasActiveAdvancedFilters(false)
    onFilter?.({})
    onAdvancedFilter?.(createEmptyFilterConfig())
  }

  // Handle row selection
  const handleRowSelect = (record: T, selected: boolean) => {
    let newSelection: T[]
    if (selected) {
      newSelection = [...selectedRows, record]
    } else {
      newSelection = selectedRows.filter((row) => row.id !== record.id)
    }
    setSelectedRows(newSelection)
    onSelect?.(newSelection)
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected ? [...data] : []
    setSelectedRows(newSelection)
    onSelect?.(newSelection)
  }

  // Filter data locally if no onFilter provided
  const filteredData = useMemo(() => {
    if (onFilter) return data // Server-side filtering

    let filtered = data

    // Apply search
    if (searchQuery && !onSearch) {
      filtered = filtered.filter((record) =>
        Object.values(record).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Apply filters
    filtered = filtered.filter((record) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true
        return String(record[key]).toLowerCase().includes(String(value).toLowerCase())
      })
    })

    return filtered
  }, [data, searchQuery, filters, onFilter, onSearch])

  // Sort data locally if no onSort provided
  const sortedData = useMemo(() => {
    if (onSort) return filteredData // Server-side sorting

    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig, onSort])

  const isAllSelected = selectedRows.length === data.length && data.length > 0
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-6">
          <SkeletonTable rows={5} columns={columns.length} />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Table Header with Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setSearchQuery(newValue)
                    // Auto-clear search when input is empty
                    if (newValue === '') {
                      handleSearch('')
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery)
                    }
                  }}
                  className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-blue-500 text-sm"
                />
              </div>
            )}

            {/* Basic Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg
                        text-sm font-medium transition-colors duration-200
                        ${showFilters
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {Object.keys(filters).length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs
                               font-medium bg-blue-100 text-blue-800">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>

            {/* Advanced Filter Toggle */}
            {advancedFiltering && (
              <button
                onClick={handleOpenAdvancedFilters}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg
                          text-sm font-medium transition-colors duration-200
                          ${hasActiveAdvancedFilters
                            ? 'bg-purple-50 text-purple-700 border-purple-300'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Advanced Filters
                {hasActiveAdvancedFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                 font-medium bg-purple-100 text-purple-800">
                    Active
                  </span>
                )}
              </button>
            )}

            {/* Clear All Filters */}
            {(Object.keys(filters).length > 0 || hasActiveAdvancedFilters) && (
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Selected Count */}
            {selectedRows.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedRows.length} selected
              </span>
            )}

            {/* Export Button */}
            {exportable && (
              <button
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg
                         text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                         transition-colors duration-200"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              <button
                onClick={() => {
                  setFilters({})
                  onFilter?.({})
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Company Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                  Company Information
                </h4>

                {/* Company Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    value={filters.companySize || ''}
                    onChange={(e) => handleFilter('companySize', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Sizes</option>
                    <option value="STARTUP">Startup (1-10)</option>
                    <option value="SMALL">Small (11-50)</option>
                    <option value="MEDIUM">Medium (51-200)</option>
                    <option value="LARGE">Large (201-1000)</option>
                    <option value="ENTERPRISE">Enterprise (1000+)</option>
                  </select>
                </div>

                {/* Company Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Company Type
                  </label>
                  <select
                    value={filters.companyStatus || ''}
                    onChange={(e) => handleFilter('companyStatus', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="PROSPECT">Prospects</option>
                    <option value="CUSTOMER">Customers</option>
                    <option value="ACTIVE">Active Partners</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="CHURNED">Former Customers</option>
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={filters.industry || ''}
                    onChange={(e) => handleFilter('industry', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Education">Education</option>
                    <option value="Retail">Retail</option>
                    <option value="Real Estate">Real Estate</option>
                  </select>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                  Contact Details
                </h4>

                {/* Contact Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Contact Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilter('status', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BOUNCED">Email Bounced</option>
                    <option value="UNSUBSCRIBED">Unsubscribed</option>
                    <option value="DO_NOT_CONTACT">Do Not Contact</option>
                  </select>
                </div>

                {/* Preferred Contact Method */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Preferred Contact
                  </label>
                  <select
                    value={filters.preferredContact || ''}
                    onChange={(e) => handleFilter('preferredContact', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Methods</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="IN_PERSON">In Person</option>
                  </select>
                </div>

                {/* Contact Information Available */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Available Contact Info
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasEmail === true}
                        onChange={(e) => handleFilter('hasEmail', e.target.checked ? true : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Has Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasPhone === true}
                        onChange={(e) => handleFilter('hasPhone', e.target.checked ? true : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Has Phone</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasMobile === true}
                        onChange={(e) => handleFilter('hasMobile', e.target.checked ? true : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Has Mobile</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.isPrimary === true}
                        onChange={(e) => handleFilter('isPrimary', e.target.checked ? true : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Primary Contact</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Activity & Engagement Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                  Activity & Engagement
                </h4>

                {/* Date Added */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Added Within
                  </label>
                  <select
                    value={filters.addedWithin || ''}
                    onChange={(e) => handleFilter('addedWithin', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="1_DAY">Last 24 Hours</option>
                    <option value="1_WEEK">Last Week</option>
                    <option value="1_MONTH">Last Month</option>
                    <option value="3_MONTHS">Last 3 Months</option>
                    <option value="6_MONTHS">Last 6 Months</option>
                    <option value="1_YEAR">Last Year</option>
                  </select>
                </div>

                {/* Deal Information */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Deal Activity
                  </label>
                  <select
                    value={filters.dealCount || ''}
                    onChange={(e) => handleFilter('dealCount', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Contacts</option>
                    <option value="NONE">No Deals</option>
                    <option value="LOW">Few Deals (1-2)</option>
                    <option value="MEDIUM">Some Deals (3-5)</option>
                    <option value="HIGH">Many Deals (6+)</option>
                  </select>
                </div>

                {/* Activity Filters */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Recent Activity
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasRecentActivity === true}
                        onChange={(e) => handleFilter('hasRecentActivity', e.target.checked ? true : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active in last 30 days</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasDeals === true}
                        onChange={(e) => handleFilter('hasDeals', e.target.checked ? true : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Has Active Deals</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => onFilter?.(filters)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Apply Filters
                {Object.keys(filters).length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-500 text-white">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                            ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                            ${column.width ? `w-${column.width}` : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon
                          className={`h-3 w-3 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDownIcon
                          className={`h-3 w-3 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              sortedData.map((record, index) => (
                <tr
                  key={record.id || index}
                  className={`hover:bg-gray-50 transition-colors duration-150
                            ${onRowClick ? 'cursor-pointer' : ''}
                            ${selectedRows.some((row) => row.id === record.id) ? 'bg-blue-50' : ''}`}
                  onClick={() => onRowClick?.(record, index)}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.some((row) => row.id === record.id)}
                        onChange={(e) => handleRowSelect(record, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render
                        ? column.render(record[column.dataIndex], record, index)
                        : record[column.dataIndex]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Advanced Filter Overlay */}
      {advancedFiltering && (
        <FilterOverlay
          isOpen={showAdvancedFilters}
          onClose={handleCloseAdvancedFilters}
          fields={filterFields}
          entityType={entityType}
          initialConfig={currentFilterConfig}
          onApply={handleAdvancedFilter}
          onPreview={onFilterPreview}
          savedFilters={savedFilters}
          onSaveFilter={onSaveFilter}
          onLoadFilter={onLoadFilter}
          onDeleteFilter={onDeleteFilter}
        />
      )}
    </div>
  )
}

// Utility function to check if filter config has valid conditions
function hasValidConditions(config: FilterConfig): boolean {
  return config.groups.some(group =>
    group.conditions.some(condition =>
      condition.field && condition.operator
    )
  )
}