'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './toast'

/**
 * Global Keyboard Shortcuts System
 *
 * Features:
 * - Desktop-optimized keyboard navigation
 * - Context-aware shortcuts
 * - Configurable key combinations
 * - Help overlay with shortcut reference
 * - Accessibility compliant
 */

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
  category?: string
  context?: string
  preventDefault?: boolean
}

interface KeyboardShortcutsProps {
  shortcuts?: KeyboardShortcut[]
  onOpenCommandPalette?: () => void
  onOpenSearch?: () => void
  onOpenExport?: () => void
  onOpenImport?: () => void
  onSave?: () => void
  onNew?: () => void
  onOpenHelp?: () => void
}

// Default global shortcuts
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrlKey: true,
    description: 'Open command palette',
    action: () => {},
    category: 'Navigation',
    preventDefault: true,
  },
  {
    key: 'f',
    ctrlKey: true,
    description: 'Search/filter data',
    action: () => {},
    category: 'Search',
    preventDefault: true,
  },
  {
    key: 'n',
    ctrlKey: true,
    description: 'Create new record',
    action: () => {},
    category: 'Actions',
    preventDefault: true,
  },
  {
    key: 'e',
    ctrlKey: true,
    description: 'Export data',
    action: () => {},
    category: 'Data',
    preventDefault: true,
  },
  {
    key: 'i',
    ctrlKey: true,
    shiftKey: true,
    description: 'Import data',
    action: () => {},
    category: 'Data',
    preventDefault: true,
  },
  {
    key: 's',
    ctrlKey: true,
    description: 'Save current form',
    action: () => {},
    category: 'Actions',
    preventDefault: true,
  },
  {
    key: 'Escape',
    description: 'Close modal/overlay',
    action: () => {},
    category: 'Navigation',
    preventDefault: false,
  },
  {
    key: '?',
    shiftKey: true,
    description: 'Show keyboard shortcuts',
    action: () => {},
    category: 'Help',
    preventDefault: true,
  },
  {
    key: '1',
    ctrlKey: true,
    description: 'Go to Dashboard',
    action: () => {},
    category: 'Navigation',
    preventDefault: true,
  },
  {
    key: '2',
    ctrlKey: true,
    description: 'Go to Companies',
    action: () => {},
    category: 'Navigation',
    preventDefault: true,
  },
  {
    key: '3',
    ctrlKey: true,
    description: 'Go to Contacts',
    action: () => {},
    category: 'Navigation',
    preventDefault: true,
  },
  {
    key: '4',
    ctrlKey: true,
    description: 'Go to Deals',
    action: () => {},
    category: 'Navigation',
    preventDefault: true,
  },
]

export function KeyboardShortcuts({
  shortcuts = [],
  onOpenCommandPalette,
  onOpenSearch,
  onOpenExport,
  onOpenImport,
  onSave,
  onNew,
  onOpenHelp,
}: KeyboardShortcutsProps) {
  const router = useRouter()
  const { info } = useToast()

  // Merge default shortcuts with custom ones
  const allShortcuts = useCallback(() => {
    const defaultWithActions = DEFAULT_SHORTCUTS.map(shortcut => {
      switch (shortcut.key + (shortcut.ctrlKey ? '+ctrl' : '') + (shortcut.shiftKey ? '+shift' : '')) {
        case 'k+ctrl':
          return { ...shortcut, action: onOpenCommandPalette || (() => info('Command palette', 'Feature coming soon!')) }
        case 'f+ctrl':
          return { ...shortcut, action: onOpenSearch || (() => document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()) }
        case 'e+ctrl':
          return { ...shortcut, action: onOpenExport || (() => info('Export', 'No export function available')) }
        case 'i+ctrl+shift':
          return { ...shortcut, action: onOpenImport || (() => info('Import', 'No import function available')) }
        case 's+ctrl':
          return { ...shortcut, action: onSave || (() => info('Save', 'Nothing to save')) }
        case 'n+ctrl':
          return { ...shortcut, action: onNew || (() => info('New', 'No new record function available')) }
        case 'Escape':
          return {
            ...shortcut,
            action: () => {
              // Close any open modals, overlays, or dropdowns
              const openModal = document.querySelector('[role="dialog"]:not([hidden])')
              const openDropdown = document.querySelector('[data-dropdown][data-open="true"]')
              if (openModal) {
                const closeButton = openModal.querySelector('[data-close], button[aria-label*="close" i]')
                if (closeButton) (closeButton as HTMLElement).click()
              } else if (openDropdown) {
                openDropdown.removeAttribute('data-open')
              } else {
                // Clear any active selections or focus
                if (document.activeElement && document.activeElement !== document.body) {
                  (document.activeElement as HTMLElement).blur()
                }
              }
            }
          }
        case '?+shift':
          return { ...shortcut, action: onOpenHelp || (() => info('Keyboard Shortcuts', 'Press Ctrl+/ to see all shortcuts')) }
        case '1+ctrl':
          return { ...shortcut, action: () => router.push('/dashboard') }
        case '2+ctrl':
          return { ...shortcut, action: () => router.push('/dashboard/companies') }
        case '3+ctrl':
          return { ...shortcut, action: () => router.push('/dashboard/contacts') }
        case '4+ctrl':
          return { ...shortcut, action: () => router.push('/dashboard/deals') }
        default:
          return shortcut
      }
    })

    return [...defaultWithActions, ...shortcuts]
  }, [shortcuts, onOpenCommandPalette, onOpenSearch, onOpenExport, onOpenImport, onSave, onNew, onOpenHelp, router, info])

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    )) {
      // Allow some shortcuts even in inputs (like Escape and Ctrl+S)
      if (!(event.key === 'Escape' || (event.ctrlKey && event.key === 's'))) {
        return
      }
    }

    const shortcuts = allShortcuts()

    for (const shortcut of shortcuts) {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.metaKey === !!shortcut.metaKey
      ) {
        if (shortcut.preventDefault) {
          event.preventDefault()
        }
        shortcut.action()
        break
      }
    }
  }, [allShortcuts])

  // Register global keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return null // This component doesn't render anything
}

// Hook for accessing keyboard shortcuts
export function useKeyboardShortcuts() {
  const { info } = useToast()

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    // This would ideally integrate with a global shortcuts registry
    // For now, just show a toast
    info('Shortcut Registered', `${shortcut.description} registered`)
  }, [info])

  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const parts = []
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.shiftKey) parts.push('Shift')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.metaKey) parts.push('Cmd')
    parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key)
    return parts.join(' + ')
  }, [])

  return {
    registerShortcut,
    formatShortcut,
  }
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { formatShortcut } = useKeyboardShortcuts()

  if (!isOpen) return null

  const shortcutsByCategory = DEFAULT_SHORTCUTS.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
            <p className="text-sm text-gray-600">Use these shortcuts to navigate faster</p>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{category}</h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{shortcut.description}</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}