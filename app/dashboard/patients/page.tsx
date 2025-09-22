import { Suspense } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { PatientsTable } from '@/components/patients/patients-table'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'

/**
 * All Patients Page
 *
 * Healthcare-focused patient management interface replacing companies page.
 * Provides comprehensive view of all patients across all services with
 * healthcare-relevant search, filtering, and quick actions.
 *
 * Features:
 * - Service-based patient organization
 * - Healthcare provider workflow integration
 * - Quick patient search and filtering
 * - One-click access to scheduling and notes
 * - HIPAA-compliant patient information display
 * - Multi-site APCTC patient coordination
 *
 * Designed for medical professionals managing 100+ patients daily.
 */

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header with Healthcare Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <HeartIcon className="h-8 w-8 text-blue-600 mr-3" />
            All Patients
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive patient management across all APCTC services and locations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Patient Search */}
          <Link
            href="/dashboard/patients/search"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg
                     text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Find Patient
          </Link>

          {/* Add New Patient */}
          <Link
            href="/dashboard/patients/new"
            className="inline-flex items-center px-4 py-2 border border-transparent
                     text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Patient
          </Link>
        </div>
      </div>

      {/* Quick Service Category Links */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Link
          href="/dashboard/patients/search?service=assessment"
          className="group p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-blue-900 group-hover:text-blue-800">
              Assessment
            </div>
            <div className="text-xs text-blue-600 mt-1">24 patients</div>
          </div>
        </Link>

        <Link
          href="/dashboard/patients/search?service=mental-health"
          className="group p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors duration-200"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-purple-900 group-hover:text-purple-800">
              Mental Health
            </div>
            <div className="text-xs text-purple-600 mt-1">186 patients</div>
          </div>
        </Link>

        <Link
          href="/dashboard/patients/search?service=medication"
          className="group p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-200"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-green-900 group-hover:text-green-800">
              Medication
            </div>
            <div className="text-xs text-green-600 mt-1">89 patients</div>
          </div>
        </Link>

        <Link
          href="/dashboard/patients/search?service=case-management"
          className="group p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors duration-200"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-amber-900 group-hover:text-amber-800">
              Case Management
            </div>
            <div className="text-xs text-amber-600 mt-1">142 patients</div>
          </div>
        </Link>

        <Link
          href="/dashboard/patients/search?service=community-education"
          className="group p-4 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors duration-200"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-teal-900 group-hover:text-teal-800">
              Community Ed
            </div>
            <div className="text-xs text-teal-600 mt-1">67 patients</div>
          </div>
        </Link>

        <Link
          href="/dashboard/patients/search?service=crisis-intervention"
          className="group p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors duration-200"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-red-900 group-hover:text-red-800">
              Crisis Support
            </div>
            <div className="text-xs text-red-600 mt-1">31 patients</div>
          </div>
        </Link>
      </div>

      {/* Key Patient Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <HeartIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-semibold text-gray-900">542</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600">A</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Treatment</p>
              <p className="text-2xl font-semibold text-gray-900">387</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-amber-600">N</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New This Month</p>
              <p className="text-2xl font-semibold text-gray-900">23</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-red-600">!</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Urgent Attention</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Patients Table */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingPage message="Loading all patients..." />}>
          <PatientsTable
            showFilters={true}
          />
        </Suspense>
      </ErrorBoundary>

      {/* Quick Actions Footer */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Quick Patient Management</h3>
            <p className="text-sm text-blue-700 mt-1">
              Use the search function above to find patients by service type, demographics, or treatment status.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/patients/search"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Advanced Search →
            </Link>
            <Link
              href="/dashboard/schedule"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Schedule →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}