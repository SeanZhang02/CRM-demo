'use client'

import { useState, useMemo } from 'react'
import { PatientCard } from './patient-card'
import { DemographicFilters } from '@/components/navigation/demographic-filters'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ViewColumnsIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

/**
 * Patients Table Component
 *
 * Healthcare-focused patient management interface replacing business companies table.
 * Designed for medical professionals to find and manage patients efficiently.
 *
 * Features:
 * - Service-based patient organization
 * - Healthcare-relevant search and filtering
 * - Patient cards with medical context
 * - Quick actions for scheduling and notes
 * - HIPAA-compliant patient information display
 * - Multi-site patient coordination
 *
 * Replaces business metrics with clinical workflow needs.
 */

interface Patient {
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

interface PatientsTableProps {
  serviceFilter?: string
  demographicFilter?: string
  statusFilter?: string
  locationFilter?: string
  showFilters?: boolean
}

// Mock patient data for healthcare demo
const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Maria Chen',
    dateOfBirth: '1985-01-15',
    age: 38,
    gender: 'Female',
    preferredLanguage: 'Mandarin',
    primaryService: 'Mental Health',
    treatmentStatus: 'active',
    lastSession: {
      date: '2025-01-15',
      type: 'Individual Therapy',
      provider: 'Dr. Sarah Lee'
    },
    nextAppointment: {
      date: '2025-01-22',
      time: '10:00',
      type: 'Mental Health Session',
      provider: 'Dr. Sarah Lee'
    },
    primaryProvider: 'Dr. Sarah Lee',
    location: 'Alhambra Center',
    emergencyContact: {
      name: 'John Chen',
      relationship: 'Spouse',
      phone: '(626) 555-0123'
    },
    medicalRecordNumber: 'MRN-2024001',
    insuranceProvider: 'LA Care Health Plan'
  },
  {
    id: '2',
    name: 'David Kim',
    dateOfBirth: '1978-08-22',
    age: 45,
    gender: 'Male',
    preferredLanguage: 'Korean',
    primaryService: 'Medication Management',
    treatmentStatus: 'active',
    lastSession: {
      date: '2025-01-14',
      type: 'Medication Review',
      provider: 'Dr. Michael Chang'
    },
    nextAppointment: {
      date: '2025-01-21',
      time: '14:30',
      type: 'Medication Consultation',
      provider: 'Dr. Michael Chang'
    },
    primaryProvider: 'Dr. Michael Chang',
    location: 'Main Center',
    emergencyContact: {
      name: 'Susan Kim',
      relationship: 'Sister',
      phone: '(323) 555-0456'
    },
    medicalRecordNumber: 'MRN-2024002',
    insuranceProvider: 'Blue Cross Blue Shield'
  },
  {
    id: '3',
    name: 'Lisa Wang',
    dateOfBirth: '1995-03-10',
    age: 29,
    gender: 'Female',
    preferredLanguage: 'Chinese',
    primaryService: 'Case Management',
    treatmentStatus: 'urgent',
    lastSession: {
      date: '2025-01-13',
      type: 'Case Management',
      provider: 'Maria Rodriguez, MSW'
    },
    primaryProvider: 'Maria Rodriguez, MSW',
    location: 'Wilshire Center',
    emergencyContact: {
      name: 'Peter Wang',
      relationship: 'Father',
      phone: '(213) 555-0789'
    },
    medicalRecordNumber: 'MRN-2024003',
    insuranceProvider: 'Medi-Cal'
  },
  {
    id: '4',
    name: 'James Nakamura',
    dateOfBirth: '1990-11-05',
    age: 34,
    gender: 'Male',
    preferredLanguage: 'Japanese',
    primaryService: 'Assessment & Intake',
    treatmentStatus: 'new',
    primaryProvider: 'Dr. Emily Honda',
    location: 'Torrance Center',
    emergencyContact: {
      name: 'Alice Nakamura',
      relationship: 'Mother',
      phone: '(310) 555-0234'
    },
    medicalRecordNumber: 'MRN-2025001',
    insuranceProvider: 'Anthem Blue Cross'
  }
]

export function PatientsTable({
  serviceFilter,
  demographicFilter,
  statusFilter,
  locationFilter,
  showFilters = true
}: PatientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'location'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let filtered = mockPatients

    // Apply service filter
    if (serviceFilter && serviceFilter !== 'all') {
      filtered = filtered.filter(patient =>
        patient.primaryService.toLowerCase().includes(serviceFilter.toLowerCase()) ||
        serviceFilter === 'mental-health' && patient.primaryService === 'Mental Health' ||
        serviceFilter === 'medication' && patient.primaryService === 'Medication Management' ||
        serviceFilter === 'case-management' && patient.primaryService === 'Case Management' ||
        serviceFilter === 'assessment' && patient.primaryService === 'Assessment & Intake'
      )
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.primaryProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(patient => patient.treatmentStatus === statusFilter)
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(patient =>
        patient.location.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    // Sort patients
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'date':
          aValue = a.lastSession?.date || '2000-01-01'
          bValue = b.lastSession?.date || '2000-01-01'
          break
        case 'status':
          aValue = a.treatmentStatus
          bValue = b.treatmentStatus
          break
        case 'location':
          aValue = a.location
          bValue = b.location
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [searchTerm, sortBy, sortOrder, serviceFilter, statusFilter, locationFilter])

  const handleSort = (field: 'name' | 'date' | 'status' | 'location') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search Bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name, MRN, provider, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Sort Controls */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as any)
                setSortOrder(order as any)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="date-desc">Last Session (Recent)</option>
              <option value="date-asc">Last Session (Oldest)</option>
              <option value="status-asc">Status</option>
              <option value="location-asc">Location</option>
            </select>

            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ViewColumnsIcon className="h-5 w-5" />
            </button>

            {/* Export Button */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Applied Filters Display */}
        {(serviceFilter || statusFilter || locationFilter) && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {serviceFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Service: {serviceFilter}
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {statusFilter}
              </span>
            )}
            {locationFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Location: {locationFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing <strong>{filteredPatients.length}</strong> of <strong>{mockPatients.length}</strong> patients
        </p>

        {serviceFilter && (
          <div className="text-sm text-gray-500">
            Service Category: <strong className="text-gray-900">{serviceFilter}</strong>
          </div>
        )}
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => {
                // Navigate to patient detail page
                window.location.href = `/dashboard/patients/${patient.id}`
              }}
              showQuickActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {/* Load More Button (for pagination) */}
      {filteredPatients.length > 0 && filteredPatients.length < mockPatients.length && (
        <div className="text-center py-4">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Load More Patients
          </button>
        </div>
      )}
    </div>
  )
}