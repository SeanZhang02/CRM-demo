'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  UserIcon,
  UsersIcon,
  LanguageIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

/**
 * Demographic and Status Filters - Level 3 Healthcare Navigation
 *
 * Button-based demographic filtering that matches medical professional
 * mental models. Continues progressive disclosure after service selection.
 *
 * Progressive Disclosure Flow:
 * Level 1: Provider Command Center →
 * Level 2: Service Category Buttons →
 * Level 3: Demographic/Status Filters (THIS COMPONENT) →
 * Level 4: Patient Results
 *
 * Designed for healthcare providers to find patients by common
 * demographic and clinical characteristics.
 */

interface DemographicFiltersProps {
  serviceCategory: string
  serviceName: string
  totalPatients: number
  onFilterChange?: (filters: any) => void
}

interface FilterButton {
  id: string
  label: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  count: number
  href: string
}

export function DemographicFilters({
  serviceCategory,
  serviceName,
  totalPatients,
  onFilterChange
}: DemographicFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // Age Group Filters
  const ageGroupFilters: FilterButton[] = [
    {
      id: 'children',
      label: 'Children (Under 12)',
      description: 'Pediatric patients requiring specialized care',
      icon: UserIcon,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      count: 45,
      href: `/dashboard/patients/results?service=${serviceCategory}&age=children`
    },
    {
      id: 'youth',
      label: 'Youth (12-17)',
      description: 'Adolescent patients with age-appropriate services',
      icon: UserIcon,
      color: 'bg-green-600 hover:bg-green-700 text-white',
      count: 67,
      href: `/dashboard/patients/results?service=${serviceCategory}&age=youth`
    },
    {
      id: 'adults',
      label: 'Adults (18-64)',
      description: 'Adult patients in primary treatment population',
      icon: UserIcon,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
      count: 234,
      href: `/dashboard/patients/results?service=${serviceCategory}&age=adults`
    },
    {
      id: 'seniors',
      label: 'Older Adults (65+)',
      description: 'Senior patients with specialized considerations',
      icon: UserIcon,
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      count: 89,
      href: `/dashboard/patients/results?service=${serviceCategory}&age=seniors`
    }
  ]

  // Gender and Language Filters
  const demographicFilters: FilterButton[] = [
    {
      id: 'male',
      label: 'Male Patients',
      description: 'Male-identifying patients',
      icon: UserIcon,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      count: 198,
      href: `/dashboard/patients/results?service=${serviceCategory}&gender=male`
    },
    {
      id: 'female',
      label: 'Female Patients',
      description: 'Female-identifying patients',
      icon: UserIcon,
      color: 'bg-pink-600 hover:bg-pink-700 text-white',
      count: 237,
      href: `/dashboard/patients/results?service=${serviceCategory}&gender=female`
    },
    {
      id: 'language',
      label: 'By Language',
      description: 'Filter by preferred language',
      icon: LanguageIcon,
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      count: 0,
      href: `/dashboard/patients/results?service=${serviceCategory}&filter=language`
    },
    {
      id: 'location',
      label: 'By Location',
      description: 'Filter by APCTC center',
      icon: MapPinIcon,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
      count: 0,
      href: `/dashboard/patients/results?service=${serviceCategory}&filter=location`
    }
  ]

  // Treatment Status Filters
  const statusFilters: FilterButton[] = [
    {
      id: 'new',
      label: 'New Patients',
      description: 'Recently enrolled patients',
      icon: UserIcon,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      count: 34,
      href: `/dashboard/patients/results?service=${serviceCategory}&status=new`
    },
    {
      id: 'active',
      label: 'Active Treatment',
      description: 'Patients currently receiving services',
      icon: CheckCircleIcon,
      color: 'bg-green-600 hover:bg-green-700 text-white',
      count: 312,
      href: `/dashboard/patients/results?service=${serviceCategory}&status=active`
    },
    {
      id: 'waiting',
      label: 'Waiting List',
      description: 'Patients waiting for service availability',
      icon: ClockIcon,
      color: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      count: 23,
      href: `/dashboard/patients/results?service=${serviceCategory}&status=waiting`
    },
    {
      id: 'completed',
      label: 'Completed Treatment',
      description: 'Patients who have completed their treatment plan',
      icon: CheckCircleIcon,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
      count: 156,
      href: `/dashboard/patients/results?service=${serviceCategory}&status=completed`
    }
  ]

  return (
    <div className="space-y-8">
      {/* Breadcrumb and Header */}
      <div className="text-center">
        <nav className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-gray-700">
            Provider Dashboard
          </Link>
          <span>→</span>
          <Link href="/dashboard/patients/search" className="hover:text-gray-700">
            Find Patient
          </Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">{serviceName}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {serviceName} Patients
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Filter patients by demographics, status, or location to find specific individuals.
          Total patients in this service: <strong>{totalPatients}</strong>
        </p>
      </div>

      {/* Age Group Filters */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UsersIcon className="h-5 w-5 mr-2 text-gray-600" />
          Age Groups
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ageGroupFilters.map((filter) => (
            <Link
              key={filter.id}
              href={filter.href}
              className={`
                group relative p-4 rounded-xl transition-all duration-200 transform hover:scale-105
                ${filter.color} shadow-sm hover:shadow-md
              `}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <filter.icon className="h-8 w-8" />
                <div>
                  <h3 className="font-semibold">{filter.label}</h3>
                  <p className="text-sm opacity-90 mt-1">{filter.description}</p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                      {filter.count} patients
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Demographic Filters */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-600" />
          Demographics & Location
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demographicFilters.map((filter) => (
            <Link
              key={filter.id}
              href={filter.href}
              className={`
                group relative p-4 rounded-xl transition-all duration-200 transform hover:scale-105
                ${filter.color} shadow-sm hover:shadow-md
              `}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <filter.icon className="h-8 w-8" />
                <div>
                  <h3 className="font-semibold">{filter.label}</h3>
                  <p className="text-sm opacity-90 mt-1">{filter.description}</p>
                  {filter.count > 0 && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                        {filter.count} patients
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Treatment Status Filters */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ListBulletIcon className="h-5 w-5 mr-2 text-gray-600" />
          Treatment Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusFilters.map((filter) => (
            <Link
              key={filter.id}
              href={filter.href}
              className={`
                group relative p-4 rounded-xl transition-all duration-200 transform hover:scale-105
                ${filter.color} shadow-sm hover:shadow-md
              `}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <filter.icon className="h-8 w-8" />
                <div>
                  <h3 className="font-semibold">{filter.label}</h3>
                  <p className="text-sm opacity-90 mt-1">{filter.description}</p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                      {filter.count} patients
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Patients Option */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">View All Patients</h3>
        <p className="text-gray-600 mb-4">
          See all {totalPatients} patients in {serviceName} without demographic filtering
        </p>
        <Link
          href={`/dashboard/patients/results?service=${serviceCategory}&filter=all`}
          className="inline-flex items-center px-6 py-3 border border-transparent
                   text-base font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                   transition-colors duration-200"
        >
          <ListBulletIcon className="h-5 w-5 mr-2" />
          View All {totalPatients} Patients
        </Link>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Navigation Help</h4>
            <p className="text-sm text-blue-700 mt-1">
              Click any filter above to narrow down patients by specific criteria.
              Each filter shows the number of patients that match that category.
              You can always return to view all patients or change service categories.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}