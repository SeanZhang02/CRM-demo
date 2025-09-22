'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { DataTable, Column } from '@/components/ui/data-table'
import { ErrorMessage } from '@/components/ui/error-boundary'
import { contactStatusOptions } from '@/lib/validations/contact'

/**
 * Contacts data table component
 *
 * Features:
 * - Fetches contacts with company relationships
 * - Company name display and linking
 * - Primary contact indicators
 * - Contact method preferences
 * - Desktop-optimized layout
 */

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  jobTitle?: string
  isPrimary: boolean
  status: string
  preferredContact: string
  company?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data: Contact[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function ContactsTable() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch contacts from API
  const fetchContacts = async (params: Record<string, any> = {}) => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        page: String(params.page || currentPage),
        limit: '20',
        ...params,
      })

      const response = await fetch(`/api/contacts?${queryParams}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()
      setContacts(result.data)
      setTotalPages(result.meta.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
      console.error('Error fetching contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchContacts()
  }, [currentPage])

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    fetchContacts({ search: query, page: 1 })
  }

  // Handle filter
  const handleFilter = (filters: Record<string, any>) => {
    setCurrentPage(1)
    fetchContacts({ ...filters, page: 1 })
  }

  // Handle sort
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    fetchContacts({
      search: searchQuery,
      sortBy: key,
      sortOrder: direction,
      page: currentPage,
    })
  }

  // Handle row click
  const handleRowClick = (contact: Contact) => {
    router.push(`/dashboard/contacts/${contact.id}`)
  }

  // Handle delete contact
  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      // Refresh the table
      fetchContacts()
    } catch (err) {
      console.error('Error deleting contact:', err)
      alert('Failed to delete contact. Please try again.')
    }
  }

  // Define table columns
  const columns: Column<Contact>[] = [
    {
      key: 'name',
      title: 'Contact Name',
      dataIndex: 'firstName',
      sortable: true,
      filterable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {record.firstName[0]}{record.lastName[0]}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-900">
                {record.firstName} {record.lastName}
              </div>
              {record.isPrimary && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                               font-medium bg-blue-100 text-blue-800">
                  Primary
                </span>
              )}
            </div>
            {record.jobTitle && (
              <div className="text-sm text-gray-500">{record.jobTitle}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      title: 'Company',
      dataIndex: 'company',
      filterable: true,
      render: (value, record) => (
        value ? (
          <Link
            href={`/dashboard/companies/${value.id}`}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
            {value.name}
          </Link>
        ) : (
          <span className="text-sm text-gray-500">No company</span>
        )
      ),
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      filterable: true,
      render: (value) => (
        value ? (
          <a
            href={`mailto:${value}`}
            className="flex items-center text-sm text-gray-900 hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
            {value}
          </a>
        ) : (
          <span className="text-sm text-gray-500">No email</span>
        )
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      dataIndex: 'phone',
      render: (value) => (
        value ? (
          <a
            href={`tel:${value}`}
            className="flex items-center text-sm text-gray-900 hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
            {value}
          </a>
        ) : (
          <span className="text-sm text-gray-500">No phone</span>
        )
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      filterable: true,
      filterType: 'select',
      filterOptions: contactStatusOptions.map((status) => ({
        value: status.value,
        label: status.label,
      })),
      render: (value) => {
        const colors = {
          ACTIVE: 'bg-green-100 text-green-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
          BOUNCED: 'bg-red-100 text-red-800',
          UNSUBSCRIBED: 'bg-yellow-100 text-yellow-800',
          DO_NOT_CONTACT: 'bg-red-100 text-red-800',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                           ${colors[value as keyof typeof colors]}`}>
            {contactStatusOptions.find((option) => option.value === value)?.label || value}
          </span>
        )
      },
    },
    {
      key: 'preferredContact',
      title: 'Preferred Contact',
      dataIndex: 'preferredContact',
      render: (value) => {
        const methodIcons = {
          EMAIL: EnvelopeIcon,
          PHONE: PhoneIcon,
          MOBILE: PhoneIcon,
          LINKEDIN: UserIcon,
          IN_PERSON: UserIcon,
        }
        const Icon = methodIcons[value as keyof typeof methodIcons] || UserIcon
        return (
          <div className="flex items-center text-sm text-gray-600">
            <Icon className="h-4 w-4 mr-1" />
            {value.replace('_', ' ')}
          </div>
        )
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      dataIndex: 'id',
      width: '120px',
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/contacts/${value}`}
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          <Link
            href={`/dashboard/contacts/${value}/edit`}
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(value)
            }}
            className="text-gray-400 hover:text-red-600 transition-colors duration-200"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load contacts"
        message={error}
        onRetry={() => fetchContacts()}
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      data={contacts}
      loading={loading}
      searchable={true}
      selectable={true}
      exportable={true}
      onSearch={handleSearch}
      onFilter={handleFilter}
      onSort={handleSort}
      onRowClick={handleRowClick}
      emptyText="No contacts found. Add your first contact to get started."
      className="shadow-sm"
    />
  )
}