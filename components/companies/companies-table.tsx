'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BuildingOfficeIcon,
  UsersIcon,
  BanknotesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { DataTable, Column } from '@/components/ui/data-table'
import { ErrorMessage } from '@/components/ui/error-boundary'
import { companySizeOptions, companyStatusOptions, industryOptions } from '@/lib/validations/company'
import {
  FilterConfig,
  FilterPreview as FilterPreviewType,
  COMPANY_FIELDS,
} from '@/lib/types/filters'

/**
 * Companies data table component
 *
 * Features:
 * - Fetches companies from API with pagination
 * - Real-time search and filtering
 * - Desktop-optimized column layout
 * - Action buttons for view/edit/delete
 * - Integrated with existing API endpoints
 */

interface Company {
  id: string
  name: string
  industry?: string
  website?: string
  companySize?: string
  status: string
  _count: {
    contacts: number
    deals: number
    activities: number
  }
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data: Company[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function CompaniesTable() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentFilters, setCurrentFilters] = useState<FilterConfig | null>(null)
  const [savedFilters, setSavedFilters] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // Fetch companies from API
  const fetchCompanies = async (params: Record<string, any> = {}) => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        page: String(params.page || currentPage),
        limit: '20',
        ...params,
      })

      const response = await fetch(`/api/companies?${queryParams}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()
      setCompanies(result.data)
      setTotalPages(result.meta.totalPages)
      setTotalCount(result.meta.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies')
      console.error('Error fetching companies:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchCompanies()
  }, [currentPage])

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    fetchCompanies({ search: query, page: 1 })
  }

  // Handle filter
  const handleFilter = (filters: Record<string, any>) => {
    setCurrentPage(1)
    fetchCompanies({ ...filters, page: 1 })
  }

  // Handle sort
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    fetchCompanies({
      search: searchQuery,
      sortBy: key,
      sortOrder: direction,
      page: currentPage,
    })
  }

  // Handle row click
  const handleRowClick = (company: Company) => {
    router.push(`/dashboard/companies/${company.id}`)
  }

  // Handle delete company
  const handleDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete company')
      }

      // Refresh the table
      fetchCompanies()
    } catch (err) {
      console.error('Error deleting company:', err)
      alert('Failed to delete company. Please try again.')
    }
  }

  // Handle advanced filter
  const handleAdvancedFilter = async (config: FilterConfig) => {
    setCurrentFilters(config)
    setCurrentPage(1)
    fetchCompanies({
      advancedFilters: JSON.stringify(config),
      page: 1
    })
  }

  // Handle filter preview
  const handleFilterPreview = async (config: FilterConfig): Promise<FilterPreviewType> => {
    try {
      const response = await fetch('/api/companies/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters: config }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch preview')
      }

      const result = await response.json()
      return {
        count: result.count,
        totalCount: totalCount,
        percentage: totalCount > 0 ? (result.count / totalCount) * 100 : 0,
        sample: result.sample || [],
      }
    } catch (error) {
      console.error('Error fetching filter preview:', error)
      return {
        count: 0,
        totalCount: totalCount,
        percentage: 0,
        sample: [],
      }
    }
  }

  // Handle save filter
  const handleSaveFilter = async (name: string, config: FilterConfig, isPublic: boolean) => {
    try {
      const response = await fetch('/api/saved-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          config,
          isPublic,
          entityType: 'companies',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save filter')
      }

      // Refresh saved filters
      await fetchSavedFilters()
    } catch (error) {
      console.error('Error saving filter:', error)
      throw error
    }
  }

  // Handle load filter
  const handleLoadFilter = async (filterId: string) => {
    try {
      const response = await fetch(`/api/saved-filters/${filterId}`)

      if (!response.ok) {
        throw new Error('Failed to load filter')
      }

      const filter = await response.json()
      setCurrentFilters(filter.config)
      setCurrentPage(1)
      fetchCompanies({
        advancedFilters: JSON.stringify(filter.config),
        page: 1
      })
    } catch (error) {
      console.error('Error loading filter:', error)
    }
  }

  // Handle delete filter
  const handleDeleteFilter = async (filterId: string) => {
    try {
      const response = await fetch(`/api/saved-filters/${filterId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete filter')
      }

      // Refresh saved filters
      await fetchSavedFilters()
    } catch (error) {
      console.error('Error deleting filter:', error)
    }
  }

  // Fetch saved filters
  const fetchSavedFilters = async () => {
    try {
      const response = await fetch('/api/saved-filters?entityType=companies')

      if (response.ok) {
        const filters = await response.json()
        setSavedFilters(filters.data || [])
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error)
    }
  }

  // Load saved filters on mount
  useEffect(() => {
    fetchSavedFilters()
  }, [])

  // Define table columns
  const columns: Column<Company>[] = [
    {
      key: 'name',
      title: 'Company Name',
      dataIndex: 'name',
      sortable: true,
      filterable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {record.website && (
              <div className="text-sm text-gray-500">
                <a
                  href={record.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {record.website}
                </a>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      title: 'Industry',
      dataIndex: 'industry',
      filterable: true,
      filterType: 'select',
      filterOptions: industryOptions.map((industry) => ({
        value: industry,
        label: industry,
      })),
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value || 'Not specified'}
        </span>
      ),
    },
    {
      key: 'companySize',
      title: 'Size',
      dataIndex: 'companySize',
      filterable: true,
      filterType: 'select',
      filterOptions: companySizeOptions.map((size) => ({
        value: size.value,
        label: size.label,
      })),
      render: (value) => {
        const sizeOption = companySizeOptions.find((option) => option.value === value)
        return sizeOption ? sizeOption.label : 'Not specified'
      },
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      filterable: true,
      filterType: 'select',
      filterOptions: companyStatusOptions.map((status) => ({
        value: status.value,
        label: status.label,
      })),
      render: (value) => {
        const colors = {
          ACTIVE: 'bg-green-100 text-green-800',
          PROSPECT: 'bg-yellow-100 text-yellow-800',
          CUSTOMER: 'bg-blue-100 text-blue-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
          CHURNED: 'bg-red-100 text-red-800',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[value as keyof typeof colors]}`}>
            {companyStatusOptions.find((option) => option.value === value)?.label || value}
          </span>
        )
      },
    },
    {
      key: 'contacts',
      title: 'Contacts',
      dataIndex: '_count',
      render: (value) => (
        <div className="flex items-center text-sm text-gray-900">
          <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
          {value.contacts}
        </div>
      ),
    },
    {
      key: 'deals',
      title: 'Deals',
      dataIndex: '_count',
      render: (value) => (
        <div className="flex items-center text-sm text-gray-900">
          <BanknotesIcon className="h-4 w-4 text-gray-400 mr-1" />
          {value.deals}
        </div>
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
            href={`/dashboard/companies/${value}`}
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          <Link
            href={`/dashboard/companies/${value}/edit`}
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
        title="Failed to load companies"
        message={error}
        onRetry={() => fetchCompanies()}
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      data={companies}
      loading={loading}
      searchable={true}
      selectable={true}
      exportable={true}
      advancedFiltering={true}
      entityType="companies"
      filterFields={COMPANY_FIELDS}
      savedFilters={savedFilters}
      onSearch={handleSearch}
      onFilter={handleFilter}
      onAdvancedFilter={handleAdvancedFilter}
      onFilterPreview={handleFilterPreview}
      onSaveFilter={handleSaveFilter}
      onLoadFilter={handleLoadFilter}
      onDeleteFilter={handleDeleteFilter}
      onSort={handleSort}
      onRowClick={handleRowClick}
      emptyText="No companies found. Add your first company to get started."
      className="shadow-sm"
    />
  )
}