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
  contactQuerySchema,
  ContactQueryInput
} from '@/lib/validations'

// ============================================================================
// GET /api/contacts/count - Real-time count for filtered contact results
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/contacts/count')

  try {
    const { searchParams } = new URL(request.url)
    const query: ContactQueryInput = validateQueryParams(searchParams, contactQuerySchema)

    // Build search filter (same logic as main contacts endpoint)
    const searchFilter = query.search ? buildSearchFilter(query.search, [
      'firstName',
      'lastName',
      'email',
      'phone',
      'mobilePhone',
      'jobTitle',
      'department'
    ]) : undefined

    // Build specific filters
    const statusFilter = query.status ? { status: query.status } : undefined
    const companyFilter = query.companyId ? { companyId: query.companyId } : undefined
    const primaryFilter = query.isPrimary !== undefined ? { isPrimary: query.isPrimary } : undefined

    // Combine all filters (identical to main endpoint)
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(statusFilter && statusFilter),
      ...(companyFilter && companyFilter),
      ...(primaryFilter && primaryFilter)
    }

    // Get count with same filters
    const count = await prisma.contact.count({ where })

    // Get breakdown by status and primary status for additional insights
    const statusBreakdown = await prisma.contact.groupBy({
      by: ['status'],
      where: {
        isDeleted: false,
        ...(searchFilter && { OR: searchFilter.OR }),
        ...(companyFilter && companyFilter),
        ...(primaryFilter && primaryFilter)
      },
      _count: true
    })

    const primaryBreakdown = await prisma.contact.groupBy({
      by: ['isPrimary'],
      where: {
        isDeleted: false,
        ...(searchFilter && { OR: searchFilter.OR }),
        ...(statusFilter && statusFilter),
        ...(companyFilter && companyFilter)
      },
      _count: true
    })

    return successResponse({
      total: count,
      breakdown: {
        byStatus: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>),
        byPrimary: primaryBreakdown.reduce((acc, item) => {
          acc[item.isPrimary ? 'primary' : 'secondary'] = item._count
          return acc
        }, {} as Record<string, number>)
      },
      filters: {
        search: query.search || null,
        status: query.status || null,
        companyId: query.companyId || null,
        isPrimary: query.isPrimary ?? null
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