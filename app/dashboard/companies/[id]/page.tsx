import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  UsersIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { CompanyDetails } from '@/components/companies/company-details'
import { CompanyContacts } from '@/components/companies/company-contacts'
import { CompanyDeals } from '@/components/companies/company-deals'
import { CompanyActivities } from '@/components/companies/company-activities'

/**
 * Company Detail Page
 *
 * Features:
 * - Comprehensive company overview
 * - Related contacts and deals
 * - Activity timeline
 * - Desktop-optimized layout with tabs
 * - Quick action buttons
 */

interface CompanyPageProps {
  params: { id: string }
}

async function getCompany(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/companies/${id}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      if (response.status === 404) {
        notFound()
      }
      throw new Error(`Failed to fetch company: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching company:', error)
    throw error
  }
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  let company
  try {
    company = await getCompany(params.id)
  } catch (error) {
    // Error will be handled by error boundary
    throw error
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumb */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900
                   transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Companies
        </Link>
      </div>

      {/* Company Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  {company.industry && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
                                   font-medium bg-gray-100 text-gray-800">
                      {company.industry}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      company.status === 'PROSPECT' ? 'bg-yellow-100 text-yellow-800' :
                      company.status === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {company.status}
                  </span>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/companies/${company.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg
                         text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                         transition-colors duration-200"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg
                         text-sm font-medium text-red-700 bg-white hover:bg-red-50
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                         transition-colors duration-200"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <UsersIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {company._count?.contacts || 0}
                </div>
                <div className="text-sm text-gray-600">Contacts</div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <BanknotesIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {company._count?.deals || 0}
                </div>
                <div className="text-sm text-gray-600">Deals</div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {company._count?.activities || 0}
                </div>
                <div className="text-sm text-gray-600">Activities</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="space-y-6">
        <ErrorBoundary>
          <Suspense fallback={<LoadingPage message="Loading company details..." />}>
            <CompanyDetails company={company} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<LoadingPage message="Loading contacts..." />}>
            <CompanyContacts companyId={company.id} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<LoadingPage message="Loading deals..." />}>
            <CompanyDeals companyId={company.id} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<LoadingPage message="Loading activities..." />}>
            <CompanyActivities companyId={company.id} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}