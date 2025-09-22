'use client'

import Link from 'next/link'
import {
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

/**
 * Recent activity component for dashboard
 *
 * Features:
 * - Latest activities across all entities
 * - Activity type icons and colors
 * - Relative timestamps
 * - Navigation to full activity log
 */

export function RecentActivity() {
  // In a real app, this would come from API
  const recentActivities = [
    {
      id: '1',
      type: 'CALL',
      subject: 'Follow-up call with Acme Corp',
      contact: 'John Doe',
      company: 'Acme Corp',
      time: '2 hours ago',
    },
    {
      id: '2',
      type: 'EMAIL',
      subject: 'Sent proposal to Beta Inc',
      contact: 'Jane Smith',
      company: 'Beta Inc',
      time: '4 hours ago',
    },
    {
      id: '3',
      type: 'MEETING',
      subject: 'Discovery meeting with Charlie Co',
      contact: 'Bob Johnson',
      company: 'Charlie Co',
      time: '1 day ago',
    },
    {
      id: '4',
      type: 'NOTE',
      subject: 'Added notes from demo session',
      contact: 'Alice Brown',
      company: 'Delta LLC',
      time: '2 days ago',
    },
    {
      id: '5',
      type: 'CALL',
      subject: 'Cold call to Echo Industries',
      contact: 'Charlie Wilson',
      company: 'Echo Industries',
      time: '3 days ago',
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return PhoneIcon
      case 'EMAIL':
        return EnvelopeIcon
      case 'MEETING':
        return ChatBubbleLeftRightIcon
      case 'NOTE':
        return DocumentTextIcon
      default:
        return CalendarIcon
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'CALL':
        return 'bg-green-100 text-green-600'
      case 'EMAIL':
        return 'bg-blue-100 text-blue-600'
      case 'MEETING':
        return 'bg-purple-100 text-purple-600'
      case 'NOTE':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
            Recent Activity
          </h2>
          <Link
            href="/dashboard/activities"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700
                     font-medium transition-colors duration-200"
          >
            View All
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="relative">
                {index !== recentActivities.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200" />
                )}
                <div className="flex space-x-3">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                                 ${getActivityColor(activity.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.subject}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {activity.time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-600">
                        {activity.contact}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600">
                        {activity.company}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/activities/new"
            className="w-full inline-flex items-center justify-center px-4 py-2
                     border border-gray-300 text-sm font-medium rounded-lg
                     text-gray-700 bg-white hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            Log New Activity
          </Link>
        </div>
      </div>
    </div>
  )
}