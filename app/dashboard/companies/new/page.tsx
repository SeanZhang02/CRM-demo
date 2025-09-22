import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { CompanyForm } from '@/components/companies/company-form'

/**
 * Add New Company Page
 *
 * Features:
 * - Clean form layout optimized for desktop
 * - Form validation with Zod schemas
 * - Auto-save functionality
 * - Navigation breadcrumbs
 */

export default function NewCompanyPage() {
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Company</h1>
          <p className="text-gray-600 mt-1">
            Create a new company record to start managing contacts and deals
          </p>
        </div>
      </div>

      {/* Company Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-8">
          <CompanyForm mode="create" />
        </div>
      </div>
    </div>
  )
}