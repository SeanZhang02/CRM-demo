'use client'

import {
  BuildingOfficeIcon,
  UsersIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

/**
 * Dashboard statistics cards
 *
 * Features:
 * - Key CRM metrics
 * - Trend indicators
 * - Desktop-optimized card layout
 * - Quick navigation to detailed views
 */

export function DashboardStats() {
  // In a real app, these would come from API calls
  const stats = [
    {
      name: 'Total Companies',
      value: '42',
      change: '+2 this week',
      changeType: 'positive',
      icon: BuildingOfficeIcon,
      href: '/dashboard/companies',
    },
    {
      name: 'Active Contacts',
      value: '128',
      change: '+8 this week',
      changeType: 'positive',
      icon: UsersIcon,
      href: '/dashboard/contacts',
    },
    {
      name: 'Open Deals',
      value: '23',
      change: '+3 this week',
      changeType: 'positive',
      icon: BanknotesIcon,
      href: '/dashboard/deals',
    },
    {
      name: 'Pipeline Value',
      value: '$485K',
      change: '+12% this month',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      href: '/dashboard/deals',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-6
                   hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span
                  className={`font-medium ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}