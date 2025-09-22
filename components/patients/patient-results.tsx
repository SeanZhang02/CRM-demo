'use client'

import Link from 'next/link'
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

/**
 * Patient Results Component
 *
 * Displays filtered patients based on selected service category.
 * Shows mock data for healthcare provider workflow testing.
 */

interface PatientResultsProps {
  service: string
}

interface Patient {
  id: string
  name: string
  mrn: string
  age: number
  phone: string
  lastVisit: string
  nextAppointment?: string
  location: string
  priority: 'routine' | 'urgent' | 'crisis'
  status: 'active' | 'inactive' | 'pending'
}

// Mock patient data for different services
const mockPatients: Record<string, Patient[]> = {
  'mental-health': [
    {
      id: '1',
      name: 'Maria Chen',
      mrn: 'MRN-2024001',
      age: 34,
      phone: '(626) 555-0123',
      lastVisit: '2024-01-15',
      nextAppointment: '2024-01-22 2:00 PM',
      location: 'Alhambra Center',
      priority: 'routine',
      status: 'active'
    },
    {
      id: '2',
      name: 'David Kim',
      mrn: 'MRN-2024002',
      age: 28,
      phone: '(626) 555-0234',
      lastVisit: '2024-01-10',
      nextAppointment: '2024-01-25 11:00 AM',
      location: 'Monterey Park Center',
      priority: 'urgent',
      status: 'active'
    },
    {
      id: '3',
      name: 'Sarah Rodriguez',
      mrn: 'MRN-2024003',
      age: 42,
      phone: '(626) 555-0345',
      lastVisit: '2024-01-08',
      location: 'Rosemead Center',
      priority: 'routine',
      status: 'active'
    }
  ],
  'medication': [
    {
      id: '4',
      name: 'John Williams',
      mrn: 'MRN-2024004',
      age: 55,
      phone: '(626) 555-0456',
      lastVisit: '2024-01-12',
      nextAppointment: '2024-01-20 3:30 PM',
      location: 'El Monte Center',
      priority: 'routine',
      status: 'active'
    },
    {
      id: '5',
      name: 'Lisa Zhang',
      mrn: 'MRN-2024005',
      age: 31,
      phone: '(626) 555-0567',
      lastVisit: '2024-01-14',
      location: 'Baldwin Park Center',
      priority: 'urgent',
      status: 'active'
    }
  ],
  'assessment': [
    {
      id: '6',
      name: 'Michael Brown',
      mrn: 'MRN-2024006',
      age: 23,
      phone: '(626) 555-0678',
      lastVisit: '2024-01-16',
      nextAppointment: '2024-01-23 10:00 AM',
      location: 'West Covina Center',
      priority: 'routine',
      status: 'pending'
    }
  ],
  'case-management': [
    {
      id: '7',
      name: 'Jennifer Lee',
      mrn: 'MRN-2024007',
      age: 38,
      phone: '(626) 555-0789',
      lastVisit: '2024-01-11',
      location: 'Azusa Center',
      priority: 'routine',
      status: 'active'
    }
  ],
  'crisis-intervention': [
    {
      id: '8',
      name: 'Robert Garcia',
      mrn: 'MRN-2024008',
      age: 29,
      phone: '(626) 555-0890',
      lastVisit: '2024-01-17',
      nextAppointment: 'Today 4:00 PM',
      location: 'Pomona Center',
      priority: 'crisis',
      status: 'active'
    }
  ],
  'community-education': [
    {
      id: '9',
      name: 'Amanda Davis',
      mrn: 'MRN-2024009',
      age: 45,
      phone: '(626) 555-0901',
      lastVisit: '2024-01-13',
      location: 'Alhambra Center',
      priority: 'routine',
      status: 'active'
    }
  ],
  'all': [
    // Include all patients for "all" service
  ]
}

// Flatten all patients for 'all' service
mockPatients.all = Object.values(mockPatients).flat().filter(p => p.id !== undefined)

const serviceNames: Record<string, string> = {
  'mental-health': 'Mental Health Counseling',
  'medication': 'Medication Management',
  'assessment': 'Assessment & Intake',
  'case-management': 'Case Management',
  'crisis-intervention': 'Crisis Intervention',
  'community-education': 'Community Education',
  'all': 'All Patients'
}

const serviceIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'mental-health': HeartIcon,
  'medication': BeakerIcon,
  'assessment': ClipboardDocumentListIcon,
  'case-management': HomeIcon,
  'crisis-intervention': ExclamationTriangleIcon,
  'community-education': UserGroupIcon,
  'all': MagnifyingGlassIcon
}

export function PatientResults({ service }: PatientResultsProps) {
  const patients = mockPatients[service] || []
  const serviceName = serviceNames[service] || 'Unknown Service'
  const ServiceIcon = serviceIcons[service] || MagnifyingGlassIcon

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'crisis': return 'bg-red-100 text-red-800'
      case 'urgent': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/patients/search"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900
                     transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Service Categories
          </Link>
        </div>
        <div className="text-sm text-gray-500">
          {patients.length} patients found
        </div>
      </div>

      {/* Service Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <ServiceIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{serviceName}</h1>
            <p className="text-gray-600">Patient list for this service category</p>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
        </div>

        {patients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600">
              No patients are currently assigned to this service category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <div key={patient.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                            {patient.priority}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{patient.mrn}</span>
                          <span>•</span>
                          <span>Age {patient.age}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {patient.phone}
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {patient.location}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Last visit: {patient.lastVisit}
                          </span>
                          {patient.nextAppointment && (
                            <>
                              <span>•</span>
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Next: {patient.nextAppointment}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium
                               text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/dashboard/schedule/new?patient=${patient.id}`}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 rounded-lg text-sm font-medium
                               text-white hover:bg-blue-700 transition-colors duration-200"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Schedule
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Total Patients</div>
          <div className="text-2xl font-bold text-gray-900">{patients.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {patients.filter(p => p.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Urgent Priority</div>
          <div className="text-2xl font-bold text-yellow-600">
            {patients.filter(p => p.priority === 'urgent').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Crisis Priority</div>
          <div className="text-2xl font-bold text-red-600">
            {patients.filter(p => p.priority === 'crisis').length}
          </div>
        </div>
      </div>
    </div>
  )
}