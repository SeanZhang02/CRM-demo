import { Suspense } from 'react'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { CompaniesTable } from '@/components/companies/companies-table'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'

/**
 * Companies List Page
 *
 * Features:
 * - Desktop-optimized data table with filtering
 * - Search and sort functionality
 * - Quick actions and bulk operations
 * - Export capabilities
 * - Responsive design for 1024px+ screens
 */

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">
            Manage your business relationships and customer data
          </p>
        </div>
        <Link
          href="/dashboard/companies/new"
          className="inline-flex items-center px-4 py-2 border border-transparent
                   text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Company
        </Link>
      </div>

      {/* Companies Table */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingPage message="Loading companies..." />}>
          <CompaniesTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}