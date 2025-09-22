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
  createActivitySchema,
  activityQuerySchema,
  CreateActivityInput,
  ActivityQueryInput
} from '@/lib/validations'

// ============================================================================
// GET /api/activities - List activities with entity filtering and timeline support
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/activities')

  try {
    const { searchParams } = new URL(request.url)
    const query: ActivityQueryInput = validateQueryParams(searchParams, activityQuerySchema)

    // Build search filter across multiple fields
    const searchFilter = query.search ? buildSearchFilter(query.search, [
      'subject',
      'description',
      'location'
    ]) : undefined

    // Build specific filters
    const typeFilter = query.type ? { type: query.type } : undefined
    const statusFilter = query.status ? { status: query.status } : undefined
    const priorityFilter = query.priority ? { priority: query.priority } : undefined
    const companyFilter = query.companyId ? { companyId: query.companyId } : undefined
    const contactFilter = query.contactId ? { contactId: query.contactId } : undefined
    const dealFilter = query.dealId ? { dealId: query.dealId } : undefined

    // Build date range filter
    const dateFilter: any = {}
    if (query.dueDateFrom) {
      dateFilter.gte = new Date(query.dueDateFrom)
    }
    if (query.dueDateTo) {
      dateFilter.lte = new Date(query.dueDateTo)
    }
    const dateRangeFilter = Object.keys(dateFilter).length > 0 ? { dueDate: dateFilter } : undefined

    // Combine all filters
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(typeFilter && typeFilter),
      ...(statusFilter && statusFilter),
      ...(priorityFilter && priorityFilter),
      ...(companyFilter && companyFilter),
      ...(contactFilter && contactFilter),
      ...(dealFilter && dealFilter),
      ...(dateRangeFilter && dateRangeFilter)
    }

    // Build sort query
    const orderBy = buildSortQuery(query.sortBy, query.sortOrder)

    // Get total count for pagination
    const total = await prisma.activity.count({ where })

    // Get paginated results with full relationships
    const activities = await prisma.activity.findMany({
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
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            status: true,
            stage: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return paginatedResponse(activities, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/activities - Create a new activity with entity linking
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/activities')

  try {
    const body: CreateActivityInput = await validateRequestBody(request, createActivitySchema)

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

    // Validate contact exists if provided
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

      // If contact is provided but no company, use contact's company
      if (!body.companyId && contact.companyId) {
        body.companyId = contact.companyId
      }
    }

    // Validate deal exists if provided
    if (body.dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: body.dealId, isDeleted: false }
      })

      if (!deal) {
        return handleError({
          name: 'ValidationError',
          message: 'Referenced deal does not exist',
          statusCode: 400
        })
      }

      // If deal is provided but no company/contact, use deal's relationships
      if (!body.companyId && deal.companyId) {
        body.companyId = deal.companyId
      }
      if (!body.contactId && deal.contactId) {
        body.contactId = deal.contactId
      }
    }

    // Convert dueDate string to Date if provided
    const activityData = { ...body }
    if (activityData.dueDate) {
      activityData.dueDate = new Date(activityData.dueDate)
    }

    // Create the activity
    const activity = await prisma.activity.create({
      data: {
        ...activityData,
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
            jobTitle: true
          }
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            status: true,
            stage: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return successResponse(activity)

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