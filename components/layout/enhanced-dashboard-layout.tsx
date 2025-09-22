'use client'

import { Suspense, useState } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/ui/toast'
import { CommandPalette, useCommandPalette } from '@/components/ui/command-palette'
import { KeyboardShortcuts, KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts'
import { ExportOverlay } from '@/components/ui/export-overlay'
import { ImportOverlay } from '@/components/ui/import-overlay'
import { PageSkeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Enhanced Dashboard Layout - Professional CRM interface with Week 4 features
 *
 * Features:
 * - Integrated toast notifications
 * - Global keyboard shortcuts
 * - Command palette (Ctrl+K)
 * - Export/Import overlays
 * - Smooth animations and transitions
 * - Enhanced loading states
 * - Professional UX polish
 */

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode
}

export default function EnhancedDashboardLayout({
  children,
}: EnhancedDashboardLayoutProps) {
  // Command palette state
  const {
    isOpen: isCommandPaletteOpen,
    open: openCommandPalette,
    close: closeCommandPalette,
    toggle: toggleCommandPalette,
    recentCommands,
    addRecentCommand,
  } = useCommandPalette()

  // Other overlay states
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [currentEntityType, setCurrentEntityType] = useState<'companies' | 'contacts' | 'deals' | 'activities'>('companies')

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(false)

  // Export/Import handlers
  const handleOpenExport = () => {
    setIsExportOpen(true)
  }

  const handleOpenImport = () => {
    setIsImportOpen(true)
  }

  const handleExport = async (config: any) => {
    // Implement export logic here
    console.log('Exporting with config:', config)
    // This would integrate with your existing export API
  }

  const handleImport = async (config: any) => {
    // Implement import logic here
    console.log('Importing with config:', config)
    // This would integrate with your existing import API
  }

  const handleSave = () => {
    // Find and trigger save on the current form
    const saveButton = document.querySelector<HTMLButtonElement>('[data-save-button], button[type="submit"]')
    if (saveButton) {
      saveButton.click()
    }
  }

  const handleNew = () => {
    // Navigate to new record page based on current context
    const currentPath = window.location.pathname
    if (currentPath.includes('/companies')) {
      window.location.href = '/dashboard/companies/new'
    } else if (currentPath.includes('/contacts')) {
      // Open new contact modal or navigate to new contact page
      console.log('New contact')
    } else if (currentPath.includes('/deals')) {
      // Open new deal modal or navigate to new deal page
      console.log('New deal')
    } else {
      // Default to new company
      window.location.href = '/dashboard/companies/new'
    }
  }

  const handleOpenSearch = () => {
    // Focus on search input or open filter overlay
    const searchInput = document.querySelector<HTMLInputElement>('[data-search-input], input[placeholder*="search" i]')
    if (searchInput) {
      searchInput.focus()
    } else {
      // Open filter overlay if available
      const filterButton = document.querySelector<HTMLButtonElement>('[data-filter-button]')
      if (filterButton) {
        filterButton.click()
      }
    }
  }

  // Mock data for demo - replace with real data
  const mockExportFields = [
    { key: 'name', label: 'Company Name', type: 'string' as const, isDefault: true, isRequired: true },
    { key: 'industry', label: 'Industry', type: 'string' as const, isDefault: true },
    { key: 'website', label: 'Website', type: 'string' as const, isDefault: false },
    { key: 'phone', label: 'Phone', type: 'string' as const, isDefault: true },
    { key: 'email', label: 'Email', type: 'string' as const, isDefault: true },
    { key: 'address', label: 'Address', type: 'string' as const, isDefault: false },
    { key: 'city', label: 'City', type: 'string' as const, isDefault: false },
    { key: 'state', label: 'State', type: 'string' as const, isDefault: false },
    { key: 'country', label: 'Country', type: 'string' as const, isDefault: false },
    { key: 'employeeCount', label: 'Employee Count', type: 'number' as const, isDefault: false },
    { key: 'annualRevenue', label: 'Annual Revenue', type: 'number' as const, isDefault: false },
    { key: 'createdAt', label: 'Created Date', type: 'date' as const, isDefault: false },
  ]

  const mockImportFields = [
    { key: 'name', label: 'Company Name', type: 'string' as const, isRequired: true, example: 'Acme Corp' },
    { key: 'industry', label: 'Industry', type: 'string' as const, isRequired: false, example: 'Technology' },
    { key: 'website', label: 'Website', type: 'string' as const, isRequired: false, example: 'https://acme.com' },
    { key: 'phone', label: 'Phone', type: 'string' as const, isRequired: false, example: '+1-555-123-4567' },
    { key: 'email', label: 'Email', type: 'email' as const, isRequired: false, example: 'contact@acme.com' },
    { key: 'address', label: 'Address', type: 'string' as const, isRequired: false, example: '123 Main St' },
    { key: 'city', label: 'City', type: 'string' as const, isRequired: false, example: 'San Francisco' },
    { key: 'state', label: 'State', type: 'string' as const, isRequired: false, example: 'CA' },
    { key: 'country', label: 'Country', type: 'string' as const, isRequired: false, example: 'United States' },
    { key: 'employeeCount', label: 'Employee Count', type: 'number' as const, isRequired: false, example: '50' },
    { key: 'annualRevenue', label: 'Annual Revenue', type: 'number' as const, isRequired: false, example: '1000000' },
  ]

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Global Keyboard Shortcuts */}
        <KeyboardShortcuts
          onOpenCommandPalette={openCommandPalette}
          onOpenSearch={handleOpenSearch}
          onOpenExport={handleOpenExport}
          onOpenImport={handleOpenImport}
          onSave={handleSave}
          onNew={handleNew}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* Desktop Navigation Header */}
        <Navigation
          onOpenCommandPalette={openCommandPalette}
          onOpenExport={handleOpenExport}
          onOpenImport={handleOpenImport}
        />

        <div className="flex">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area with Smooth Transitions */}
          <main className="flex-1 lg:ml-64">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="px-4 lg:px-8 py-6"
            >
              <Suspense fallback={<PageSkeleton />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={window.location.pathname}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </motion.div>
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={closeCommandPalette}
          recentCommands={recentCommands}
          onCommandExecute={(command) => {
            addRecentCommand(command.id)

            // Handle built-in commands
            switch (command.id) {
              case 'export-data':
                handleOpenExport()
                break
              case 'import-data':
                handleOpenImport()
                break
              case 'search-filter':
                handleOpenSearch()
                break
              case 'help-shortcuts':
                setIsHelpOpen(true)
                break
            }
          }}
        />

        {/* Export Overlay */}
        <ExportOverlay
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          entityType={currentEntityType}
          availableFields={mockExportFields}
          totalRecords={156}
          filteredRecords={23}
          onExport={handleExport}
          onPreview={async (config) => {
            // Mock preview data
            return {
              fields: mockExportFields.filter(f => config.fields.includes(f.key)),
              sampleData: [
                { name: 'Acme Corp', industry: 'Technology', phone: '+1-555-123-4567' },
                { name: 'Beta Inc', industry: 'Healthcare', phone: '+1-555-234-5678' },
                { name: 'Gamma LLC', industry: 'Finance', phone: '+1-555-345-6789' },
              ],
              totalRows: config.includeFilters ? 23 : 156,
              estimatedSize: '45 KB',
              processingTime: '< 1 second',
            }
          }}
        />

        {/* Import Overlay */}
        <ImportOverlay
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          entityType={currentEntityType}
          availableFields={mockImportFields}
          onImport={handleImport}
          onPreview={async (config) => {
            // Mock preview data
            return {
              validRows: [
                { name: 'New Company 1', industry: 'Tech', phone: '+1-555-111-1111' },
                { name: 'New Company 2', industry: 'Finance', phone: '+1-555-222-2222' },
              ],
              invalidRows: [
                {
                  row: { name: '', industry: 'Tech' },
                  errors: ['Company name is required'],
                  rowNumber: 3,
                },
              ],
              duplicates: [
                {
                  row: { name: 'Existing Company', industry: 'Tech' },
                  existing: { name: 'Existing Company', id: '123' },
                  rowNumber: 4,
                },
              ],
              summary: {
                total: 4,
                valid: 2,
                invalid: 1,
                duplicates: 1,
              },
            }
          }}
        />

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

        {/* Loading Overlay for Long Operations */}
        <AnimatePresence>
          {isPageLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Processing...</h3>
                    <p className="text-sm text-gray-500">This may take a few moments</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastProvider>
  )
}

// Hook for managing entity context
export function useEntityContext() {
  const [currentEntity, setCurrentEntity] = useState<'companies' | 'contacts' | 'deals' | 'activities'>('companies')

  // Auto-detect entity from URL
  React.useEffect(() => {
    const path = window.location.pathname
    if (path.includes('/companies')) setCurrentEntity('companies')
    else if (path.includes('/contacts')) setCurrentEntity('contacts')
    else if (path.includes('/deals')) setCurrentEntity('deals')
    else if (path.includes('/activities')) setCurrentEntity('activities')
  }, [])

  return {
    currentEntity,
    setCurrentEntity,
  }
}