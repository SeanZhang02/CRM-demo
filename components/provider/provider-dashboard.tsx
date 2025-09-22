'use client'

import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  BellIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartIconSolid,
  CalendarDaysIcon as CalendarIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid'

/**
 * Healthcare Provider Command Center Dashboard
 *
 * Designed for medical professionals managing 100+ patients daily.
 * Replaces business CRM dashboard with healthcare-focused workflow.
 *
 * Key Features:
 * - Prominent patient search (99% use case)
 * - Today's schedule at-a-glance
 * - Critical alerts and reminders
 * - Recent patients for quick access
 * - Quick notes for immediate documentation
 * - One-click access to common actions
 *
 * Healthcare Workflow: Search → View → Schedule → Notes → Next Patient
 */

interface ProviderDashboardProps {
  providerName?: string
  todaysAppointments?: number
  urgentAlerts?: number
  recentPatients?: Array<{
    id: string
    name: string
    lastSeen: string
    service: string
  }>
}

export function ProviderDashboard({
  providerName = "Dr. Sarah Lee",
  todaysAppointments = 8,
  urgentAlerts = 3,
  recentPatients = [
    { id: "1", name: "Maria Chen", lastSeen: "Today", service: "Mental Health" },
    { id: "2", name: "David Kim", lastSeen: "Yesterday", service: "Medication Review" },
    { id: "3", name: "Lisa Wang", lastSeen: "2 days ago", service: "Case Management" }
  ]
}: ProviderDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header with Provider Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <HeartIconSolid className="h-8 w-8 text-blue-600 mr-3" />
            APCTC Provider Portal
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {providerName} • Alhambra Center • {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Last login: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Primary Actions - Find Patient & Add Patient */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/patients/search"
          className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                   text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center">
            <MagnifyingGlassIcon className="h-8 w-8 mr-4" />
            <div>
              <h2 className="text-xl font-semibold">Find Patient</h2>
              <p className="text-blue-100 mt-1">Search by service, name, or demographics</p>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <kbd className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded">Ctrl+F</kbd>
          </div>
        </Link>

        <Link
          href="/dashboard/patients/new"
          className="group relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800
                   text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center">
            <UserPlusIcon className="h-8 w-8 mr-4" />
            <div>
              <h2 className="text-xl font-semibold">Add New Patient</h2>
              <p className="text-green-100 mt-1">Register new patient for services</p>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <kbd className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded">Ctrl+N</kbd>
          </div>
        </Link>
      </div>

      {/* Dashboard Grid - Schedule, Alerts, Recent Patients, Quick Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIconSolid className="h-5 w-5 text-blue-600 mr-2" />
              Today's Schedule
            </h3>
            <span className="text-sm text-gray-500">{todaysAppointments} appointments</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div>
                <p className="font-medium text-gray-900">9:00 AM - Maria Chen</p>
                <p className="text-sm text-gray-600">Mental Health Session • Room 203</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600 font-medium">In 15 mins</p>
                <p className="text-xs text-gray-500">60 min session</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">10:30 AM - David Kim</p>
                <p className="text-sm text-gray-600">Medication Review • Room 205</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">In 1.5 hrs</p>
                <p className="text-xs text-gray-500">30 min session</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">2:00 PM - Lisa Wang</p>
                <p className="text-sm text-gray-600">Case Management • Room 201</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">In 5 hrs</p>
                <p className="text-xs text-gray-500">45 min session</p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/schedule"
            className="block mt-4 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Full Schedule
          </Link>
        </div>

        {/* Alerts & Reminders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BellIconSolid className="h-5 w-5 text-amber-600 mr-2" />
              Alerts & Reminders
            </h3>
            <span className="text-sm text-amber-600 font-medium">{urgentAlerts} urgent</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">John Doe missed appointment</p>
                <p className="text-sm text-red-700">Today 8:00 AM - No show for therapy session</p>
                <button className="text-xs text-red-600 hover:text-red-800 underline mt-1">
                  Reschedule appointment
                </button>
              </div>
            </div>

            <div className="flex items-start p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <ClockIcon className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">3 assessments due this week</p>
                <p className="text-sm text-amber-700">Treatment plan reviews needed</p>
                <button className="text-xs text-amber-600 hover:text-amber-800 underline mt-1">
                  View pending assessments
                </button>
              </div>
            </div>

            <div className="flex items-start p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <BellIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Sarah Lee follow-up reminder</p>
                <p className="text-sm text-blue-700">Medication adjustment check-in tomorrow</p>
                <button className="text-xs text-blue-600 hover:text-blue-800 underline mt-1">
                  Schedule follow-up
                </button>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/alerts"
            className="block mt-4 text-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            View All Alerts
          </Link>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <HeartIcon className="h-5 w-5 text-purple-600 mr-2" />
              Recent Patients
            </h3>
            <span className="text-sm text-gray-500">Last accessed</span>
          </div>

          <div className="space-y-3">
            {recentPatients.map((patient) => (
              <Link
                key={patient.id}
                href={`/dashboard/patients/${patient.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-medium text-sm">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-purple-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">{patient.service}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{patient.lastSeen}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/dashboard/patients/recent"
            className="block mt-4 text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View All Recent
          </Link>
        </div>

        {/* Quick Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
              Quick Notes
            </h3>
          </div>

          <div className="space-y-4">
            <textarea
              placeholder="Add a quick reminder or note..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Auto-save enabled</span>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Save Note
              </button>
            </div>

            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Notes</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="text-gray-900">Remember to check Maria's anxiety progress</p>
                  <p className="text-gray-500 text-xs">2 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-900">David needs medication dosage discussion</p>
                  <p className="text-gray-500 text-xs">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}