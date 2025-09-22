'use client'

import Link from 'next/link'
import { PlusIcon, BanknotesIcon } from '@heroicons/react/24/outline'

/**
 * Company deals component showing related deals
 *
 * Features:
 * - List of active deals for the company
 * - Deal status visualization
 * - Deal value and stage information
 * - Quick add deal functionality
 */

interface CompanyDealsProps {
  companyId: string
}

export function CompanyDeals({ companyId }: CompanyDealsProps) {
  // This would fetch deals from API in real implementation
  const deals = [
    {
      id: '1',
      title: 'Enterprise Software License',
      value: 50000,
      status: 'OPEN',
      stage: 'Proposal',
      expectedCloseDate: '2024-02-15',
    },
    {
      id: '2',
      title: 'Consulting Services',
      value: 25000,
      status: 'OPEN',
      stage: 'Negotiation',
      expectedCloseDate: '2024-01-30',
    },
  ]

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'WON':
        return 'bg-green-100 text-green-800'
      case 'LOST':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
              Deals ({deals.length})
            </h2>
            {deals.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Total pipeline value: {formatCurrency(totalValue)}
              </p>
            )}
          </div>
          <Link
            href={`/dashboard/deals/new?companyId=${companyId}`}
            className="inline-flex items-center px-3 py-2 border border-transparent
                     text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Deal
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-12">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first deal to start tracking opportunities with this company.
            </p>
            <Link
              href={`/dashboard/deals/new?companyId=${companyId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent
                       text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Deal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg
                         hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{deal.title}</h3>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                   font-medium ${getStatusColor(deal.status)}`}>
                      {deal.stage}
                    </span>
                    <span className="text-xs text-gray-500">
                      Expected close: {formatDate(deal.expectedCloseDate)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/dashboard/deals/${deal.id}`}
                  className="ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}