'use client'

import Link from 'next/link'
import {
  ClipboardDocumentListIcon,
  HeartIcon,
  BeakerIcon,
  HomeIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

/**
 * Service Category Navigation - Level 2 of Healthcare Provider Portal
 *
 * Button-based navigation that matches APCTC's clinical service organization.
 * Replaces complex Airtable-style filters with simple, large buttons that
 * medical professionals can understand without business/data knowledge.
 *
 * Progressive Disclosure Flow:
 * Level 1: Provider Command Center
 * Level 2: Service Category Buttons (THIS COMPONENT)
 * Level 3: Demographic/Status Filters
 * Level 4: Patient Results with Quick Actions
 *
 * Based on APCTC's actual service offerings:
 * - Assessment & Intake
 * - Mental Health Counseling
 * - Medication Management
 * - Case Management
 * - Community Education
 * - Crisis Intervention
 */

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  hoverColor: string
  textColor: string
  patientCount?: number
  href: string
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'assessment',
    name: 'Assessment & Intake',
    description: 'Initial evaluations and new patient onboarding',
    icon: ClipboardDocumentListIcon,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    textColor: 'text-blue-600',
    patientCount: 24,
    href: '/dashboard/patients/search?service=assessment'
  },
  {
    id: 'mental-health',
    name: 'Mental Health Counseling',
    description: 'Individual, group, and family therapy services',
    icon: HeartIcon,
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    textColor: 'text-purple-600',
    patientCount: 186,
    href: '/dashboard/patients/search?service=mental-health'
  },
  {
    id: 'medication',
    name: 'Medication Management',
    description: 'Psychiatric medication monitoring and adjustments',
    icon: BeakerIcon,
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    textColor: 'text-green-600',
    patientCount: 89,
    href: '/dashboard/patients/search?service=medication'
  },
  {
    id: 'case-management',
    name: 'Case Management',
    description: 'Housing, benefits, vocational rehabilitation, healthcare coordination',
    icon: HomeIcon,
    color: 'bg-amber-600',
    hoverColor: 'hover:bg-amber-700',
    textColor: 'text-amber-600',
    patientCount: 142,
    href: '/dashboard/patients/search?service=case-management'
  },
  {
    id: 'community-education',
    name: 'Community Education',
    description: 'Workshops, outreach programs, and prevention services',
    icon: UserGroupIcon,
    color: 'bg-teal-600',
    hoverColor: 'hover:bg-teal-700',
    textColor: 'text-teal-600',
    patientCount: 67,
    href: '/dashboard/patients/search?service=community-education'
  },
  {
    id: 'crisis-intervention',
    name: 'Crisis Intervention',
    description: 'Emergency mental health support and safety planning',
    icon: ExclamationTriangleIcon,
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-red-600',
    patientCount: 31,
    href: '/dashboard/patients/search?service=crisis-intervention'
  },
  {
    id: 'all-patients',
    name: 'All Patients',
    description: 'Browse all patients (with location filter)',
    icon: GlobeAltIcon,
    color: 'bg-gray-600',
    hoverColor: 'hover:bg-gray-700',
    textColor: 'text-gray-600',
    patientCount: 542,
    href: '/dashboard/patients/search?service=all'
  }
]

interface ServiceCategoryButtonsProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
}

export function ServiceCategoryButtons({
  title = "Find Patient by Service Type",
  subtitle = "Select the service category to find patients. This matches how APCTC organizes care delivery.",
  showBackButton = false
}: ServiceCategoryButtonsProps) {
  const handleBack = () => {
    window.history.back()
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{subtitle}</p>

        {showBackButton && (
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Provider Dashboard
          </button>
        )}
      </div>

      {/* Service Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {serviceCategories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className={`
              group relative p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm
              hover:border-gray-300 hover:shadow-lg transition-all duration-200
              transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            `}
          >
            {/* Service Icon and Title */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`
                w-16 h-16 rounded-full ${category.color} ${category.hoverColor}
                flex items-center justify-center transition-colors duration-200
                group-hover:scale-110 transform
              `}>
                <category.icon className="h-8 w-8 text-white" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* Patient Count Badge */}
              <div className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                bg-gray-100 ${category.textColor} group-hover:bg-gray-200 transition-colors duration-200
              `}>
                <UsersIcon className="h-4 w-4 mr-2" />
                {category.patientCount} patients
              </div>
            </div>

            {/* Hover Arrow Indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">→</span>
              </div>
            </div>

            {/* Accessibility Enhancement */}
            <div className="sr-only">
              Navigate to {category.name} patients. Currently {category.patientCount} patients in this service category.
            </div>
          </Link>
        ))}
      </div>

      {/* Help Text for Medical Professionals */}
      <div className="max-w-4xl mx-auto bg-blue-50 rounded-lg p-4 mt-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">How to Find Patients</h4>
            <p className="text-sm text-blue-700 mt-1">
              Click on any service category above to see patients receiving that type of care.
              You can then filter by demographics, location, or treatment status to find specific patients.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total Active Patients: <strong className="text-gray-900">542</strong></span>
          <span>•</span>
          <span>Scheduled Today: <strong className="text-gray-900">89</strong></span>
          <span>•</span>
          <span>New This Week: <strong className="text-gray-900">12</strong></span>
          <span>•</span>
          <span>Urgent Alerts: <strong className="text-red-600">8</strong></span>
        </div>
      </div>
    </div>
  )
}