'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

/**
 * Desktop-first navigation header
 *
 * Features:
 * - Global search functionality
 * - Quick action buttons
 * - User profile dropdown
 * - Mobile hamburger menu
 * - Keyboard shortcut support (Ctrl+K for search)
 */
export function Navigation() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Handle global search shortcut
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.metaKey && event.key === 'k') {
      event.preventDefault()
      // Focus search input
      document.getElementById('global-search')?.focus()
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CRM</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 hidden sm:block">
                Desktop CRM
              </span>
            </Link>
          </div>

          {/* Desktop Global Search */}
          <div className="flex-1 max-w-lg mx-8 hidden lg:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="global-search"
                type="text"
                placeholder="Search companies, contacts, deals... (⌘K)"
                className={`
                  block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                  placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-blue-500 text-sm transition-all duration-200
                  ${isSearchFocused ? 'shadow-lg' : ''}
                `}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={handleKeyDown}
              />
              {isSearchFocused && (
                <div className="absolute right-3 top-2 text-xs text-gray-400">
                  ⌘K
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Add Button */}
            <Link
              href="/dashboard/companies/new"
              className="hidden lg:inline-flex items-center px-4 py-2 border border-transparent
                       text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       transition-colors duration-200"
            >
              + Add Company
            </Link>

            {/* Notifications */}
            <button
              type="button"
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400" />
            </button>

            {/* User Profile */}
            <button
              type="button"
              className="flex items-center p-2 text-gray-400 hover:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       rounded-lg"
            >
              <span className="sr-only">User menu</span>
              <UserCircleIcon className="h-8 w-8" />
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 text-gray-400 hover:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-blue-500 text-sm"
              />
            </div>

            {/* Mobile Quick Add */}
            <Link
              href="/dashboard/companies/new"
              className="inline-flex items-center px-4 py-2 border border-transparent
                       text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                       w-full justify-center mb-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              + Add Company
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}