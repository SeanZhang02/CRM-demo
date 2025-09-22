'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BanknotesIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { DataTable, Column } from '@/components/ui/data-table'
import { ErrorMessage } from '@/components/ui/error-boundary'
import { dealStatusOptions, priorityOptions } from '@/lib/validations/deal'

/**
 * Deals data table component
 *
 * Features:
 * - Fetches deals with company and contact relationships
 * - Pipeline stage visualization
 * - Deal value and probability display
 * - Status and priority indicators
 * - Desktop-optimized layout
 */

interface Deal {
  id: string
  title: string
  value?: number
  currency: string
  status: string
  priority: string
  expectedCloseDate?: string
  probability?: number
  company?: {
    id: string
    name: string
  }
  contact?: {
    id: string
    firstName: string
    lastName: string
  }
  stage: {
    id: string
    name: string
    color?: string
  }
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  data: Deal[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function DealsTable() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Mock data for demonstration (would come from API)
  useEffect(() => {
    const mockDeals: Deal[] = [
      {
        id: '1',
        title: 'Enterprise Software License',
        value: 50000,
        currency: 'USD',
        status: 'OPEN',
        priority: 'HIGH',
        expectedCloseDate: '2024-02-15',
        probability: 75,
        company: { id: '1', name: 'Acme Corp' },
        contact: { id: '1', firstName: 'John', lastName: 'Doe' },
        stage: { id: '1', name: 'Proposal', color: '#3B82F6' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      },
      {
        id: '2',
        title: 'Consulting Services',
        value: 25000,
        currency: 'USD',
        status: 'OPEN',
        priority: 'MEDIUM',
        expectedCloseDate: '2024-01-30',
        probability: 60,
        company: { id: '2', name: 'Beta Inc' },
        contact: { id: '2', firstName: 'Jane', lastName: 'Smith' },
        stage: { id: '2', name: 'Negotiation', color: '#8B5CF6' },
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z',
      },
    ]

    setLoading(false)
    setDeals(mockDeals)
  }, [])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Handle search (placeholder)
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Would filter deals in real implementation
  }

  // Handle filter (placeholder)
  const handleFilter = (filters: Record<string, any>) => {
    // Would apply filters in real implementation
  }

  // Handle sort (placeholder)
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    // Would sort deals in real implementation
  }

  // Handle row click
  const handleRowClick = (deal: Deal) => {
    router.push(`/dashboard/deals/${deal.id}`)
  }

  // Handle delete deal (placeholder)
  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return
    }
    // Would delete deal in real implementation
    alert('Delete functionality would be implemented here')
  }

  // Define table columns
  const columns: Column<Deal>[] = [
    {
      key: 'title',
      title: 'Deal Title',
      dataIndex: 'title',
      sortable: true,
      filterable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <BanknotesIcon className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {record.probability && `${record.probability}% probability`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      title: 'Company',
      dataIndex: 'company',
      filterable: true,
      render: (value) => (
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
      key: 'contact',
      title: 'Contact',
      dataIndex: 'contact',
      render: (value) => (
        value ? (
          <Link
            href={`/dashboard/contacts/${value.id}`}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            <UserIcon className="h-4 w-4 mr-1" />
            {value.firstName} {value.lastName}
          </Link>
        ) : (
          <span className="text-sm text-gray-500">No contact</span>
        )
      ),
    },
    {
      key: 'value',
      title: 'Value',
      dataIndex: 'value',
      sortable: true,
      render: (value, record) => (
        value ? (
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(value, record.currency)}
          </div>
        ) : (
          <span className="text-sm text-gray-500">No value</span>
        )
      ),
    },
    {
      key: 'stage',
      title: 'Stage',
      dataIndex: 'stage',
      filterable: true,
      render: (value) => (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: value.color ? `${value.color}20` : '#F3F4F6',
            color: value.color || '#6B7280',
          }}
        >
          {value.name}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      filterable: true,
      filterType: 'select',
      filterOptions: dealStatusOptions.map((status) => ({
        value: status.value,
        label: status.label,
      })),
      render: (value) => {
        const colors = {
          OPEN: 'bg-blue-100 text-blue-800',
          WON: 'bg-green-100 text-green-800',
          LOST: 'bg-red-100 text-red-800',
          POSTPONED: 'bg-yellow-100 text-yellow-800',
          CANCELLED: 'bg-gray-100 text-gray-800',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                           ${colors[value as keyof typeof colors]}`}>
            {dealStatusOptions.find((option) => option.value === value)?.label || value}
          </span>
        )
      },
    },
    {
      key: 'expectedCloseDate',
      title: 'Expected Close',
      dataIndex: 'expectedCloseDate',
      sortable: true,
      render: (value) => (
        value ? (
          <div className="flex items-center text-sm text-gray-900">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
            {formatDate(value)}
          </div>
        ) : (
          <span className="text-sm text-gray-500">No date set</span>
        )
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      dataIndex: 'id',
      width: '120px',
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/deals/${value}`}
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          <Link
            href={`/dashboard/deals/${value}/edit`}
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
        title="Failed to load deals"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      data={deals}
      loading={loading}
      searchable={true}
      selectable={true}
      exportable={true}
      onSearch={handleSearch}
      onFilter={handleFilter}
      onSort={handleSort}
      onRowClick={handleRowClick}
      emptyText="No deals found. Add your first deal to start tracking opportunities."
      className="shadow-sm"
    />
  )
}