import { Suspense } from 'react'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { DealsTable } from '@/components/deals/deals-table'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'

/**
 * Deals List Page
 *
 * Features:
 * - Desktop-optimized deals table
 * - Pipeline stage filtering
 * - Deal value and status display
 * - Company and contact relationships
 * - Quick add deal functionality
 */

export default function DealsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-1">
            Track sales opportunities and manage your pipeline
          </p>
        </div>
        <Link
          href="/dashboard/deals/new"
          className="inline-flex items-center px-4 py-2 border border-transparent
                   text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Deal
        </Link>
      </div>

      {/* Deals Table */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingPage message="Loading deals..." />}>
          <DealsTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}