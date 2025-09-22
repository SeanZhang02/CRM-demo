'use client'

import Link from 'next/link'
import {
  PlusIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

/**
 * Company activities component showing activity timeline
 *
 * Features:
 * - Activity timeline view
 * - Different activity types with icons
 * - Recent activity filtering
 * - Quick add activity functionality
 */

interface CompanyActivitiesProps {
  companyId: string
}

export function CompanyActivities({ companyId }: CompanyActivitiesProps) {
  // This would fetch activities from API in real implementation
  const activities = [
    {
      id: '1',
      type: 'CALL',
      subject: 'Follow-up call about proposal',
      description: 'Discussed pricing and implementation timeline',
      completedAt: '2024-01-15T10:30:00Z',
      contact: 'John Doe',
    },
    {
      id: '2',
      type: 'EMAIL',
      subject: 'Sent proposal document',
      description: 'Shared detailed proposal for enterprise license',
      completedAt: '2024-01-14T14:20:00Z',
      contact: 'Jane Smith',
    },
    {
      id: '3',
      type: 'MEETING',
      subject: 'Initial discovery meeting',
      description: 'Discussed requirements and current challenges',
      completedAt: '2024-01-10T09:00:00Z',
      contact: 'John Doe',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
            Recent Activities ({activities.length})
          </h2>
          <Link
            href={`/dashboard/activities/new?companyId=${companyId}`}
            className="inline-flex items-center px-3 py-2 border border-transparent
                     text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Log Activity
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
            <p className="text-gray-600 mb-6">
              Start logging activities to track your interactions with this company.
            </p>
            <Link
              href={`/dashboard/activities/new?companyId=${companyId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent
                       text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Log First Activity
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="relative">
                  {index !== activities.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200" />
                  )}
                  <div className="flex space-x-4">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                                   ${getActivityColor(activity.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {activity.subject}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.completedAt)}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      )}
                      {activity.contact && (
                        <p className="text-xs text-gray-500 mt-2">
                          With {activity.contact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="pt-4 border-t border-gray-200">
              <Link
                href={`/dashboard/activities?companyId=${companyId}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all activities →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}