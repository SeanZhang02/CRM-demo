import { Suspense } from 'react'
import { PatientsTable } from '@/components/patients/patients-table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

/**
 * Patient Results Page - Level 4 Healthcare Navigation
 *
 * Final level of progressive disclosure showing filtered patient results.
 * Displays patients based on service category and demographic filters
 * with quick actions for scheduling and notes.
 *
 * Progressive Disclosure Flow:
 * Level 1: Provider Command Center →
 * Level 2: Service Category Buttons →
 * Level 3: Demographic/Status Filters →
 * Level 4: Patient Results (THIS PAGE)
 *
 * Designed for 2-click patient finding with immediate access to
 * common healthcare provider actions.
 */

interface PatientResultsPageProps {
  searchParams: {
    service?: string
    age?: string
    gender?: string
    status?: string
    location?: string
    filter?: string
    q?: string
  }
}

const serviceNames = {
  'assessment': 'Assessment & Intake',
  'mental-health': 'Mental Health Counseling',
  'medication': 'Medication Management',
  'case-management': 'Case Management',
  'community-education': 'Community Education',
  'crisis-intervention': 'Crisis Intervention',
  'all': 'All Services'
}

const statusNames = {
  'new': 'New Patients',
  'active': 'Active Treatment',
  'waiting': 'Waiting List',
  'completed': 'Completed Treatment',
  'urgent': 'Urgent Attention Required'
}

const ageGroupNames = {
  'children': 'Children (Under 12)',
  'youth': 'Youth (12-17)',
  'adults': 'Adults (18-64)',
  'seniors': 'Older Adults (65+)'
}

export default function PatientResultsPage({ searchParams }: PatientResultsPageProps) {
  const {
    service = 'all',
    age,
    gender,
    status,
    location,
    filter,
    q: searchQuery
  } = searchParams

  // Build page title based on filters
  const buildPageTitle = () => {
    let title = 'Patient Results'

    if (service !== 'all') {
      title = `${serviceNames[service as keyof typeof serviceNames] || service} Patients`
    }

    if (age) {
      title += ` - ${ageGroupNames[age as keyof typeof ageGroupNames] || age}`
    }

    if (status) {
      title += ` - ${statusNames[status as keyof typeof statusNames] || status}`
    }

    if (gender) {
      title += ` - ${gender.charAt(0).toUpperCase() + gender.slice(1)}`
    }

    if (location) {
      title += ` - ${location}`
    }

    return title
  }

  // Build breadcrumb navigation
  const buildBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Provider Dashboard', href: '/dashboard' },
      { label: 'Find Patient', href: '/dashboard/patients/search' }
    ]

    if (service !== 'all') {
      breadcrumbs.push({
        label: serviceNames[service as keyof typeof serviceNames] || service,
        href: `/dashboard/patients/search?service=${service}`
      })
    }

    breadcrumbs.push({
      label: 'Results',
      href: '#'
    })

    return breadcrumbs
  }

  const pageTitle = buildPageTitle()
  const breadcrumbs = buildBreadcrumbs()

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumbs and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">→</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-gray-700">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
              {pageTitle}
            </h1>
            <p className="text-gray-600 mt-1">
              {searchQuery
                ? `Search results for "${searchQuery}"`
                : 'Patients matching your selected criteria. Click on any patient to view details and schedule appointments.'
              }
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Back to Search Button */}
            <Link
              href="/dashboard/patients/search"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg
                       text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Search
            </Link>

            {/* Refine Search Button */}
            <Link
              href={`/dashboard/patients/search?service=${service}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg
                       text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       transition-colors duration-200"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Refine Search
            </Link>

            {/* Add New Patient Button */}
            <Link
              href="/dashboard/patients/new"
              className="inline-flex items-center px-4 py-2 border border-transparent
                       text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       transition-colors duration-200"
            >
              + Add Patient
            </Link>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(service !== 'all' || age || gender || status || location) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Active Filters:</h4>
            <div className="flex flex-wrap gap-2">
              {service !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Service: {serviceNames[service as keyof typeof serviceNames]}
                </span>
              )}
              {age && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Age: {ageGroupNames[age as keyof typeof ageGroupNames]}
                </span>
              )}
              {gender && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Gender: {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </span>
              )}
              {status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Status: {statusNames[status as keyof typeof statusNames]}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  Location: {location}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Patient Results Table */}
      <Suspense fallback={<LoadingSpinner />}>
        <PatientsTable
          serviceFilter={service}
          demographicFilter={age || gender}
          statusFilter={status}
          locationFilter={location}
          showFilters={true}
        />
      </Suspense>

      {/* Quick Navigation Footer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="hover:text-gray-900">
              ← Provider Dashboard
            </Link>
            <span>•</span>
            <Link href="/dashboard/patients/search" className="hover:text-gray-900">
              New Search
            </Link>
            <span>•</span>
            <Link href="/dashboard/schedule" className="hover:text-gray-900">
              My Schedule
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}