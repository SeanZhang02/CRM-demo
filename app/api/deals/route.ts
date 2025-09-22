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
  createDealSchema,
  dealQuerySchema,
  CreateDealInput,
  DealQueryInput
} from '@/lib/validations'

// ============================================================================
// GET /api/deals - List deals with advanced filtering and pipeline support
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/deals')

  try {
    const { searchParams } = new URL(request.url)
    const query: DealQueryInput = validateQueryParams(searchParams, dealQuerySchema)

    // Build search filter across multiple fields
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

    // Combine all filters
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

    // Build sort query
    const orderBy = buildSortQuery(query.sortBy, query.sortOrder)

    // Get total count for pagination
    const total = await prisma.deal.count({ where })

    // Get paginated results with full relationships
    const deals = await prisma.deal.findMany({
      where,
      ...buildPaginationQuery(query.page, query.limit),
      orderBy,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            status: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            isPrimary: true
          }
        },
        stage: {
          select: {
            id: true,
            name: true,
            description: true,
            position: true,
            probability: true,
            color: true,
            stageType: true
          }
        },
        activities: {
          where: { isDeleted: false },
          take: 5, // Preview of recent activities
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            dueDate: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            activities: { where: { isDeleted: false } }
          }
        }
      }
    })

    return paginatedResponse(deals, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/deals - Create a new deal
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/deals')

  try {
    const body: CreateDealInput = await validateRequestBody(request, createDealSchema)

    // Validate stage exists
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: body.stageId, isActive: true }
    })

    if (!stage) {
      return handleError({
        name: 'ValidationError',
        message: 'Referenced pipeline stage does not exist or is inactive',
        statusCode: 400
      })
    }

    // Validate company exists if provided
    if (body.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: body.companyId, isDeleted: false }
      })

      if (!company) {
        return handleError({
          name: 'ValidationError',
          message: 'Referenced company does not exist',
          statusCode: 400
        })
      }
    }

    // Validate contact exists and belongs to company if both provided
    if (body.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: body.contactId, isDeleted: false }
      })

      if (!contact) {
        return handleError({
          name: 'ValidationError',
          message: 'Referenced contact does not exist',
          statusCode: 400
        })
      }

      // If both company and contact are provided, ensure they're related
      if (body.companyId && contact.companyId !== body.companyId) {
        return handleError({
          name: 'ValidationError',
          message: 'Contact does not belong to the specified company',
          statusCode: 400
        })
      }

      // If contact is provided but no company, use contact's company
      if (!body.companyId && contact.companyId) {
        body.companyId = contact.companyId
      }
    }

    // Set probability from stage if not provided
    const dealData = {
      ...body,
      probability: body.probability ?? stage.probability
    }

    // Convert expectedCloseDate string to Date if provided
    if (dealData.expectedCloseDate) {
      dealData.expectedCloseDate = new Date(dealData.expectedCloseDate)
    }

    // Create the deal
    const deal = await prisma.deal.create({
      data: {
        ...dealData,
        // Set owner if user is authenticated (placeholder for future auth)
        // ownerId: user?.id
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            status: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            isPrimary: true
          }
        },
        stage: {
          select: {
            id: true,
            name: true,
            description: true,
            position: true,
            probability: true,
            color: true,
            stageType: true
          }
        },
        activities: {
          where: { isDeleted: false },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            dueDate: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            activities: { where: { isDeleted: false } }
          }
        }
      }
    })

    return successResponse(deal)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
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