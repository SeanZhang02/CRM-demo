import Link from 'next/link'
import { PlusIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'

/**
 * Activities Page
 *
 * Features:
 * - Activity list with filtering capabilities
 * - Desktop-optimized layout
 * - Quick actions for common activity types
 * - Calendar integration
 */

// Mock data for now - in real implementation, this would come from API
const mockActivities = [
  {
    id: '1',
    type: 'CALL',
    subject: 'Follow-up call with Acme Corp',
    description: 'Discuss proposal feedback and next steps',
    status: 'COMPLETED',
    priority: 'HIGH',
    dueDate: '2024-01-20T14:00:00Z',
    completedAt: '2024-01-20T14:30:00Z',
    duration: 30,
    company: { name: 'Acme Corp' },
    contact: { firstName: 'John', lastName: 'Doe' },
    owner: { firstName: 'Sarah', lastName: 'Johnson' }
  },
  {
    id: '2',
    type: 'MEETING',
    subject: 'Demo session with Beta Inc',
    description: 'Product demonstration and Q&A',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '2024-01-22T10:00:00Z',
    duration: 60,
    company: { name: 'Beta Inc' },
    contact: { firstName: 'Jane', lastName: 'Smith' },
    owner: { firstName: 'Mike', lastName: 'Chen' }
  },
  {
    id: '3',
    type: 'EMAIL',
    subject: 'Send proposal to Charlie Co',
    description: 'Custom proposal with pricing options',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2024-01-21T16:00:00Z',
    company: { name: 'Charlie Co' },
    contact: { firstName: 'Bob', lastName: 'Johnson' },
    owner: { firstName: 'Sarah', lastName: 'Johnson' }
  },
  {
    id: '4',
    type: 'TASK',
    subject: 'Research Delta LLC requirements',
    description: 'Understand their technical needs and constraints',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '2024-01-23T12:00:00Z',
    company: { name: 'Delta LLC' },
    contact: { firstName: 'Alice', lastName: 'Brown' },
    owner: { firstName: 'Mike', lastName: 'Chen' }
  },
  {
    id: '5',
    type: 'FOLLOW_UP',
    subject: 'Check in with Echo Industries',
    description: 'Follow up on previous meeting outcomes',
    status: 'OVERDUE',
    priority: 'URGENT',
    dueDate: '2024-01-19T09:00:00Z',
    company: { name: 'Echo Industries' },
    contact: { firstName: 'Charlie', lastName: 'Wilson' },
    owner: { firstName: 'Sarah', lastName: 'Johnson' }
  }
]

const getActivityTypeIcon = (type: string) => {
  switch (type) {
    case 'CALL': return '📞'
    case 'EMAIL': return '✉️'
    case 'MEETING': return '🤝'
    case 'TASK': return '✅'
    case 'NOTE': return '📝'
    case 'PROPOSAL': return '📋'
    case 'CONTRACT': return '📄'
    case 'DEMO': return '🖥️'
    case 'FOLLOW_UP': return '🔄'
    default: return '📌'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'text-green-600 bg-green-50'
    case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50'
    case 'PENDING': return 'text-yellow-600 bg-yellow-50'
    case 'OVERDUE': return 'text-red-600 bg-red-50'
    case 'CANCELLED': return 'text-gray-600 bg-gray-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'text-red-600'
    case 'HIGH': return 'text-orange-600'
    case 'MEDIUM': return 'text-yellow-600'
    case 'LOW': return 'text-green-600'
    default: return 'text-gray-600'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-3 text-blue-600" />
            Activities
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage your sales activities and follow-ups
          </p>
        </div>
        <Link
          href="/dashboard/activities/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white
                   bg-blue-600 border border-transparent rounded-md shadow-sm
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                   focus:ring-blue-500 transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Activity
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company/Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.subject}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getActivityTypeIcon(activity.type)}</span>
                      <span className="text-sm text-gray-900">{activity.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.company?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.contact?.firstName} {activity.contact?.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.dueDate ? formatDate(activity.dueDate) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getPriorityColor(activity.priority)}`}>
                      {activity.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.owner?.firstName} {activity.owner?.lastName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}