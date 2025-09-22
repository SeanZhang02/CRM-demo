import { Suspense } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * New Appointment Scheduling Page
 *
 * Healthcare provider interface for scheduling new patient appointments.
 * Integrated with APCTC's 8-location system and provider schedules.
 *
 * Features:
 * - Patient search and selection
 * - Service type selection
 * - Provider availability checking
 * - Room assignment across locations
 * - Appointment confirmation
 */

export default function NewAppointmentPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/schedule"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900
                   transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Schedule
        </Link>
      </div>

      {/* Scheduling Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Schedule New Appointment</h1>
                <p className="text-sm text-gray-600">Schedule patient appointments across APCTC locations</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Provider: Dr. Sarah Lee • Alhambra Center
            </div>
          </div>

          {/* Step 1: Patient Selection */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                Step 1: Select Patient
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Search */}
                <div>
                  <label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Patient
                  </label>
                  <input
                    type="text"
                    id="patient-search"
                    placeholder="Search by name, MRN, or phone..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Quick Patient Access */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recent Patients
                  </label>
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50
                                     transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Maria Chen</div>
                          <div className="text-sm text-gray-600">MRN-2024001 • Mental Health</div>
                        </div>
                        <div className="text-sm text-gray-500">(626) 555-0123</div>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50
                                     transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">David Kim</div>
                          <div className="text-sm text-gray-600">MRN-2024002 • Medication Review</div>
                        </div>
                        <div className="text-sm text-gray-500">(626) 555-0234</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Appointment Details */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                Step 2: Appointment Details
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Service Type */}
                <div>
                  <label htmlFor="service-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <select
                    id="service-type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select service...</option>
                    <option value="mental-health">Mental Health Session</option>
                    <option value="medication">Medication Review</option>
                    <option value="assessment">Assessment & Intake</option>
                    <option value="case-management">Case Management</option>
                    <option value="crisis">Crisis Intervention</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    id="duration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60" selected>60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="routine" selected>Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="same-day">Same Day</option>
                    <option value="crisis">Crisis</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Date & Time Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                Step 3: Date & Time
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    id="appointment-date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Available Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Times
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                      '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'].map((time) => (
                      <button
                        key={time}
                        className="p-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50
                                 hover:border-blue-300 transition-colors duration-200"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Location & Room */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                Step 4: Location & Room
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* APCTC Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    APCTC Location
                  </label>
                  <select
                    id="location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="alhambra" selected>Alhambra Center</option>
                    <option value="monterey-park">Monterey Park Center</option>
                    <option value="rosemead">Rosemead Center</option>
                    <option value="el-monte">El Monte Center</option>
                    <option value="baldwin-park">Baldwin Park Center</option>
                    <option value="west-covina">West Covina Center</option>
                    <option value="azusa">Azusa Center</option>
                    <option value="pomona">Pomona Center</option>
                  </select>
                </div>

                {/* Room Assignment */}
                <div>
                  <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                    Room Assignment
                  </label>
                  <select
                    id="room"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Auto-assign room</option>
                    <option value="201">Room 201 - Individual Therapy</option>
                    <option value="202">Room 202 - Individual Therapy</option>
                    <option value="203" selected>Room 203 - Individual Therapy</option>
                    <option value="204">Room 204 - Group Therapy</option>
                    <option value="205">Room 205 - Medication Review</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="appointment-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Notes (Optional)
              </label>
              <textarea
                id="appointment-notes"
                rows={3}
                placeholder="Add any special instructions or notes for this appointment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                * Appointment confirmations will be sent via text and email
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard/schedule"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium
                           text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Link>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                           hover:bg-blue-700 transition-colors duration-200"
                >
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Availability Preview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Schedule Preview</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Today</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">8</div>
              <div className="text-sm text-gray-600">appointments</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Tomorrow</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">6</div>
              <div className="text-sm text-blue-600">appointments</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900">Next Available</div>
              <div className="text-sm font-bold text-green-900 mt-1">Today 2:30 PM</div>
              <div className="text-sm text-green-600">Room 203</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}