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
  dealQuerySchema,
  DealQueryInput
} from '@/lib/validations'

// ============================================================================
// GET /api/deals/count - Real-time count for filtered deal results
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/deals/count')

  try {
    const { searchParams } = new URL(request.url)
    const query: DealQueryInput = validateQueryParams(searchParams, dealQuerySchema)

    // Build search filter (same logic as main deals endpoint)
    const searchFilter = query.search ? buildSearchFilter(query.search, [
      'title',
      'description',
      'source'
    ]) : undefined

    // Build specific filters
    const statusFilter = query.status ? { status: query.status } : undefined
    const priorityFilter = query.priority ? { priority: query.priority } : undefined
    const companyFilter = query.companyId ? { companyId: query.companyId } : undefined
    const contactFilter = query.contactId ? { contactId: query.contactId } : undefined
    const stageFilter = query.stageId ? { stageId: query.stageId } : undefined

    // Build value range filter
    const valueFilter: any = {}
    if (query.minValue !== undefined) {
      valueFilter.gte = query.minValue
    }
    if (query.maxValue !== undefined) {
      valueFilter.lte = query.maxValue
    }
    const valueRangeFilter = Object.keys(valueFilter).length > 0 ? { value: valueFilter } : undefined

    // Build date range filter
    const dateFilter: any = {}
    if (query.expectedCloseDateFrom) {
      dateFilter.gte = new Date(query.expectedCloseDateFrom)
    }
    if (query.expectedCloseDateTo) {
      dateFilter.lte = new Date(query.expectedCloseDateTo)
    }
    const dateRangeFilter = Object.keys(dateFilter).length > 0 ? { expectedCloseDate: dateFilter } : undefined

    // Combine all filters (identical to main endpoint)
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(statusFilter && statusFilter),
      ...(priorityFilter && priorityFilter),
      ...(companyFilter && companyFilter),
      ...(contactFilter && contactFilter),
      ...(stageFilter && stageFilter),
      ...(valueRangeFilter && valueRangeFilter),
      ...(dateRangeFilter && dateRangeFilter)
    }

    // Get count with same filters
    const count = await prisma.deal.count({ where })

    // Get breakdown by status, priority, and stage for additional insights
    const statusBreakdown = await prisma.deal.groupBy({
      by: ['status'],
      where: {
        isDeleted: false,
        ...(searchFilter && { OR: searchFilter.OR }),
        ...(priorityFilter && priorityFilter),
        ...(companyFilter && companyFilter),
        ...(contactFilter && contactFilter),
        ...(stageFilter && stageFilter),
        ...(valueRangeFilter && valueRangeFilter),
        ...(dateRangeFilter && dateRangeFilter)
      },
      _count: true,
      _sum: {
        value: true
      }
    })

    const stageBreakdown = await prisma.deal.groupBy({
      by: ['stageId'],
      where: {
        isDeleted: false,
        ...(searchFilter && { OR: searchFilter.OR }),
        ...(statusFilter && statusFilter),
        ...(priorityFilter && priorityFilter),
        ...(companyFilter && companyFilter),
        ...(contactFilter && contactFilter),
        ...(valueRangeFilter && valueRangeFilter),
        ...(dateRangeFilter && dateRangeFilter)
      },
      _count: true,
      _sum: {
        value: true
      }
    })

    // Get stage names for breakdown
    const stageIds = stageBreakdown.map(item => item.stageId)
    const stages = await prisma.pipelineStage.findMany({
      where: { id: { in: stageIds } },
      select: { id: true, name: true, position: true }
    })

    const stageMap = stages.reduce((acc, stage) => {
      acc[stage.id] = stage
      return acc
    }, {} as Record<string, any>)

    return successResponse({
      total: count,
      breakdown: {
        byStatus: statusBreakdown.map(item => ({
          status: item.status,
          count: item._count,
          totalValue: item._sum.value || 0
        })),
        byStage: stageBreakdown.map(item => ({
          stageId: item.stageId,
          stageName: stageMap[item.stageId]?.name || 'Unknown',
          position: stageMap[item.stageId]?.position || 999,
          count: item._count,
          totalValue: item._sum.value || 0
        })).sort((a, b) => a.position - b.position)
      },
      filters: {
        search: query.search || null,
        status: query.status || null,
        priority: query.priority || null,
        companyId: query.companyId || null,
        contactId: query.contactId || null,
        stageId: query.stageId || null,
        minValue: query.minValue || null,
        maxValue: query.maxValue || null,
        expectedCloseDateFrom: query.expectedCloseDateFrom || null,
        expectedCloseDateTo: query.expectedCloseDateTo || null
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