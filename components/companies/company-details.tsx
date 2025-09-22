'use client'

import {
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

/**
 * Company details component showing comprehensive information
 *
 * Features:
 * - Clean information layout
 * - Contact information display
 * - Business metrics
 * - Address and location data
 */

interface CompanyDetailsProps {
  company: {
    id: string
    name: string
    industry?: string
    website?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    companySize?: string
    status: string
    annualRevenue?: number
    employeeCount?: number
    createdAt: string
    updatedAt: string
  }
}

export function CompanyDetails({ company }: CompanyDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getSizeLabel = (size?: string) => {
    const sizeMap: Record<string, string> = {
      STARTUP: 'Startup (1-10 employees)',
      SMALL: 'Small (11-50 employees)',
      MEDIUM: 'Medium (51-200 employees)',
      LARGE: 'Large (201-1000 employees)',
      ENTERPRISE: 'Enterprise (1000+ employees)',
    }
    return size ? sizeMap[size] || size : 'Not specified'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-base font-medium text-gray-900 flex items-center">
              <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
              Contact Information
            </h3>

            <div className="space-y-4">
              {company.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`tel:${company.phone}`} className="hover:text-blue-600">
                      {company.phone}
                    </a>
                  </dd>
                </div>
              )}

              {company.website && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {company.website}
                    </a>
                  </dd>
                </div>
              )}

              {(company.address || company.city || company.state || company.country) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    Address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="space-y-1">
                      {company.address && <div>{company.address}</div>}
                      {(company.city || company.state || company.postalCode) && (
                        <div>
                          {[company.city, company.state, company.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      {company.country && <div>{company.country}</div>}
                    </div>
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-6">
            <h3 className="text-base font-medium text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
              Business Information
            </h3>

            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Industry</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {company.industry || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Company Size</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getSizeLabel(company.companySize)}
                </dd>
              </div>

              {company.employeeCount && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    Employee Count
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {company.employeeCount.toLocaleString()} employees
                  </dd>
                </div>
              )}

              {company.annualRevenue && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Annual Revenue
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(company.annualRevenue)}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      company.status === 'PROSPECT' ? 'bg-yellow-100 text-yellow-800' :
                      company.status === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                      company.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'}`}>
                    {company.status}
                  </span>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-gray-900">{formatDate(company.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-gray-900">{formatDate(company.updatedAt)}</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}