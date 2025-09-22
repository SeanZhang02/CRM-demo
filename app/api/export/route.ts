import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateRequestBody
} from '@/lib/api-utils'
import {
  buildAdvancedWhereClause,
  validateFilterQuery,
  type AdvancedFilterQuery
} from '@/lib/advanced-filters'

// ============================================================================
// POST /api/export - Export filtered data as CSV or Excel
// Supports all CRM entities with advanced filtering
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/export')

  try {
    const body = await request.json()

    // Extract export configuration
    const {
      entity,
      filters,
      format = 'csv',
      fields,
      filename,
      ...filterQuery
    } = body

    // Create advanced filter query
    const advancedQuery: AdvancedFilterQuery = {
      entity,
      filters,
      ...filterQuery
    }

    // Validate the filter query
    const validation = validateFilterQuery(advancedQuery)
    if (!validation.isValid) {
      return handleError({
        name: 'ValidationError',
        message: 'Invalid filter query',
        statusCode: 400,
        details: validation.errors
      })
    }

    // Build the advanced where clause
    const advancedWhere = buildAdvancedWhereClause(filters)

    // Add default soft delete filter
    const where = {
      isDeleted: false,
      ...advancedWhere
    }

    // Add global search if provided
    if (filterQuery.search) {
      const searchConditions = buildSearchConditions(entity, filterQuery.search)
      if (searchConditions) {
        where.OR = where.OR ? [...where.OR, ...searchConditions] : searchConditions
      }
    }

    // Get data for export
    const data = await getExportData(entity, where, fields)

    // Generate export based on format
    const exportResult = await generateExport(data, format, entity, filename)

    return exportResult

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildSearchConditions(entity: string, search: string) {
  const searchFields: Record<string, string[]> = {
    companies: ['name', 'industry', 'website', 'city', 'state', 'country'],
    contacts: ['firstName', 'lastName', 'email', 'phone', 'mobilePhone', 'jobTitle', 'department'],
    deals: ['title', 'description', 'source'],
    activities: ['subject', 'description', 'location']
  }

  const fields = searchFields[entity]
  if (!fields) return null

  return fields.map(field => ({
    [field]: {
      contains: search,
      mode: 'insensitive' as const
    }
  }))
}

async function getExportData(entity: string, where: any, fields?: string[]) {
  // Define field mappings for export
  const defaultFields: Record<string, any> = {
    companies: {
      id: true,
      name: true,
      industry: true,
      website: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      companySize: true,
      status: true,
      annualRevenue: true,
      employeeCount: true,
      createdAt: true,
      updatedAt: true,
      // Include related counts
      _count: {
        select: {
          contacts: { where: { isDeleted: false } },
          deals: { where: { isDeleted: false } },
          activities: { where: { isDeleted: false } }
        }
      }
    },
    contacts: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      mobilePhone: true,
      jobTitle: true,
      department: true,
      isPrimary: true,
      preferredContact: true,
      status: true,
      linkedinUrl: true,
      twitterUrl: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          name: true,
          industry: true,
          status: true
        }
      },
      _count: {
        select: {
          deals: { where: { isDeleted: false } },
          activities: { where: { isDeleted: false } }
        }
      }
    },
    deals: {
      id: true,
      title: true,
      description: true,
      value: true,
      currency: true,
      expectedCloseDate: true,
      actualCloseDate: true,
      probability: true,
      status: true,
      priority: true,
      source: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          name: true,
          industry: true
        }
      },
      contact: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          jobTitle: true
        }
      },
      stage: {
        select: {
          name: true,
          stageType: true,
          probability: true
        }
      },
      _count: {
        select: {
          activities: { where: { isDeleted: false } }
        }
      }
    },
    activities: {
      id: true,
      type: true,
      subject: true,
      description: true,
      dueDate: true,
      completedAt: true,
      duration: true,
      status: true,
      priority: true,
      location: true,
      meetingUrl: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          name: true,
          industry: true
        }
      },
      contact: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      deal: {
        select: {
          title: true,
          value: true,
          status: true
        }
      }
    }
  }

  // Use custom fields if provided, otherwise use defaults
  const select = fields ? buildCustomSelect(fields) : defaultFields[entity]

  switch (entity) {
    case 'companies':
      return await prisma.company.findMany({
        where,
        select,
        orderBy: { name: 'asc' }
      })

    case 'contacts':
      return await prisma.contact.findMany({
        where,
        select,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
      })

    case 'deals':
      return await prisma.deal.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' }
      })

    case 'activities':
      return await prisma.activity.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' }
      })

    default:
      throw new Error(`Unsupported entity type: ${entity}`)
  }
}

function buildCustomSelect(fields: string[]): any {
  const select: any = {}

  for (const field of fields) {
    if (field.includes('.')) {
      // Handle nested fields like 'company.name'
      const [relation, subField] = field.split('.')
      if (!select[relation]) {
        select[relation] = { select: {} }
      }
      select[relation].select[subField] = true
    } else {
      select[field] = true
    }
  }

  return select
}

async function generateExport(data: any[], format: string, entity: string, customFilename?: string) {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = customFilename || `${entity}_export_${timestamp}.${format}`

  if (format === 'csv') {
    return generateCSV(data, filename)
  } else if (format === 'excel') {
    return generateExcel(data, filename)
  } else {
    throw new Error(`Unsupported export format: ${format}`)
  }
}

function generateCSV(data: any[], filename: string) {
  if (data.length === 0) {
    return new Response('No data to export', { status: 400 })
  }

  // Flatten the data and get headers
  const flattenedData = data.map(item => flattenObject(item))
  const headers = Object.keys(flattenedData[0])

  // Generate CSV content
  const csvContent = [
    headers.join(','),
    ...flattenedData.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

function generateExcel(data: any[], filename: string) {
  // For now, return CSV with Excel-friendly formatting
  // In a real implementation, you would use a library like xlsx or exceljs
  const csvResponse = generateCSV(data, filename.replace('.xlsx', '.csv'))

  return new Response(csvResponse.body, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}_${key}` : key

      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively flatten nested objects (but not arrays or dates)
        Object.assign(flattened, flattenObject(value, newKey))
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        flattened[newKey] = value.join(', ')
      } else if (value instanceof Date) {
        // Format dates
        flattened[newKey] = value.toISOString().split('T')[0]
      } else {
        flattened[newKey] = value
      }
    }
  }

  return flattened
}

// Handle unsupported methods
export async function GET() {
  return methodNotAllowed(['POST'])
}

export async function PUT() {
  return methodNotAllowed(['POST'])
}

export async function DELETE() {
  return methodNotAllowed(['POST'])
}

export async function PATCH() {
  return methodNotAllowed(['POST'])
}