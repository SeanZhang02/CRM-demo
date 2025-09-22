'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HeartIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

/**
 * Healthcare Provider Sidebar Navigation
 *
 * Transformed from business CRM to healthcare provider workflow:
 * - Provider dashboard and patient search
 * - Healthcare service categories
 * - Patient management workflow
 * - Provider tools and scheduling
 * - HIPAA-compliant settings
 */

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  current?: boolean
  count?: number
  badge?: string
  color?: string
}

export function Sidebar() {
  const pathname = usePathname()

  const navigation: NavigationItem[] = [
    {
      name: 'Provider Dashboard',
      href: '/dashboard',
      icon: ChartBarIcon,
      current: pathname === '/dashboard',
    },
    {
      name: 'Find Patient',
      href: '/dashboard/patients/search',
      icon: MagnifyingGlassIcon,
      current: pathname.startsWith('/dashboard/patients/search'),
      color: 'text-blue-600'
    },
    {
      name: 'All Patients',
      href: '/dashboard/patients',
      icon: HeartIcon,
      current: pathname.startsWith('/dashboard/patients') && !pathname.includes('/search'),
      count: 542, // Total active patients
    },
    {
      name: 'My Schedule',
      href: '/dashboard/schedule',
      icon: CalendarIcon,
      current: pathname.startsWith('/dashboard/schedule'),
      count: 8, // Today's appointments
      badge: 'today'
    },
    {
      name: 'Treatment Plans',
      href: '/dashboard/treatment-plans',
      icon: ClipboardDocumentListIcon,
      current: pathname.startsWith('/dashboard/treatment-plans'),
      count: 23, // Active treatment plans
    },
    {
      name: 'Family Contacts',
      href: '/dashboard/family-contacts',
      icon: UsersIcon,
      current: pathname.startsWith('/dashboard/family-contacts'),
      count: 128, // Emergency contacts
    },
    {
      name: 'Session Notes',
      href: '/dashboard/sessions',
      icon: DocumentTextIcon,
      current: pathname.startsWith('/dashboard/sessions'),
    },
  ]

  const serviceNavigation: NavigationItem[] = [
    {
      name: 'Assessment & Intake',
      href: '/dashboard/patients/search?service=assessment',
      icon: ClipboardDocumentListIcon,
      current: pathname.includes('service=assessment'),
      count: 24,
    },
    {
      name: 'Mental Health',
      href: '/dashboard/patients/search?service=mental-health',
      icon: HeartIcon,
      current: pathname.includes('service=mental-health'),
      count: 186,
    },
    {
      name: 'Medication Mgmt',
      href: '/dashboard/patients/search?service=medication',
      icon: BeakerIcon,
      current: pathname.includes('service=medication'),
      count: 89,
    },
    {
      name: 'Case Management',
      href: '/dashboard/patients/search?service=case-management',
      icon: HomeIcon,
      current: pathname.includes('service=case-management'),
      count: 142,
    },
    {
      name: 'Crisis Support',
      href: '/dashboard/patients/search?service=crisis-intervention',
      icon: ExclamationTriangleIcon,
      current: pathname.includes('service=crisis-intervention'),
      count: 31,
      badge: 'urgent',
      color: 'text-red-600'
    },
  ]

  const secondaryNavigation: NavigationItem[] = [
    {
      name: 'Provider Settings',
      href: '/dashboard/settings',
      icon: Cog6ToothIcon,
      current: pathname.startsWith('/dashboard/settings'),
    },
  ]

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pt-4">
        {/* APCTC Logo/Header */}
        <div className="flex items-center">
          <HeartIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">APCTC Portal</h2>
            <p className="text-xs text-gray-500">Healthcare Provider</p>
          </div>
        </div>

        {/* Primary Healthcare Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-lg p-3 text-sm font-semibold
                        transition-all duration-200 hover:bg-gray-50
                        ${
                          item.current
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : item.color || 'text-gray-700 hover:text-blue-700'
                        }
                      `}
                    >
                      <item.icon
                        className={`
                          h-6 w-6 shrink-0 transition-colors duration-200
                          ${
                            item.current
                              ? 'text-blue-700'
                              : item.color || 'text-gray-400 group-hover:text-blue-600'
                          }
                        `}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.count && (
                        <span
                          className={`
                            ml-auto inline-block py-0.5 px-2 text-xs rounded-full
                            ${
                              item.current
                                ? 'bg-blue-100 text-blue-700'
                                : item.badge === 'urgent'
                                ? 'bg-red-100 text-red-700'
                                : item.badge === 'today'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                            }
                          `}
                        >
                          {item.count}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* Service Categories Section */}
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wide">
                Service Categories
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {serviceNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-lg p-2 text-sm font-medium
                        transition-all duration-200 hover:bg-gray-50
                        ${
                          item.current
                            ? 'bg-blue-50 text-blue-700'
                            : item.color || 'text-gray-700 hover:text-blue-700'
                        }
                      `}
                    >
                      <item.icon
                        className={`
                          h-5 w-5 transition-colors duration-200
                          ${
                            item.current
                              ? 'text-blue-700'
                              : item.color || 'text-gray-400 group-hover:text-blue-600'
                          }
                        `}
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.count && (
                        <span
                          className={`
                            ml-auto inline-block py-0.5 px-2 text-xs rounded-full
                            ${
                              item.badge === 'urgent'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                            }
                          `}
                        >
                          {item.count}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* Quick Healthcare Actions */}
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wide">
                Quick Actions
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                <li>
                  <Link
                    href="/dashboard/patients/new"
                    className="group flex gap-x-3 rounded-lg p-2 text-sm font-medium
                             text-gray-700 hover:text-green-700 hover:bg-green-50
                             transition-all duration-200"
                  >
                    <UserPlusIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
                    Add Patient
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/schedule/new"
                    className="group flex gap-x-3 rounded-lg p-2 text-sm font-medium
                             text-gray-700 hover:text-blue-700 hover:bg-blue-50
                             transition-all duration-200"
                  >
                    <CalendarIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                    Schedule Appointment
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/sessions/new"
                    className="group flex gap-x-3 rounded-lg p-2 text-sm font-medium
                             text-gray-700 hover:text-purple-700 hover:bg-purple-50
                             transition-all duration-200"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                    Add Session Note
                  </Link>
                </li>
              </ul>
            </li>

            {/* Provider Settings */}
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                {secondaryNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-lg p-3 text-sm font-semibold
                        transition-all duration-200 hover:bg-gray-50
                        ${
                          item.current
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:text-blue-700'
                        }
                      `}
                    >
                      <item.icon
                        className={`
                          h-6 w-6 shrink-0 transition-colors duration-200
                          ${
                            item.current
                              ? 'text-blue-700'
                              : 'text-gray-400 group-hover:text-blue-600'
                          }
                        `}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}