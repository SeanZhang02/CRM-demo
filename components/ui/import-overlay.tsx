'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

/**
 * Professional CSV Import Interface
 *
 * Features:
 * - Drag-and-drop file upload
 * - CSV parsing and validation
 * - Field mapping interface
 * - Duplicate detection options
 * - Import preview with validation
 * - Progress tracking for large imports
 */

export interface ImportField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone'
  isRequired: boolean
  isUnique?: boolean
  validation?: (value: any) => string | null
  transform?: (value: any) => any
  example?: string
}

export interface FieldMapping {
  csvColumn: string
  crmField: string
  transform?: string
  confidence: number
}

export interface ImportPreview {
  validRows: any[]
  invalidRows: Array<{ row: any; errors: string[]; rowNumber: number }>
  duplicates: Array<{ row: any; existing: any; rowNumber: number }>
  summary: {
    total: number
    valid: number
    invalid: number
    duplicates: number
  }
}

interface ImportOverlayProps {
  isOpen: boolean
  onClose: () => void
  entityType: 'companies' | 'contacts' | 'deals' | 'activities'
  availableFields: ImportField[]
  onImport: (config: ImportConfig) => Promise<void>
  onPreview?: (config: ImportConfig) => Promise<ImportPreview>
  maxFileSize?: number // in MB
}

export interface ImportConfig {
  file: File
  fieldMappings: FieldMapping[]
  duplicateHandling: 'skip' | 'update' | 'create'
  includeInvalidRows: boolean
  batchSize: number
}

const DUPLICATE_OPTIONS = [
  {
    key: 'skip' as const,
    label: 'Skip duplicates',
    description: 'Skip rows that match existing records',
    icon: DocumentDuplicateIcon,
  },
  {
    key: 'update' as const,
    label: 'Update existing',
    description: 'Update existing records with new data',
    icon: ArrowUpTrayIcon,
  },
  {
    key: 'create' as const,
    label: 'Create anyway',
    description: 'Create new records even if duplicates exist',
    icon: CheckCircleIcon,
  },
]

export function ImportOverlay({
  isOpen,
  onClose,
  entityType,
  availableFields,
  onImport,
  onPreview,
  maxFileSize = 10,
}: ImportOverlayProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create'>('skip')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFileUpload = useCallback(async (selectedFile: File) => {
    setUploadError(null)

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Please select a CSV file')
      return
    }

    // Validate file size
    if (selectedFile.size > maxFileSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxFileSize}MB`)
      return
    }

    setFile(selectedFile)

    try {
      // Parse CSV
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length === 0) {
        setUploadError('CSV file is empty')
        return
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setCsvHeaders(headers)

      // Parse data rows
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row: any = {}
        headers.forEach((header, i) => {
          row[header] = values[i] || ''
        })
        row.__rowNumber = index + 2 // +2 because header is row 1, data starts at row 2
        return row
      })

      setCsvData(data)

      // Auto-generate field mappings
      const autoMappings = generateAutoMappings(headers, availableFields)
      setFieldMappings(autoMappings)

      setStep('mapping')
    } catch (error) {
      setUploadError('Failed to parse CSV file. Please check the format.')
    }
  }, [maxFileSize, availableFields])

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [handleFileUpload])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }, [handleFileUpload])

  // Handle field mapping change
  const handleMappingChange = (csvColumn: string, crmField: string) => {
    setFieldMappings(prev => prev.map(mapping =>
      mapping.csvColumn === csvColumn
        ? { ...mapping, crmField, confidence: crmField ? calculateConfidence(csvColumn, crmField) : 0 }
        : mapping
    ))
  }

  // Generate preview
  const handlePreview = async () => {
    if (!onPreview || !file) return

    const config: ImportConfig = {
      file,
      fieldMappings: fieldMappings.filter(m => m.crmField),
      duplicateHandling,
      includeInvalidRows: false,
      batchSize: 100,
    }

    setIsLoadingPreview(true)
    try {
      const previewResult = await onPreview(config)
      setPreview(previewResult)
      setStep('preview')
    } catch (error) {
      console.error('Failed to generate preview:', error)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!file) return

    const config: ImportConfig = {
      file,
      fieldMappings: fieldMappings.filter(m => m.crmField),
      duplicateHandling,
      includeInvalidRows: false,
      batchSize: 100,
    }

    setStep('importing')
    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      await onImport(config)

      clearInterval(progressInterval)
      setImportProgress(100)

      // Close after showing completion
      setTimeout(() => {
        onClose()
        resetState()
      }, 1500)

    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setIsImporting(false)
    }
  }

  // Reset state when closing
  const resetState = () => {
    setStep('upload')
    setFile(null)
    setCsvData([])
    setCsvHeaders([])
    setFieldMappings([])
    setPreview(null)
    setUploadError(null)
    setImportProgress(0)
  }

  const handleClose = () => {
    onClose()
    resetState()
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
          onClick={handleClose}
        />

        {/* Import Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <ArrowUpTrayIcon className="h-6 w-6 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Import {entityType}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className={`h-2 w-2 rounded-full ${step === 'upload' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span>Upload</span>
                  <span className={`h-2 w-2 rounded-full ${step === 'mapping' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span>Map Fields</span>
                  <span className={`h-2 w-2 rounded-full ${step === 'preview' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span>Preview</span>
                  <span className={`h-2 w-2 rounded-full ${step === 'importing' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span>Import</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {step === 'upload' && (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                  {/* Upload Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Drop your CSV file here
                    </h3>
                    <p className="text-gray-600 mb-4">
                      or click to browse your files
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Select CSV File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>

                  {/* Upload Error */}
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-700">{uploadError}</span>
                    </motion.div>
                  )}

                  {/* Requirements */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• File format: CSV (.csv)</li>
                      <li>• Maximum size: {maxFileSize}MB</li>
                      <li>• First row should contain column headers</li>
                      <li>• UTF-8 encoding recommended</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 'mapping' && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Map CSV Columns to CRM Fields</h3>
                    <p className="text-gray-600">
                      We've automatically matched columns where possible. Review and adjust the mappings below.
                    </p>
                  </div>

                  {/* Field Mappings */}
                  <div className="space-y-3">
                    {csvHeaders.map((header) => {
                      const mapping = fieldMappings.find(m => m.csvColumn === header)
                      const mappedField = availableFields.find(f => f.key === mapping?.crmField)

                      return (
                        <div key={header} className="grid grid-cols-3 gap-4 items-center p-4 border border-gray-200 rounded-lg">
                          {/* CSV Column */}
                          <div>
                            <div className="font-medium text-gray-900">{header}</div>
                            <div className="text-sm text-gray-500">
                              Sample: {csvData[0]?.[header] || 'N/A'}
                            </div>
                          </div>

                          {/* Mapping Arrow */}
                          <div className="flex justify-center">
                            <div className="text-gray-400">→</div>
                          </div>

                          {/* CRM Field */}
                          <div>
                            <select
                              value={mapping?.crmField || ''}
                              onChange={(e) => handleMappingChange(header, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Skip this column</option>
                              {availableFields.map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label} {field.isRequired && '*'}
                                </option>
                              ))}
                            </select>
                            {mappedField && (
                              <div className="text-xs text-gray-500 mt-1">
                                {mappedField.type} {mappedField.isRequired && '(required)'}
                                {mappedField.example && ` • e.g., ${mappedField.example}`}
                              </div>
                            )}
                            {mapping && mapping.confidence > 0 && (
                              <div className="flex items-center mt-1">
                                <div className={`h-1 w-8 rounded-full ${
                                  mapping.confidence > 0.8 ? 'bg-green-500' :
                                  mapping.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="text-xs text-gray-500 ml-2">
                                  {Math.round(mapping.confidence * 100)}% match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Duplicate Handling */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Duplicate Handling</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {DUPLICATE_OPTIONS.map((option) => {
                        const Icon = option.icon
                        const isSelected = duplicateHandling === option.key

                        return (
                          <button
                            key={option.key}
                            onClick={() => setDuplicateHandling(option.key)}
                            className={`p-4 border rounded-lg text-left transition-all duration-200 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                              <span className="font-medium">{option.label}</span>
                            </div>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setStep('upload')}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      Back to Upload
                    </button>

                    <div className="flex items-center space-x-3">
                      {/* Required fields validation */}
                      {(() => {
                        const mappedFields = fieldMappings.filter(m => m.crmField).map(m => m.crmField)
                        const requiredFields = availableFields.filter(f => f.isRequired)
                        const missingRequired = requiredFields.filter(f => !mappedFields.includes(f.key))

                        if (missingRequired.length > 0) {
                          return (
                            <div className="flex items-center text-amber-600 text-sm">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                              Missing required fields: {missingRequired.map(f => f.label).join(', ')}
                            </div>
                          )
                        }
                        return null
                      })()}

                      <button
                        onClick={handlePreview}
                        disabled={isLoadingPreview || fieldMappings.filter(m => m.crmField).length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isLoadingPreview ? (
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                            Generating Preview...
                          </div>
                        ) : (
                          <>
                            <EyeIcon className="h-4 w-4 mr-2 inline" />
                            Preview Import
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && preview && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Import Preview</h3>
                    <p className="text-gray-600">
                      Review the data before importing. Fix any issues in your CSV file if needed.
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{preview.summary.total}</div>
                      <div className="text-sm text-blue-800">Total Rows</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{preview.summary.valid}</div>
                      <div className="text-sm text-green-800">Valid</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{preview.summary.invalid}</div>
                      <div className="text-sm text-red-800">Invalid</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{preview.summary.duplicates}</div>
                      <div className="text-sm text-yellow-800">Duplicates</div>
                    </div>
                  </div>

                  {/* Issues */}
                  {(preview.invalidRows.length > 0 || preview.duplicates.length > 0) && (
                    <div className="space-y-4">
                      {preview.invalidRows.length > 0 && (
                        <div className="border border-red-200 rounded-lg p-4">
                          <h4 className="font-medium text-red-900 mb-2 flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            Validation Errors ({preview.invalidRows.length})
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {preview.invalidRows.slice(0, 5).map((invalid, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">Row {invalid.rowNumber}:</span>
                                <span className="text-red-600 ml-2">{invalid.errors.join(', ')}</span>
                              </div>
                            ))}
                            {preview.invalidRows.length > 5 && (
                              <div className="text-sm text-gray-500">
                                ... and {preview.invalidRows.length - 5} more errors
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {preview.duplicates.length > 0 && (
                        <div className="border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                            <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                            Duplicates Found ({preview.duplicates.length})
                          </h4>
                          <p className="text-sm text-yellow-800">
                            These rows match existing records. They will be handled according to your duplicate strategy: <strong>{duplicateHandling}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sample Data Preview */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sample Valid Data (first 5 rows)</h4>
                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {fieldMappings.filter(m => m.crmField).map(mapping => {
                              const field = availableFields.find(f => f.key === mapping.crmField)
                              return (
                                <th key={mapping.crmField} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                                  {field?.label || mapping.crmField}
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.validRows.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              {fieldMappings.filter(m => m.crmField).map(mapping => (
                                <td key={mapping.crmField} className="px-3 py-2 text-gray-600">
                                  {row[mapping.csvColumn] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setStep('mapping')}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      Back to Mapping
                    </button>

                    <div className="flex items-center space-x-3">
                      {preview.summary.valid === 0 && (
                        <div className="flex items-center text-red-600 text-sm">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          No valid rows to import
                        </div>
                      )}

                      <button
                        onClick={handleImport}
                        disabled={preview.summary.valid === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2 inline" />
                        Import {preview.summary.valid} Records
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'importing' && (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-md text-center">
                  <ClockIcon className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Importing Data...
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Please wait while we process your import.
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    {importProgress}% complete
                  </div>

                  {importProgress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6"
                    >
                      <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">Import completed successfully!</p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Helper functions
function generateAutoMappings(csvHeaders: string[], availableFields: ImportField[]): FieldMapping[] {
  return csvHeaders.map(header => {
    const bestMatch = findBestFieldMatch(header, availableFields)
    return {
      csvColumn: header,
      crmField: bestMatch?.field || '',
      confidence: bestMatch?.confidence || 0,
    }
  })
}

function findBestFieldMatch(csvHeader: string, availableFields: ImportField[]): { field: string; confidence: number } | null {
  const header = csvHeader.toLowerCase().trim()

  // Exact matches
  for (const field of availableFields) {
    if (field.key.toLowerCase() === header || field.label.toLowerCase() === header) {
      return { field: field.key, confidence: 1.0 }
    }
  }

  // Partial matches with high confidence
  const highConfidenceMatches: Record<string, string[]> = {
    email: ['email', 'e-mail', 'mail'],
    firstName: ['first', 'fname', 'firstname', 'given'],
    lastName: ['last', 'lname', 'lastname', 'surname', 'family'],
    phone: ['phone', 'tel', 'telephone', 'mobile', 'cell'],
    company: ['company', 'organization', 'org', 'business'],
    title: ['title', 'position', 'role', 'job'],
    website: ['website', 'url', 'web', 'site'],
    address: ['address', 'street', 'location'],
    city: ['city', 'town'],
    state: ['state', 'province', 'region'],
    country: ['country', 'nation'],
    industry: ['industry', 'sector', 'vertical'],
  }

  for (const [fieldKey, variations] of Object.entries(highConfidenceMatches)) {
    if (variations.some(variation => header.includes(variation))) {
      const field = availableFields.find(f => f.key === fieldKey)
      if (field) {
        return { field: field.key, confidence: 0.8 }
      }
    }
  }

  // Fuzzy matches with lower confidence
  for (const field of availableFields) {
    const fieldLabel = field.label.toLowerCase()
    if (header.includes(fieldLabel) || fieldLabel.includes(header)) {
      return { field: field.key, confidence: 0.6 }
    }
  }

  return null
}

function calculateConfidence(csvColumn: string, crmField: string): number {
  // Simple confidence calculation based on string similarity
  const csv = csvColumn.toLowerCase()
  const crm = crmField.toLowerCase()

  if (csv === crm) return 1.0
  if (csv.includes(crm) || crm.includes(csv)) return 0.8

  // Levenshtein distance based confidence
  const distance = levenshteinDistance(csv, crm)
  const maxLength = Math.max(csv.length, crm.length)
  return Math.max(0, 1 - distance / maxLength)
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}