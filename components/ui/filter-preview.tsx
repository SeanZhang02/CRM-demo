'use client'

import { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { FilterPreview as FilterPreviewType } from '@/lib/types/filters'

/**
 * Filter preview component with real-time result counting
 *
 * Features:
 * - Real-time result count display
 * - Percentage of total records
 * - Sample data preview
 * - Performance metrics
 * - Visual result indicators
 * - Expandable sample details
 */

interface FilterPreviewProps {
  preview: FilterPreviewType
  loading?: boolean
}

export function FilterPreview({
  preview,
  loading = false,
}: FilterPreviewProps) {
  const [showSample, setShowSample] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <div className="text-sm text-gray-600">Calculating results...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Main Preview */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Result Count */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getResultStatusColor(preview.percentage)}`}></div>
              <div className="text-lg font-semibold text-gray-900">
                {preview.count.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                result{preview.count !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="text-sm text-gray-500">
              ({preview.percentage.toFixed(1)}% of {preview.totalCount.toLocaleString()})
            </div>
          </div>

          {/* Sample Toggle */}
          {preview.sample.length > 0 && (
            <button
              onClick={() => setShowSample(!showSample)}
              className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              Sample
              {showSample ? (
                <ChevronUpIcon className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Filter coverage</span>
            <span>{preview.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(preview.percentage)}`}
              style={{ width: `${Math.min(preview.percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getFilterEffectivenessLabel(preview.percentage)}
            </div>
            <div className="text-xs text-gray-500">Effectiveness</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {preview.count > 0 ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500">Has Results</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getDataQualityScore(preview)}%
            </div>
            <div className="text-xs text-gray-500">Data Quality</div>
          </div>
        </div>
      </div>

      {/* Sample Data */}
      {showSample && preview.sample.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Sample Results</h4>
              <div className="text-xs text-gray-500">
                Showing {preview.sample.length} of {preview.count} results
              </div>
            </div>

            <div className="space-y-2">
              {preview.sample.slice(0, 5).map((item, index) => (
                <SampleItem key={index} item={item} />
              ))}
            </div>

            {preview.sample.length > 5 && (
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-500">
                  + {preview.sample.length - 5} more samples available
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results State */}
      {preview.count === 0 && (
        <div className="border-t border-gray-200 p-4 text-center">
          <div className="text-sm text-gray-500">
            No records match the current filter criteria
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Try adjusting your filter conditions
          </div>
        </div>
      )}
    </div>
  )
}

// Sample item component
function SampleItem({ item }: { item: any }) {
  // Determine the primary display field based on item properties
  const getDisplayName = (item: any): string => {
    if (item.name) return item.name
    if (item.title) return item.title
    if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`
    if (item.email) return item.email
    return 'Unknown'
  }

  // Get secondary info
  const getSecondaryInfo = (item: any): string => {
    if (item.company?.name) return item.company.name
    if (item.industry) return item.industry
    if (item.email && item.name) return item.email
    if (item.value) return `$${item.value.toLocaleString()}`
    return ''
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {getDisplayName(item)}
        </div>
        {getSecondaryInfo(item) && (
          <div className="text-xs text-gray-500 truncate">
            {getSecondaryInfo(item)}
          </div>
        )}
      </div>
      <div className="ml-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      </div>
    </div>
  )
}

// Utility functions
function getResultStatusColor(percentage: number): string {
  if (percentage === 0) return 'bg-red-400'
  if (percentage < 10) return 'bg-yellow-400'
  if (percentage < 50) return 'bg-blue-400'
  return 'bg-green-400'
}

function getProgressBarColor(percentage: number): string {
  if (percentage === 0) return 'bg-red-400'
  if (percentage < 10) return 'bg-yellow-400'
  if (percentage < 50) return 'bg-blue-400'
  return 'bg-green-400'
}

function getFilterEffectivenessLabel(percentage: number): string {
  if (percentage === 0) return 'No Match'
  if (percentage < 1) return 'Very Narrow'
  if (percentage < 10) return 'Narrow'
  if (percentage < 25) return 'Focused'
  if (percentage < 50) return 'Moderate'
  if (percentage < 75) return 'Broad'
  return 'Very Broad'
}

function getDataQualityScore(preview: FilterPreviewType): number {
  // Simple data quality calculation based on sample completeness
  if (preview.sample.length === 0) return 0

  let totalFields = 0
  let filledFields = 0

  preview.sample.forEach(item => {
    Object.values(item).forEach(value => {
      totalFields++
      if (value !== null && value !== undefined && value !== '') {
        filledFields++
      }
    })
  })

  return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
}