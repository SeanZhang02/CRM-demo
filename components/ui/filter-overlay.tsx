'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  BookmarkIcon,
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { FilterCondition } from './filter-condition'
import { FilterGroup } from './filter-group'
import { SavedFilters } from './saved-filters'
import { FilterPreview } from './filter-preview'
import {
  FilterConfig,
  FilterField,
  createEmptyFilterConfig,
  createEmptyGroup,
  FilterPreview as FilterPreviewType,
} from '@/lib/types/filters'

/**
 * Advanced Airtable-style Filter Overlay
 *
 * Features:
 * - Visual filter builder with drag-and-drop
 * - Real-time result preview
 * - Saved filters management
 * - Complex AND/OR logic grouping
 * - Desktop-optimized design
 */

interface FilterOverlayProps {
  isOpen: boolean
  onClose: () => void
  fields: FilterField[]
  entityType: string
  initialConfig?: FilterConfig
  onApply: (config: FilterConfig) => void
  onPreview?: (config: FilterConfig) => Promise<FilterPreviewType>
  savedFilters?: any[]
  onSaveFilter?: (name: string, config: FilterConfig, isPublic: boolean) => Promise<void>
  onLoadFilter?: (filterId: string) => void
  onDeleteFilter?: (filterId: string) => void
}

export function FilterOverlay({
  isOpen,
  onClose,
  fields,
  entityType,
  initialConfig,
  onApply,
  onPreview,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
}: FilterOverlayProps) {
  const [config, setConfig] = useState<FilterConfig>(
    initialConfig || createEmptyFilterConfig()
  )
  const [preview, setPreview] = useState<FilterPreviewType | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [showSavedFilters, setShowSavedFilters] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Debounced preview update
  const updatePreview = useCallback(
    debounce(async (filterConfig: FilterConfig) => {
      if (!onPreview) return

      setIsLoadingPreview(true)
      try {
        const previewResult = await onPreview(filterConfig)
        setPreview(previewResult)
      } catch (error) {
        console.error('Failed to load filter preview:', error)
      } finally {
        setIsLoadingPreview(false)
      }
    }, 300),
    [onPreview]
  )

  // Update preview when config changes
  useEffect(() => {
    if (isOpen && hasValidConditions(config)) {
      updatePreview(config)
    } else {
      setPreview(null)
    }
  }, [config, isOpen, updatePreview])

  // Handle group updates
  const handleGroupUpdate = (groupId: string, updatedGroup: any) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId ? updatedGroup : group
      )
    }))
  }

  // Handle group deletion
  const handleGroupDelete = (groupId: string) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.filter(group => group.id !== groupId)
    }))
  }

  // Add new group
  const handleAddGroup = () => {
    setConfig(prev => ({
      ...prev,
      groups: [...prev.groups, createEmptyGroup()]
    }))
  }

  // Clear all filters
  const handleClearAll = () => {
    setConfig(createEmptyFilterConfig())
    setPreview(null)
  }

  // Apply filters
  const handleApply = () => {
    onApply(config)
    onClose()
  }

  // Save filter
  const handleSaveFilter = async () => {
    if (!filterName.trim() || !onSaveFilter) return

    setIsSaving(true)
    try {
      await onSaveFilter(filterName, config, false)
      setFilterName('')
      setShowSavedFilters(false)
    } catch (error) {
      console.error('Failed to save filter:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Load saved filter
  const handleLoadFilter = (filterId: string) => {
    onLoadFilter?.(filterId)
    setShowSavedFilters(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Filter Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <FunnelIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Filter {entityType}
              </h2>
              {preview && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>•</span>
                  <span>{preview.count.toLocaleString()} results</span>
                  <span className="text-gray-400">
                    ({preview.percentage.toFixed(1)}% of {preview.totalCount.toLocaleString()})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Saved Filters Toggle */}
              <button
                onClick={() => setShowSavedFilters(!showSavedFilters)}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  showSavedFilters
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BookmarkIcon className="h-4 w-4 mr-2" />
                Saved Filters
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Saved Filters Sidebar */}
            <AnimatePresence>
              {showSavedFilters && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-r border-gray-200 bg-gray-50 overflow-hidden"
                >
                  <SavedFilters
                    filters={savedFilters}
                    onLoad={handleLoadFilter}
                    onDelete={onDeleteFilter}
                    currentConfig={config}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Filter Builder */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Filter Groups */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  {config.groups.map((group, groupIndex) => (
                    <FilterGroup
                      key={group.id}
                      group={group}
                      groupIndex={groupIndex}
                      fields={fields}
                      isLast={groupIndex === config.groups.length - 1}
                      canDelete={config.groups.length > 1}
                      onUpdate={(updatedGroup) => handleGroupUpdate(group.id, updatedGroup)}
                      onDelete={() => handleGroupDelete(group.id)}
                    />
                  ))}

                  {/* Add Group Button */}
                  <button
                    onClick={handleAddGroup}
                    className="inline-flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Group
                  </button>
                </div>
              </div>

              {/* Preview Panel */}
              {preview && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <FilterPreview
                    preview={preview}
                    loading={isLoadingPreview}
                  />
                </div>
              )}

              {/* Footer Actions */}
              <div className="border-t border-gray-200 px-6 py-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Clear All
                    </button>

                    {/* Save Filter */}
                    {onSaveFilter && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Filter name..."
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleSaveFilter}
                          disabled={!filterName.trim() || isSaving}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {isSaving ? (
                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <BookmarkIcon className="h-4 w-4 mr-2" />
                          )}
                          Save Filter
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={!hasValidConditions(config)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Utility functions
function hasValidConditions(config: FilterConfig): boolean {
  return config.groups.some(group =>
    group.conditions.some(condition =>
      condition.field && condition.operator
    )
  )
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}