'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  CommandLineIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  DocumentTextIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

/**
 * Professional Command Palette
 *
 * Features:
 * - Fuzzy search across all commands
 * - Keyboard navigation (up/down arrows, enter, escape)
 * - Categorized commands
 * - Recent actions tracking
 * - Context-aware suggestions
 * - Quick actions for common tasks
 */

export interface Command {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  category: string
  action: () => void
  keywords: string[]
  shortcut?: string
  href?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  placeholder?: string
  commands?: Command[]
  recentCommands?: string[]
  onCommandExecute?: (command: Command) => void
}

// Default commands for CRM
const DEFAULT_COMMANDS: Command[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    label: 'Go to Dashboard',
    description: 'View dashboard overview',
    icon: HomeIcon,
    category: 'Navigation',
    action: () => {},
    keywords: ['dashboard', 'home', 'overview'],
    shortcut: 'Ctrl+1',
    href: '/dashboard',
  },
  {
    id: 'nav-companies',
    label: 'Go to Companies',
    description: 'Manage companies and organizations',
    icon: BuildingOfficeIcon,
    category: 'Navigation',
    action: () => {},
    keywords: ['companies', 'organizations', 'businesses'],
    shortcut: 'Ctrl+2',
    href: '/dashboard/companies',
  },
  {
    id: 'nav-contacts',
    label: 'Go to Contacts',
    description: 'Manage contacts and people',
    icon: UserGroupIcon,
    category: 'Navigation',
    action: () => {},
    keywords: ['contacts', 'people', 'persons'],
    shortcut: 'Ctrl+3',
    href: '/dashboard/contacts',
  },
  {
    id: 'nav-deals',
    label: 'Go to Deals',
    description: 'Manage deals and opportunities',
    icon: BanknotesIcon,
    category: 'Navigation',
    action: () => {},
    keywords: ['deals', 'opportunities', 'sales'],
    shortcut: 'Ctrl+4',
    href: '/dashboard/deals',
  },

  // Create Actions
  {
    id: 'create-company',
    label: 'New Company',
    description: 'Create a new company',
    icon: BuildingOfficeIcon,
    category: 'Create',
    action: () => {},
    keywords: ['new', 'create', 'company', 'organization'],
    href: '/dashboard/companies/new',
  },
  {
    id: 'create-contact',
    label: 'New Contact',
    description: 'Create a new contact',
    icon: UserGroupIcon,
    category: 'Create',
    action: () => {},
    keywords: ['new', 'create', 'contact', 'person'],
  },
  {
    id: 'create-deal',
    label: 'New Deal',
    description: 'Create a new deal',
    icon: BanknotesIcon,
    category: 'Create',
    action: () => {},
    keywords: ['new', 'create', 'deal', 'opportunity'],
  },
  {
    id: 'create-activity',
    label: 'New Activity',
    description: 'Log a new activity',
    icon: ClipboardDocumentListIcon,
    category: 'Create',
    action: () => {},
    keywords: ['new', 'create', 'activity', 'log', 'task'],
  },

  // Data Operations
  {
    id: 'export-data',
    label: 'Export Data',
    description: 'Export data to CSV or Excel',
    icon: ArrowDownTrayIcon,
    category: 'Data',
    action: () => {},
    keywords: ['export', 'download', 'csv', 'excel', 'data'],
    shortcut: 'Ctrl+E',
  },
  {
    id: 'import-data',
    label: 'Import Data',
    description: 'Import data from CSV',
    icon: ArrowUpTrayIcon,
    category: 'Data',
    action: () => {},
    keywords: ['import', 'upload', 'csv', 'data'],
    shortcut: 'Ctrl+Shift+I',
  },

  // Search & Filter
  {
    id: 'search-filter',
    label: 'Search & Filter',
    description: 'Search and filter data',
    icon: FunnelIcon,
    category: 'Search',
    action: () => {},
    keywords: ['search', 'filter', 'find', 'query'],
    shortcut: 'Ctrl+F',
  },

  // Settings
  {
    id: 'settings',
    label: 'Settings',
    description: 'Application settings',
    icon: Cog6ToothIcon,
    category: 'Settings',
    action: () => {},
    keywords: ['settings', 'preferences', 'config'],
  },

  // Help
  {
    id: 'help-shortcuts',
    label: 'Keyboard Shortcuts',
    description: 'View all keyboard shortcuts',
    icon: CommandLineIcon,
    category: 'Help',
    action: () => {},
    keywords: ['help', 'shortcuts', 'keyboard', 'hotkeys'],
    shortcut: '?',
  },
  {
    id: 'help-docs',
    label: 'Documentation',
    description: 'View documentation',
    icon: DocumentTextIcon,
    category: 'Help',
    action: () => {},
    keywords: ['help', 'docs', 'documentation', 'guide'],
  },
]

export function CommandPalette({
  isOpen,
  onClose,
  placeholder = 'Type a command or search...',
  commands = [],
  recentCommands = [],
  onCommandExecute,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Merge default commands with custom ones
  const allCommands = useMemo(() => {
    const mergedCommands = [...DEFAULT_COMMANDS, ...commands]

    // Add navigation actions
    return mergedCommands.map(cmd => ({
      ...cmd,
      action: cmd.action || (() => {
        if (cmd.href) {
          router.push(cmd.href)
        }
        onCommandExecute?.(cmd)
        onClose()
      })
    }))
  }, [commands, router, onCommandExecute, onClose])

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show recent commands first when no search
      const recent = allCommands.filter(cmd => recentCommands.includes(cmd.id))
      const others = allCommands.filter(cmd => !recentCommands.includes(cmd.id))
      return [...recent, ...others]
    }

    const searchLower = search.toLowerCase()
    return allCommands
      .filter(cmd => {
        const searchableText = [
          cmd.label,
          cmd.description || '',
          cmd.category,
          ...cmd.keywords,
        ].join(' ').toLowerCase()

        return searchableText.includes(searchLower)
      })
      .sort((a, b) => {
        // Prioritize label matches over description/keyword matches
        const aLabelMatch = a.label.toLowerCase().includes(searchLower)
        const bLabelMatch = b.label.toLowerCase().includes(searchLower)

        if (aLabelMatch && !bLabelMatch) return -1
        if (!aLabelMatch && bLabelMatch) return 1

        return 0
      })
  }, [search, allCommands, recentCommands])

  // Group commands by category
  const commandsByCategory = useMemo(() => {
    const groups: Record<string, Command[]> = {}

    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })

    return groups
  }, [filteredCommands])

  // Reset selection when commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break

        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex])
          }
          break

        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // Execute command
  const executeCommand = useCallback((command: Command) => {
    command.action()
    onCommandExecute?.(command)
    onClose()
  }, [onCommandExecute, onClose])

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

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

        {/* Command Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', duration: 0.2 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-400"
              autoFocus
            />
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(commandsByCategory).length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No commands found for "{search}"</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(commandsByCategory).map(([category, commands]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-t border-gray-100 first:border-t-0">
                      {category}
                    </div>

                    {/* Commands in Category */}
                    {commands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command)
                      const isSelected = globalIndex === selectedIndex
                      const Icon = command.icon

                      return (
                        <button
                          key={command.id}
                          onClick={() => executeCommand(command)}
                          className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                          }`}
                        >
                          {Icon && (
                            <Icon className={`h-5 w-5 mr-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {command.label}
                            </div>
                            {command.description && (
                              <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                {command.description}
                              </div>
                            )}
                          </div>

                          {command.shortcut && (
                            <div className="ml-4">
                              <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                                {command.shortcut}
                              </kbd>
                            </div>
                          )}

                          {recentCommands.includes(command.id) && (
                            <div className="ml-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Recent
                              </span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↓</kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↵</kbd>
                <span>to select</span>
              </div>
            </div>
            <div className="text-right">
              {filteredCommands.length} commands
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for managing command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  const addRecentCommand = useCallback((commandId: string) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId)
      return [commandId, ...filtered].slice(0, 5) // Keep only 5 recent
    })
  }, [])

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && e.ctrlKey) {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  return {
    isOpen,
    open,
    close,
    toggle,
    recentCommands,
    addRecentCommand,
  }
}