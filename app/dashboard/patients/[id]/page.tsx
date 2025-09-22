import { Suspense } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Patient Detail Page with Integrated Healthcare Workflow
 *
 * Comprehensive patient management interface replacing company detail pages.
 * Designed for medical professionals to manage all aspects of patient care
 * from a single integrated interface.
 *
 * Features:
 * - Patient overview with medical context
 * - Integrated appointment scheduling
 * - Session notes and treatment plans
 * - Family/emergency contacts management
 * - Quick actions for common tasks
 * - Treatment progress tracking
 * - HIPAA-compliant information display
 *
 * Healthcare Workflow: Search → View → Schedule → Notes → Next Patient
 */

interface PatientDetailPageProps {
  params: {
    id: string
  }
}

// Mock patient data for healthcare demo
const mockPatient = {
  id: '1',
  name: 'Maria Chen',
  dateOfBirth: '1985-01-15',
  age: 38,
  gender: 'Female',
  preferredLanguage: 'Mandarin',
  primaryService: 'Mental Health Counseling',
  treatmentStatus: 'active',
  medicalRecordNumber: 'MRN-2024001',
  insuranceProvider: 'LA Care Health Plan',
  primaryProvider: 'Dr. Sarah Lee',
  location: 'Alhambra Center',
  consentOnFile: true,
  hipaaAuthorizationDate: '2024-12-01',
  emergencyContact: {
    name: 'John Chen',
    relationship: 'Spouse',
    phone: '(626) 555-0123',
    language: 'Mandarin',
    canAccessInformation: true
  },
  secondaryContact: {
    name: 'Linda Chen',
    relationship: 'Sister',
    phone: '(714) 555-0456',
    language: 'English'
  },
  treatmentPlan: {
    type: 'Cognitive Behavioral Therapy',
    startDate: '2024-12-01',
    reviewDate: '2025-02-01',
    provider: 'Dr. Sarah Lee',
    progress: 'Good improvement',
    goals: [
      'Anxiety reduction through CBT techniques',
      'Develop coping skills for work stress',
      'Improve sleep quality and routine'
    ],
    sessionsAuthorized: 12,
    sessionsCompleted: 6
  },
  appointments: [
    {
      id: '1',
      date: '2025-01-22',
      time: '10:00',
      type: 'Mental Health Session',
      provider: 'Dr. Sarah Lee',
      status: 'scheduled',
      duration: 60,
      location: 'Alhambra Center - Room 203'
    },
    {
      id: '2',
      date: '2025-01-15',
      time: '10:00',
      type: 'Individual Therapy',
      provider: 'Dr. Sarah Lee',
      status: 'completed',
      duration: 60,
      notes: 'Patient showed improvement in anxiety symptoms. Discussed coping strategies for work-related stress.'
    },
    {
      id: '3',
      date: '2025-01-08',
      time: '10:00',
      type: 'Individual Therapy',
      provider: 'Dr. Sarah Lee',
      status: 'completed',
      duration: 60,
      notes: 'Initial anxiety assessment. Patient reported high stress levels at work. Established treatment goals.'
    }
  ],
  recentNotes: [
    {
      date: '2025-01-15',
      provider: 'Dr. Sarah Lee',
      type: 'Session Note',
      content: 'Patient demonstrated good understanding of CBT techniques. Homework assignment: practice deep breathing exercises daily.'
    },
    {
      date: '2025-01-08',
      provider: 'Dr. Sarah Lee',
      type: 'Assessment',
      content: 'Initial assessment completed. GAD-7 score: 12 (moderate anxiety). Discussed treatment options and patient preferences.'
    }
  ]
}

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const patient = mockPatient // In real app, fetch by params.id

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string): string => {
    const time = new Date(`2000-01-01T${timeString}`)
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircleIcon
      case 'scheduled':
        return ClockIcon
      case 'completed':
        return CheckCircleIcon
      default:
        return ClockIcon
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to All Patients
          </Link>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">Patient ID: {patient.medicalRecordNumber}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/patients/${patient.id}/edit`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg
                     text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </div>
      </div>

      {/* Patient Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-xl">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>Age {patient.age} • {patient.gender}</span>
                <span>•</span>
                <span>{patient.preferredLanguage}</span>
                <span>•</span>
                <span>{patient.medicalRecordNumber}</span>
              </div>

              <div className="flex items-center space-x-3 mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.treatmentStatus)}`}>
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Active Treatment
                </span>

                <span className="inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium text-purple-600 bg-purple-50 border-purple-200">
                  <HeartIconSolid className="h-3 w-3 mr-1" />
                  {patient.primaryService}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Link
              href={`/dashboard/schedule/new?patient=${patient.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent
                       text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Schedule
            </Link>

            <Link
              href={`/dashboard/sessions/new?patient=${patient.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300
                       text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Add Note
            </Link>

            <Link
              href={`tel:${patient.emergencyContact.phone}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300
                       text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600 mr-2" />
                Appointment Schedule
              </h2>
              <Link
                href={`/dashboard/schedule/new?patient=${patient.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Schedule New →
              </Link>
            </div>

            <div className="space-y-3">
              {patient.appointments.map((appointment) => {
                const StatusIcon = getStatusIcon(appointment.status)
                return (
                  <div
                    key={appointment.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      appointment.status === 'scheduled'
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDate(appointment.date)} at {formatTime(appointment.time)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.type} • {appointment.provider} • {appointment.duration} minutes
                        </p>
                        {appointment.location && (
                          <p className="text-sm text-gray-500">{appointment.location}</p>
                        )}
                        {appointment.notes && (
                          <p className="text-sm text-gray-700 mt-2 italic">"{appointment.notes}"</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Session Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                Recent Session Notes
              </h2>
              <Link
                href={`/dashboard/sessions/new?patient=${patient.id}`}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                Add Note →
              </Link>
            </div>

            <div className="space-y-4">
              {patient.recentNotes.map((note, index) => (
                <div key={index} className="border-l-4 border-green-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{note.provider}</span>
                    <span className="text-sm text-gray-500">{formatDate(note.date)}</span>
                  </div>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mb-2">
                    {note.type}
                  </span>
                  <p className="text-sm text-gray-700">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Patient Details - Right Column */}
        <div className="space-y-6">
          {/* Current Treatment Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <HeartIconSolid className="h-5 w-5 text-purple-600 mr-2" />
              Treatment Plan
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Treatment Type</p>
                <p className="text-sm text-gray-900">{patient.treatmentPlan.type}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Provider</p>
                <p className="text-sm text-gray-900">{patient.treatmentPlan.provider}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Start Date</p>
                  <p className="text-sm text-gray-900">{new Date(patient.treatmentPlan.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Next Review</p>
                  <p className="text-sm text-gray-900">{new Date(patient.treatmentPlan.reviewDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Progress</p>
                <p className="text-sm text-green-600 font-medium">{patient.treatmentPlan.progress}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Sessions Progress</p>
                <div className="flex items-center mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(patient.treatmentPlan.sessionsCompleted / patient.treatmentPlan.sessionsAuthorized) * 100}%` }}
                    />
                  </div>
                  <span className="ml-3 text-sm text-gray-600">
                    {patient.treatmentPlan.sessionsCompleted}/{patient.treatmentPlan.sessionsAuthorized}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Treatment Goals</p>
                <ul className="mt-1 space-y-1">
                  {patient.treatmentPlan.goals.map((goal, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link
              href={`/dashboard/treatment-plans/${patient.id}`}
              className="block mt-4 text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Update Treatment Plan
            </Link>
          </div>

          {/* Family & Emergency Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 text-amber-600 mr-2" />
              Emergency Contacts
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-900">Primary Emergency Contact</span>
                  <span className="text-xs text-red-600 font-medium">EMERGENCY</span>
                </div>
                <p className="font-medium text-gray-900">{patient.emergencyContact.name}</p>
                <p className="text-sm text-gray-600">{patient.emergencyContact.relationship}</p>
                <p className="text-sm text-gray-600">{patient.emergencyContact.phone}</p>
                <p className="text-sm text-gray-600">Language: {patient.emergencyContact.language}</p>
                {patient.emergencyContact.canAccessInformation && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Authorized for Information
                  </span>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Secondary Contact</span>
                <p className="font-medium text-gray-900 mt-1">{patient.secondaryContact.name}</p>
                <p className="text-sm text-gray-600">{patient.secondaryContact.relationship}</p>
                <p className="text-sm text-gray-600">{patient.secondaryContact.phone}</p>
                <p className="text-sm text-gray-600">Language: {patient.secondaryContact.language}</p>
              </div>
            </div>

            <Link
              href={`/dashboard/family-contacts/${patient.id}`}
              className="block mt-4 text-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              Manage Contacts
            </Link>
          </div>

          {/* Patient Location & Provider */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 text-teal-600 mr-2" />
              Location & Provider
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">APCTC Location</p>
                <p className="text-sm text-gray-900">{patient.location}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Primary Provider</p>
                <p className="text-sm text-gray-900">{patient.primaryProvider}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Insurance</p>
                <p className="text-sm text-gray-900">{patient.insuranceProvider}</p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-green-700">HIPAA Authorization on File</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Authorized: {new Date(patient.hipaaAuthorizationDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}