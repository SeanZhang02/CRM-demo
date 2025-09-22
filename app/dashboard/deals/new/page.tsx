import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { DealForm } from '@/components/deals/deal-form'

/**
 * Add New Deal Page
 *
 * Features:
 * - Clean form layout optimized for desktop
 * - Form validation with Zod schemas
 * - Auto-save functionality
 * - Navigation breadcrumbs
 */

export default function NewDealPage() {
  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumb */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/deals"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900
                   transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Deals
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Deal</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new deal record to track sales opportunities
          </p>
        </div>
      </div>

      {/* Deal Form */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <div className="px-6 py-8">
          <DealForm mode="create" />
        </div>
      </div>
    </div>
  )
}