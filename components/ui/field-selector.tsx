'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { FilterField, FieldType } from '@/lib/types/filters'

/**
 * Field selector dropdown with search and type icons
 *
 * Features:
 * - Searchable dropdown with filtering
 * - Field type indicators
 * - Keyboard navigation
 * - Group organization
 * - Desktop-optimized interactions
 */

interface FieldSelectorProps {
  fields: FilterField[]
  selected: FilterField | null
  onChange: (field: FilterField | null) => void
  placeholder?: string
  disabled?: boolean
}

export function FieldSelector({
  fields,
  selected,
  onChange,
  placeholder = 'Select field...',
  disabled = false,
}: FieldSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter fields based on search query
  const filteredFields = fields.filter(field =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group fields by category
  const groupedFields = groupFieldsByCategory(filteredFields)

  // Handle field selection
  const handleSelect = (field: FilterField) => {
    onChange(field)
    setIsOpen(false)
    setSearchQuery('')
    setFocusedIndex(-1)
  }

  // Handle dropdown toggle
  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggle()
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev < filteredFields.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : filteredFields.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && filteredFields[focusedIndex]) {
          handleSelect(filteredFields[focusedIndex])
        }
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-left transition-colors duration-200 ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20'
            : 'bg-white border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0">
          {selected && <FieldTypeIcon type={selected.type} />}
          <span className={`text-sm truncate ${
            selected ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {selected?.label || placeholder}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-72 overflow-y-auto">
            {Object.entries(groupedFields).map(([category, categoryFields]) => (
              <div key={category}>
                {category !== 'main' && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    {category}
                  </div>
                )}
                {categoryFields.map((field, index) => {
                  const globalIndex = filteredFields.indexOf(field)
                  const isFocused = globalIndex === focusedIndex

                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => handleSelect(field)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-200 ${
                        isFocused ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      } ${
                        selected?.key === field.key ? 'bg-blue-100 text-blue-900' : ''
                      }`}
                    >
                      <FieldTypeIcon type={field.type} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {field.label}
                        </div>
                        {field.key !== field.label && (
                          <div className="text-xs text-gray-500 truncate">
                            {field.key}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}

            {filteredFields.length === 0 && (
              <div className="px-3 py-8 text-center text-gray-500">
                <div className="text-sm">No fields found</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Field type icon component
function FieldTypeIcon({ type }: { type: FieldType }) {
  const iconClass = "h-4 w-4"

  switch (type) {
    case 'text':
      return (
        <div className={`${iconClass} bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold`}>
          T
        </div>
      )
    case 'number':
      return (
        <div className={`${iconClass} bg-green-100 text-green-600 rounded flex items-center justify-center text-xs font-bold`}>
          #
        </div>
      )
    case 'date':
      return (
        <div className={`${iconClass} bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs font-bold`}>
          D
        </div>
      )
    case 'boolean':
      return (
        <div className={`${iconClass} bg-orange-100 text-orange-600 rounded flex items-center justify-center text-xs font-bold`}>
          B
        </div>
      )
    case 'select':
      return (
        <div className={`${iconClass} bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs font-bold`}>
          S
        </div>
      )
    case 'relationship':
      return (
        <div className={`${iconClass} bg-pink-100 text-pink-600 rounded flex items-center justify-center text-xs font-bold`}>
          R
        </div>
      )
    default:
      return (
        <div className={`${iconClass} bg-gray-100 text-gray-600 rounded flex items-center justify-center text-xs font-bold`}>
          ?
        </div>
      )
  }
}

// Group fields by category for better organization
function groupFieldsByCategory(fields: FilterField[]): Record<string, FilterField[]> {
  const groups: Record<string, FilterField[]> = {
    main: [],
    relationships: [],
    counts: [],
    dates: [],
  }

  fields.forEach(field => {
    if (field.type === 'relationship') {
      groups.relationships.push(field)
    } else if (field.key.includes('_count') || field.key.includes('Number of')) {
      groups.counts.push(field)
    } else if (field.type === 'date') {
      groups.dates.push(field)
    } else {
      groups.main.push(field)
    }
  })

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key]
    }
  })

  return groups
}