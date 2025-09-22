import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  paginatedResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateRequestBody,
  validateQueryParams,
  buildPaginationQuery,
  buildSearchFilter,
  buildSortQuery
} from '@/lib/api-utils'
import {
  createCompanySchema,
  companyQuerySchema,
  CreateCompanyInput,
  CompanyQueryInput
} from '@/lib/validations'

// ============================================================================
// GET /api/companies - List companies with filtering, search, and pagination
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/companies')

  try {
    const { searchParams } = new URL(request.url)
    const query: CompanyQueryInput = validateQueryParams(searchParams, companyQuerySchema)

    // Build search filter
    const searchFilter = query.search ? buildSearchFilter(query.search, [
      'name',
      'industry',
      'website',
      'city',
      'state',
      'country'
    ]) : undefined

    // Build status and size filters
    const statusFilter = query.status ? { status: query.status } : undefined
    const sizeFilter = query.companySize ? { companySize: query.companySize } : undefined
    const industryFilter = query.industry ? { industry: query.industry } : undefined

    // Combine all filters
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(statusFilter && statusFilter),
      ...(sizeFilter && sizeFilter),
      ...(industryFilter && industryFilter)
    }

    // Build sort query
    const orderBy = buildSortQuery(query.sortBy, query.sortOrder)

    // Get total count for pagination
    const total = await prisma.company.count({ where })

    // Get paginated results
    const companies = await prisma.company.findMany({
      where,
      ...buildPaginationQuery(query.page, query.limit),
      orderBy,
      include: {
        contacts: {
          where: { isDeleted: false },
          take: 5, // Preview of contacts
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            isPrimary: true
          }
        },
        deals: {
          where: { isDeleted: false },
          take: 5, // Preview of deals
          select: {
            id: true,
            title: true,
            value: true,
            status: true,
            expectedCloseDate: true
          }
        },
        _count: {
          select: {
            contacts: { where: { isDeleted: false } },
            deals: { where: { isDeleted: false } },
            activities: { where: { isDeleted: false } }
          }
        }
      }
    })

    return paginatedResponse(companies, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}


// Simple POST for demo purposes
export async function POST(request: NextRequest) {
  return new Response(JSON.stringify({ error: 'POST not implemented in demo' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Handle unsupported methods
export async function PUT() {
  return methodNotAllowed(['GET', 'POST'])
}

export async function DELETE() {
  return methodNotAllowed(['GET', 'POST'])
}

export async function PATCH() {
  return methodNotAllowed(['GET', 'POST'])
}