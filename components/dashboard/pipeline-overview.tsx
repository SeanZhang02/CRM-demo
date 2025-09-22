'use client'

import Link from 'next/link'
import { BanknotesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

/**
 * Pipeline overview component for dashboard
 *
 * Features:
 * - Visual pipeline stages
 * - Deal counts and values per stage
 * - Progress indicators
 * - Navigation to detailed pipeline view
 */

export function PipelineOverview() {
  // In a real app, this would come from API
  const pipelineData = [
    {
      id: '1',
      name: 'Qualification',
      deals: 8,
      value: 120000,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: '2',
      name: 'Proposal',
      deals: 5,
      value: 185000,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: '3',
      name: 'Negotiation',
      deals: 3,
      value: 95000,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      id: '4',
      name: 'Closed Won',
      deals: 2,
      value: 85000,
      color: 'bg-green-100 text-green-800',
    },
  ]

  const totalValue = pipelineData.reduce((sum, stage) => sum + stage.value, 0)
  const totalDeals = pipelineData.reduce((sum, stage) => sum + stage.deals, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
              Sales Pipeline
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalDeals} deals • {formatCurrency(totalValue)} total value
            </p>
          </div>
          <Link
            href="/dashboard/deals"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700
                     font-medium transition-colors duration-200"
          >
            View Pipeline
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="space-y-4">
          {pipelineData.map((stage, index) => (
            <div key={stage.id} className="relative">
              <div className="flex items-center justify-between p-4 border border-gray-200
                           rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm
                                   font-medium ${stage.color}`}>
                      {stage.name}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {stage.deals} deal{stage.deals !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(stage.value)} total value
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round((stage.value / totalValue) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">of pipeline</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stage.value / totalValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/deals/new"
            className="w-full inline-flex items-center justify-center px-4 py-2
                     border border-transparent text-sm font-medium rounded-lg
                     text-white bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            Add New Deal
          </Link>
        </div>
      </div>
    </div>
  )
}