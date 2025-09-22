import { Suspense } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * New Session Note Page
 *
 * Healthcare provider interface for creating new patient session notes.
 * Supports SOAP format and various session types across APCTC services.
 *
 * Features:
 * - Patient selection and verification
 * - Session type and service categorization
 * - SOAP note format (Subjective, Objective, Assessment, Plan)
 * - Treatment goal tracking
 * - Risk assessment documentation
 * - Multi-location support
 */

export default function NewSessionNotePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/sessions"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900
                   transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Session Notes
        </Link>
      </div>

      {/* Session Note Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">New Session Note</h1>
                <p className="text-sm text-gray-600">Document patient session and progress</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Provider: Dr. Sarah Lee • {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="space-y-6">
            {/* Patient Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                Patient Information
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
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Selected Patient Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Patient
                  </label>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">MC</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Maria Chen</div>
                        <div className="text-sm text-gray-600">MRN-2024001 • Mental Health • Age 38</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                Session Details
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Session Type */}
                <div>
                  <label htmlFor="session-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Session Type
                  </label>
                  <select
                    id="session-type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="individual-therapy">Individual Therapy</option>
                    <option value="group-therapy">Group Therapy</option>
                    <option value="family-therapy">Family Therapy</option>
                    <option value="assessment">Assessment</option>
                    <option value="medication-review">Medication Review</option>
                    <option value="case-management">Case Management</option>
                    <option value="crisis-intervention">Crisis Intervention</option>
                  </select>
                </div>

                {/* Service Category */}
                <div>
                  <label htmlFor="service-category" className="block text-sm font-medium text-gray-700 mb-2">
                    Service Category
                  </label>
                  <select
                    id="service-category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="mental-health">Mental Health Counseling</option>
                    <option value="medication">Medication Management</option>
                    <option value="assessment">Assessment & Intake</option>
                    <option value="case-management">Case Management</option>
                    <option value="crisis">Crisis Intervention</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    id="duration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    id="location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="alhambra">Alhambra Center - Room 203</option>
                    <option value="monterey-park">Monterey Park Center</option>
                    <option value="rosemead">Rosemead Center</option>
                    <option value="el-monte">El Monte Center</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SOAP Note Format */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                SOAP Note Documentation
              </h2>

              <div className="space-y-6">
                {/* Subjective */}
                <div>
                  <label htmlFor="subjective" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-bold text-purple-600">S</span>ubjective
                    <span className="text-gray-500 font-normal ml-2">(Patient's reported experience, feelings, concerns)</span>
                  </label>
                  <textarea
                    id="subjective"
                    rows={4}
                    placeholder="Patient reports feeling anxious about work situation. States 'I've been having trouble sleeping and feel overwhelmed'..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Objective */}
                <div>
                  <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-bold text-purple-600">O</span>bjective
                    <span className="text-gray-500 font-normal ml-2">(Observable behaviors, appearance, mental status)</span>
                  </label>
                  <textarea
                    id="objective"
                    rows={4}
                    placeholder="Patient appeared alert and oriented x3. Mood appeared anxious with fidgeting behaviors observed. Speech was rapid but coherent..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Assessment */}
                <div>
                  <label htmlFor="assessment" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-bold text-purple-600">A</span>ssessment
                    <span className="text-gray-500 font-normal ml-2">(Clinical impression, progress toward goals)</span>
                  </label>
                  <textarea
                    id="assessment"
                    rows={4}
                    placeholder="Patient demonstrates continued symptoms of generalized anxiety. Shows good engagement in CBT techniques. Progress noted in identifying triggers..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Plan */}
                <div>
                  <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-bold text-purple-600">P</span>lan
                    <span className="text-gray-500 font-normal ml-2">(Treatment recommendations, homework, next steps)</span>
                  </label>
                  <textarea
                    id="plan"
                    rows={4}
                    placeholder="Continue weekly CBT sessions. Homework: practice deep breathing exercises daily. Schedule follow-up in one week. Consider medication consultation if symptoms persist..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Treatment Goals Progress */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Treatment Goals Progress</h2>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">Anxiety reduction through CBT techniques</div>
                    <select className="text-sm border border-gray-300 rounded px-2 py-1">
                      <option>No Progress</option>
                      <option>Minimal Progress</option>
                      <option selected>Some Progress</option>
                      <option>Good Progress</option>
                      <option>Goal Met</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Notes on progress toward this goal..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">Develop coping skills for work stress</div>
                    <select className="text-sm border border-gray-300 rounded px-2 py-1">
                      <option>No Progress</option>
                      <option selected>Minimal Progress</option>
                      <option>Some Progress</option>
                      <option>Good Progress</option>
                      <option>Goal Met</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Notes on progress toward this goal..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
                Risk Assessment
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suicide Risk Level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                    <option selected>No Risk</option>
                    <option>Low Risk</option>
                    <option>Moderate Risk</option>
                    <option>High Risk</option>
                    <option>Immediate Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Self-Harm Risk Level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                    <option selected>No Risk</option>
                    <option>Low Risk</option>
                    <option>Moderate Risk</option>
                    <option>High Risk</option>
                    <option>Immediate Risk</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="risk-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Assessment Notes
                </label>
                <textarea
                  id="risk-notes"
                  rows={3}
                  placeholder="Document any risk factors, protective factors, or safety planning discussed..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Next Appointment */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                Next Appointment Planning
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="next-session-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Recommended Next Session
                  </label>
                  <input
                    type="date"
                    id="next-session-date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                    Session Frequency
                  </label>
                  <select
                    id="frequency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option selected>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                    <option>As needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actions
                  </label>
                  <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                                   transition-colors duration-200">
                    Schedule Next Session
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                * Session notes are automatically saved as drafts
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium
                                 text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  Save as Draft
                </button>
                <Link
                  href="/dashboard/sessions"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium
                           text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Link>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium
                                 hover:bg-purple-700 transition-colors duration-200">
                  Complete & Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}