import { Suspense } from 'react'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ContactsTable } from '@/components/contacts/contacts-table'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'

/**
 * Contacts List Page
 *
 * Features:
 * - Desktop-optimized contacts table
 * - Search and filter by company
 * - Quick add contact functionality
 * - Company relationship display
 * - Primary contact indicators
 */

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage individual contacts and their company relationships
          </p>
        </div>
        <Link
          href="/dashboard/contacts/new"
          className="inline-flex items-center px-4 py-2 border border-transparent
                   text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Contact
        </Link>
      </div>

      {/* Contacts Table */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingPage message="Loading contacts..." />}>
          <ContactsTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}