'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

/**
 * Professional Export Overlay with Preview
 *
 * Features:
 * - Multiple export formats (CSV, Excel, JSON)
 * - Field selection with preview
 * - Export preview before download
 * - Progress indicators for large datasets
 * - Professional desktop-first design
 */

export interface ExportField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'relation'
  isRequired?: boolean
  isDefault?: boolean
  description?: string
}

export interface ExportPreview {
  fields: ExportField[]
  sampleData: any[]
  totalRows: number
  estimatedSize: string
  processingTime: string
}

interface ExportOverlayProps {
  isOpen: boolean
  onClose: () => void
  entityType: 'companies' | 'contacts' | 'deals' | 'activities'
  availableFields: ExportField[]
  currentFilters?: any
  totalRecords: number
  filteredRecords: number
  onExport: (config: ExportConfig) => Promise<void>
  onPreview?: (config: ExportConfig) => Promise<ExportPreview>
}

export interface ExportConfig {
  format: 'csv' | 'excel' | 'json'
  fields: string[]
  includeHeaders: boolean
  includeFilters: boolean
  filename?: string
}

const EXPORT_FORMATS = [
  {
    key: 'csv' as const,
    label: 'CSV',
    description: 'Comma-separated values',
    icon: DocumentTextIcon,
    extension: '.csv',
    mimeType: 'text/csv',
    compatibility: 'Excel, Google Sheets, all spreadsheet apps',
  },
  {
    key: 'excel' as const,
    label: 'Excel',
    description: 'Microsoft Excel format',
    icon: TableCellsIcon,
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compatibility: 'Microsoft Excel, LibreOffice Calc',
  },
  {
    key: 'json' as const,
    label: 'JSON',
    description: 'JavaScript Object Notation',
    icon: DocumentArrowDownIcon,
    extension: '.json',
    mimeType: 'application/json',
    compatibility: 'APIs, developers, data processing tools',
  },
]

export function ExportOverlay({
  isOpen,
  onClose,
  entityType,
  availableFields,
  currentFilters,
  totalRecords,
  filteredRecords,
  onExport,
  onPreview,
}: ExportOverlayProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    fields: availableFields.filter(f => f.isDefault).map(f => f.key),
    includeHeaders: true,
    includeFilters: true,
  })

  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  // Generate filename based on entity type and date
  const generateFilename = useCallback((format: string) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const hasFilters = currentFilters && Object.keys(currentFilters).length > 0
    const filterSuffix = hasFilters ? '_filtered' : ''
    return `${entityType}_export${filterSuffix}_${timestamp}.${format}`
  }, [entityType, currentFilters])

  // Update filename when format changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      filename: generateFilename(prev.format),
    }))
  }, [config.format, generateFilename])

  // Load preview when config changes
  const updatePreview = useCallback(
    async (exportConfig: ExportConfig) => {
      if (!onPreview || !showPreview) return

      setIsLoadingPreview(true)
      try {
        const previewResult = await onPreview(exportConfig)
        setPreview(previewResult)
      } catch (error) {
        console.error('Failed to load export preview:', error)
      } finally {
        setIsLoadingPreview(false)
      }
    },
    [onPreview, showPreview]
  )

  useEffect(() => {
    if (showPreview) {
      updatePreview(config)
    }
  }, [config, showPreview, updatePreview])

  // Handle field selection
  const handleFieldToggle = (fieldKey: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldKey)
        ? prev.fields.filter(f => f !== fieldKey)
        : [...prev.fields, fieldKey],
    }))
  }

  // Handle select all/none
  const handleSelectAll = () => {
    setConfig(prev => ({
      ...prev,
      fields: availableFields.map(f => f.key),
    }))
  }

  const handleSelectNone = () => {
    setConfig(prev => ({
      ...prev,
      fields: [],
    }))
  }

  const handleSelectDefault = () => {
    setConfig(prev => ({
      ...prev,
      fields: availableFields.filter(f => f.isDefault).map(f => f.key),
    }))
  }

  // Handle export
  const handleExport = async () => {
    if (config.fields.length === 0) return

    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress for large datasets
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      await onExport(config)

      clearInterval(progressInterval)
      setExportProgress(100)

      // Close after short delay to show completion
      setTimeout(() => {
        onClose()
        setExportProgress(0)
      }, 1000)

    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const selectedFormat = EXPORT_FORMATS.find(f => f.key === config.format)!
  const recordsToExport = config.includeFilters ? filteredRecords : totalRecords

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

        {/* Export Panel */}
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
              <ArrowDownTrayIcon className="h-6 w-6 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Export {entityType}
                </h2>
                <p className="text-sm text-gray-600">
                  {recordsToExport.toLocaleString()} records
                  {config.includeFilters && filteredRecords < totalRecords && (
                    <span className="text-blue-600">
                      {' '}(filtered from {totalRecords.toLocaleString()})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Configuration Section */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Format Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {EXPORT_FORMATS.map((format) => {
                      const Icon = format.icon
                      const isSelected = config.format === format.key

                      return (
                        <button
                          key={format.key}
                          onClick={() => setConfig(prev => ({ ...prev, format: format.key }))}
                          className={`relative p-4 border rounded-lg text-left transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-xs text-gray-500">{format.extension}</div>
                            </div>
                            {isSelected && (
                              <CheckIcon className="h-4 w-4 text-blue-600 absolute top-2 right-2" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-2">{format.description}</p>
                        </button>
                      )
                    })}
                  </div>

                  {/* Format Info */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>Compatible with:</strong> {selectedFormat.compatibility}
                    </p>
                  </div>
                </div>

                {/* Field Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Fields to Export</h3>
                    <div className="flex items-center space-x-2 text-xs">
                      <button
                        onClick={handleSelectAll}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={handleSelectDefault}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Default
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={handleSelectNone}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableFields.map((field) => {
                      const isSelected = config.fields.includes(field.key)
                      const isRequired = field.isRequired

                      return (
                        <label
                          key={field.key}
                          className={`flex items-center p-2 rounded cursor-pointer transition-colors duration-200 ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isRequired && handleFieldToggle(field.key)}
                            disabled={isRequired}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-2 flex-1">
                            <div className="flex items-center space-x-1">
                              <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                                {field.label}
                              </span>
                              {isRequired && (
                                <span className="text-xs text-red-500">*</span>
                              )}
                              {field.isDefault && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
                                  default
                                </span>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-gray-500">{field.description}</p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    {config.fields.length} of {availableFields.length} fields selected
                  </div>
                </div>

                {/* Export Options */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.includeHeaders}
                        onChange={(e) => setConfig(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include column headers</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.includeFilters}
                        onChange={(e) => setConfig(prev => ({ ...prev, includeFilters: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Apply current filters ({filteredRecords.toLocaleString()} records)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Filename */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Filename
                  </label>
                  <input
                    type="text"
                    value={config.filename || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, filename: e.target.value }))}
                    placeholder={generateFilename(config.format)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Export Progress */}
              {isExporting && (
                <div className="px-6 py-4 border-t border-gray-200 bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-900 font-medium">Exporting data...</span>
                        <span className="text-blue-700">{exportProgress}%</span>
                      </div>
                      <div className="mt-1 w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="border-t border-gray-200 px-6 py-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {onPreview && (
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        disabled={config.fields.length === 0}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                      </button>
                    )}

                    {config.fields.length === 0 && (
                      <div className="flex items-center text-amber-600 text-sm">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        Select at least one field to export
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={onClose}
                      disabled={isExporting}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={config.fields.length === 0 || isExporting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-w-[100px]"
                    >
                      {isExporting ? (
                        <div className="flex items-center justify-center">
                          <ClockIcon className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2 inline" />
                          Export {selectedFormat.label}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-l border-gray-200 bg-gray-50 overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h3 className="text-sm font-medium text-gray-900">Export Preview</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingPreview ? (
                      <div className="flex items-center justify-center h-32">
                        <ClockIcon className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                    ) : preview ? (
                      <div className="space-y-4">
                        {/* Preview Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded border">
                            <div className="text-gray-500">Total Rows</div>
                            <div className="font-medium">{preview.totalRows.toLocaleString()}</div>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <div className="text-gray-500">Est. Size</div>
                            <div className="font-medium">{preview.estimatedSize}</div>
                          </div>
                        </div>

                        {/* Sample Data */}
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-2">Sample Data:</div>
                          <div className="bg-white border rounded text-xs overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  {config.fields.map(fieldKey => {
                                    const field = availableFields.find(f => f.key === fieldKey)
                                    return (
                                      <th key={fieldKey} className="px-2 py-1 text-left border-b border-gray-200 font-medium text-gray-700">
                                        {field?.label || fieldKey}
                                      </th>
                                    )
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {preview.sampleData.slice(0, 5).map((row, index) => (
                                  <tr key={index} className="border-b border-gray-100">
                                    {config.fields.map(fieldKey => (
                                      <td key={fieldKey} className="px-2 py-1 text-gray-600 truncate max-w-20">
                                        {row[fieldKey] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center">
                        Select fields to see preview
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}