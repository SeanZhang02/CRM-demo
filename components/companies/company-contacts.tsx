'use client'

import Link from 'next/link'
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline'

/**
 * Company contacts component showing related contacts
 *
 * Features:
 * - List of contacts for the company
 * - Quick add contact functionality
 * - Primary contact designation
 * - Contact details preview
 */

interface CompanyContactsProps {
  companyId: string
}

export function CompanyContacts({ companyId }: CompanyContactsProps) {
  // This would fetch contacts from API in real implementation
  const contacts = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      jobTitle: 'CEO',
      isPrimary: true,
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      jobTitle: 'CTO',
      isPrimary: false,
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
            Contacts ({contacts.length})
          </h2>
          <Link
            href={`/dashboard/contacts/new?companyId=${companyId}`}
            className="inline-flex items-center px-3 py-2 border border-transparent
                     text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Contact
          </Link>
        </div>

        {contacts.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-600 mb-6">
              Add contacts to start building relationships with this company.
            </p>
            <Link
              href={`/dashboard/contacts/new?companyId=${companyId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent
                       text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Contact
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg
                         hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      {contact.isPrimary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                       font-medium bg-blue-100 text-blue-800">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {contact.jobTitle} • {contact.email}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/dashboard/contacts/${contact.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}