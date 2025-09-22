import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateQueryParams,
  buildSearchFilter
} from '@/lib/api-utils'
import {
  companyQuerySchema,
  CompanyQueryInput
} from '@/lib/validations'

// ============================================================================
// GET /api/companies/count - Real-time count for filtered company results
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/companies/count')

  try {
    const { searchParams } = new URL(request.url)
    const query: CompanyQueryInput = validateQueryParams(searchParams, companyQuerySchema)

    // Build search filter (same logic as main companies endpoint)
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

    // Combine all filters (identical to main endpoint)
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(statusFilter && statusFilter),
      ...(sizeFilter && sizeFilter),
      ...(industryFilter && industryFilter)
    }

    // Get count with same filters
    const count = await prisma.company.count({ where })

    // Get breakdown by status for additional insights
    const statusBreakdown = await prisma.company.groupBy({
      by: ['status'],
      where: {
        isDeleted: false,
        ...(searchFilter && { OR: searchFilter.OR }),
        ...(sizeFilter && sizeFilter),
        ...(industryFilter && industryFilter)
      },
      _count: true
    })

    return successResponse({
      total: count,
      breakdown: {
        byStatus: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>)
      },
      filters: {
        search: query.search || null,
        status: query.status || null,
        companySize: query.companySize || null,
        industry: query.industry || null
      }
    })

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// Handle unsupported methods
export async function POST() {
  return methodNotAllowed(['GET'])
}

export async function PUT() {
  return methodNotAllowed(['GET'])
}

export async function DELETE() {
  return methodNotAllowed(['GET'])
}

export async function PATCH() {
  return methodNotAllowed(['GET'])
}