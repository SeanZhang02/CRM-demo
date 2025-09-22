'use client'

import Link from 'next/link'
import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline'

/**
 * Dashboard header with quick actions and overview
 *
 * Features:
 * - Quick add buttons for main entities
 * - Dashboard title and description
 * - Desktop-optimized layout
 */

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
          CRM Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Overview of your business relationships and sales pipeline
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard/companies/new"
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg
                   text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Company
        </Link>
        <Link
          href="/dashboard/contacts/new"
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg
                   text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Contact
        </Link>
        <Link
          href="/dashboard/deals/new"
          className="inline-flex items-center px-4 py-2 border border-transparent
                   text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Deal
        </Link>
      </div>
    </div>
  )
}