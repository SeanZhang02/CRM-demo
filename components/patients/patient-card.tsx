'use client'

import Link from 'next/link'
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid'

/**
 * Patient Card Component
 *
 * Healthcare-focused patient display card with medical context.
 * Replaces business company cards with patient-centric information.
 *
 * Features:
 * - Patient demographics with medical relevance
 * - Service type and treatment status
 * - Last session and next appointment
 * - Provider assignment and location
 * - Quick action buttons for common tasks
 * - Language and cultural indicators
 * - Emergency contact visibility
 *
 * Designed for quick patient identification and action.
 */

interface PatientCardProps {
  patient: {
    id: string
    name: string
    dateOfBirth: string
    age: number
    gender: string
    preferredLanguage: string
    primaryService: string
    treatmentStatus: 'active' | 'new' | 'completed' | 'waiting' | 'urgent'
    lastSession?: {
      date: string
      type: string
      provider: string
    }
    nextAppointment?: {
      date: string
      time: string
      type: string
      provider: string
    }
    primaryProvider: string
    location: string
    emergencyContact?: {
      name: string
      relationship: string
      phone: string
    }
    medicalRecordNumber: string
    insuranceProvider?: string
  }
  onClick?: () => void
  showQuickActions?: boolean
}

const statusConfig = {
  active: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
    label: 'Active Treatment'
  },
  new: {
    color: 'bg-blue-100 text-blue-800',
    icon: UserIcon,
    label: 'New Patient'
  },
  completed: {
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircleIcon,
    label: 'Treatment Completed'
  },
  waiting: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIconSolid,
    label: 'Waiting List'
  },
  urgent: {
    color: 'bg-red-100 text-red-800',
    icon: ExclamationTriangleIcon,
    label: 'Urgent Attention'
  }
}

const serviceTypeColors = {
  'Mental Health': 'text-purple-600 bg-purple-50 border-purple-200',
  'Medication Management': 'text-green-600 bg-green-50 border-green-200',
  'Case Management': 'text-amber-600 bg-amber-50 border-amber-200',
  'Assessment & Intake': 'text-blue-600 bg-blue-50 border-blue-200',
  'Crisis Intervention': 'text-red-600 bg-red-50 border-red-200',
  'Community Education': 'text-teal-600 bg-teal-50 border-teal-200'
}

export function PatientCard({
  patient,
  onClick,
  showQuickActions = true
}: PatientCardProps) {
  const status = statusConfig[patient.treatmentStatus]
  const StatusIcon = status.icon
  const serviceColor = serviceTypeColors[patient.primaryService as keyof typeof serviceTypeColors] || 'text-gray-600 bg-gray-50 border-gray-200'

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md
                 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      {/* Patient Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900">
              {patient.name}
            </h3>

            {/* Treatment Status Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Age {calculateAge(patient.dateOfBirth)} • {patient.gender}</span>
            <span>•</span>
            <span>{patient.preferredLanguage}</span>
            <span>•</span>
            <span>MRN: {patient.medicalRecordNumber}</span>
          </div>
        </div>

        {/* Quick View Button */}
        <Link
          href={`/dashboard/patients/${patient.id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">View patient details</span>
          →
        </Link>
      </div>

      {/* Service Type and Location */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-lg border text-sm font-medium ${serviceColor}`}>
          <HeartIconSolid className="h-4 w-4 mr-2" />
          {patient.primaryService}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="h-4 w-4 mr-1" />
          {patient.location}
        </div>
      </div>

      {/* Provider and Session Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Last Session */}
        {patient.lastSession && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Last Session</h4>
            <p className="text-sm text-gray-900">{formatDate(patient.lastSession.date)}</p>
            <p className="text-xs text-gray-600">{patient.lastSession.type} • {patient.lastSession.provider}</p>
          </div>
        )}

        {/* Next Appointment */}
        {patient.nextAppointment ? (
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-700 mb-1">Next Appointment</h4>
            <p className="text-sm text-blue-900">
              {formatDate(patient.nextAppointment.date)} at {formatTime(patient.nextAppointment.time)}
            </p>
            <p className="text-xs text-blue-600">{patient.nextAppointment.type} • {patient.nextAppointment.provider}</p>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-700 mb-1">No Scheduled Appointment</h4>
            <p className="text-xs text-yellow-600">Consider scheduling follow-up</p>
          </div>
        )}
      </div>

      {/* Primary Provider */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <UserIcon className="h-4 w-4 mr-2" />
          <span>Provider: <strong className="text-gray-900">{patient.primaryProvider}</strong></span>
        </div>

        {patient.emergencyContact && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            <span className="truncate">Emergency: {patient.emergencyContact.name}</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
          <Link
            href={`/dashboard/schedule/new?patient=${patient.id}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300
                     rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Schedule
          </Link>

          <Link
            href={`/dashboard/sessions/new?patient=${patient.id}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300
                     rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Notes
          </Link>

          <Link
            href={`tel:${patient.emergencyContact?.phone || ''}`}
            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300
                     rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneIcon className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}