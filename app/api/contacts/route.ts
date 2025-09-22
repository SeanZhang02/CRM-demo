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
  createContactSchema,
  contactQuerySchema,
  CreateContactInput,
  ContactQueryInput
} from '@/lib/validations/contact'

// ============================================================================
// GET /api/contacts - List contacts with filtering, search, and pagination
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/contacts')

  try {
    const { searchParams } = new URL(request.url)

    // Debug logging for filter investigation
    console.log('🔍 [DEBUG] Raw search params:', Object.fromEntries(searchParams.entries()))

    // Create params object manually to debug
    const params: Record<string, any> = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    console.log('🔍 [DEBUG] Params object before Zod validation:', JSON.stringify(params, null, 2))

    const query: ContactQueryInput = validateQueryParams(searchParams, contactQuerySchema)

    // Debug logging for parsed query
    console.log('🔍 [DEBUG] Parsed query object:', JSON.stringify(query, null, 2))
    console.log('🔍 [DEBUG] Query companySize value:', query.companySize)
    console.log('🔍 [DEBUG] Query companySize type:', typeof query.companySize)

    // Build search filter across multiple fields
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
    const companyIdFilter = query.companyId ? { companyId: query.companyId } : undefined
    const primaryFilter = query.isPrimary !== undefined ? { isPrimary: query.isPrimary } : undefined

    // Build name filters
    const firstNameFilter = query.firstName ? { firstName: { contains: query.firstName } } : undefined
    const lastNameFilter = query.lastName ? { lastName: { contains: query.lastName } } : undefined
    const emailFilter = query.email ? { email: { contains: query.email } } : undefined

    // Build contact name filter (searches both firstName and lastName)
    const nameFilter = query.name ? {
      OR: [
        { firstName: { contains: query.name } },
        { lastName: { contains: query.name } }
      ]
    } : undefined

    // Build company name filter (searches related company)
    const companyNameFilter = query.company ? {
      company: {
        name: { contains: query.company }
      }
    } : undefined

    // Build advanced filters
    // Company filters - combine all company-related filters into one object to avoid overwriting
    const companyFilter: any = {}
    if (query.companyStatus) companyFilter.status = query.companyStatus
    if (query.companySize) companyFilter.companySize = query.companySize
    if (query.industry) companyFilter.industry = { contains: query.industry }

    console.log('🔧 [DEBUG] Company filter object:', JSON.stringify(companyFilter, null, 2))

    const combinedCompanyFilter = Object.keys(companyFilter).length > 0 ? {
      company: companyFilter
    } : undefined

    console.log('🔧 [DEBUG] Combined company filter:', JSON.stringify(combinedCompanyFilter, null, 2))

    // Date-based filters
    let dateFilter = undefined
    if (query.addedWithin) {
      const now = new Date()
      let startDate: Date

      switch (query.addedWithin) {
        case '1_DAY':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '1_WEEK':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '1_MONTH':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3_MONTHS':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6_MONTHS':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case '1_YEAR':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = now
      }
      dateFilter = { createdAt: { gte: startDate } }
    } else {
      // Handle custom date range if provided
      if (query.createdAfter || query.createdBefore) {
        dateFilter = {
          createdAt: {
            ...(query.createdAfter && { gte: new Date(query.createdAfter) }),
            ...(query.createdBefore && { lte: new Date(query.createdBefore) })
          }
        }
      }
    }

    // Contact preference filters
    const preferredContactFilter = query.preferredContact ? {
      preferredContact: query.preferredContact
    } : undefined

    const hasEmailFilter = query.hasEmail !== undefined ?
      (query.hasEmail ? { email: { not: null } } : { email: null }) : undefined

    const hasPhoneFilter = query.hasPhone !== undefined ?
      (query.hasPhone ? { phone: { not: null } } : { phone: null }) : undefined

    const hasMobileFilter = query.hasMobile !== undefined ?
      (query.hasMobile ? { mobilePhone: { not: null } } : { mobilePhone: null }) : undefined

    // Activity and deal filters
    const hasDealsFilter = query.hasDeals !== undefined ?
      (query.hasDeals ? { deals: { some: { isDeleted: false } } } : { deals: { none: {} } }) : undefined

    let dealCountFilter = undefined
    if (query.dealCount) {
      switch (query.dealCount) {
        case 'NONE':
          dealCountFilter = { deals: { none: {} } }
          break
        case 'LOW':
          dealCountFilter = { deals: { some: {}, every: { isDeleted: false } } }
          // We'll handle count logic in a separate query for simplicity
          break
        case 'MEDIUM':
        case 'HIGH':
          // These would require more complex aggregation - simplified for now
          dealCountFilter = { deals: { some: { isDeleted: false } } }
          break
      }
    }

    const hasRecentActivityFilter = query.hasRecentActivity !== undefined ?
      (query.hasRecentActivity ? {
        activities: {
          some: {
            isDeleted: false,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }
        }
      } : {
        activities: { none: {} }
      }) : undefined

    // Combine all filters
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(statusFilter && statusFilter),
      ...(companyIdFilter && companyIdFilter),
      ...(primaryFilter && primaryFilter),
      ...(firstNameFilter && firstNameFilter),
      ...(lastNameFilter && lastNameFilter),
      ...(emailFilter && emailFilter),
      ...(nameFilter && nameFilter),
      ...(companyNameFilter && companyNameFilter),
      // Advanced filters
      ...(combinedCompanyFilter && combinedCompanyFilter),
      ...(dateFilter && dateFilter),
      ...(preferredContactFilter && preferredContactFilter),
      ...(hasEmailFilter && hasEmailFilter),
      ...(hasPhoneFilter && hasPhoneFilter),
      ...(hasMobileFilter && hasMobileFilter),
      ...(hasDealsFilter && hasDealsFilter),
      ...(dealCountFilter && dealCountFilter),
      ...(hasRecentActivityFilter && hasRecentActivityFilter)
    }

    // Debug logging for constructed where clause
    console.log('🔍 [DEBUG] Constructed where clause:', JSON.stringify(where, null, 2))

    // Build sort query
    const orderBy = buildSortQuery(query.sortBy, query.sortOrder)

    // Get total count for pagination
    const total = await prisma.contact.count({ where })

    // Debug logging for count
    console.log('🔍 [DEBUG] Total contacts matching filter:', total)

    // Get paginated results with relationships
    const contacts = await prisma.contact.findMany({
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
        deals: {
          where: { isDeleted: false },
          take: 5, // Preview of deals
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
            deals: { where: { isDeleted: false } },
            activities: { where: { isDeleted: false } }
          }
        }
      }
    })

    // Debug logging for final results
    console.log('🔍 [DEBUG] Contacts returned:', contacts.length)
    console.log('🔍 [DEBUG] Contact names:', contacts.map(c => `${c.firstName} ${c.lastName} (${c.company?.name})`))

    return paginatedResponse(contacts, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/contacts - Create a new contact
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/contacts')

  try {
    const body: CreateContactInput = await validateRequestBody(request, createContactSchema)

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

    // Check for duplicate email if provided
    if (body.email) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email: body.email,
          isDeleted: false
        }
      })

      if (existingContact) {
        console.warn(`Duplicate contact email detected: ${body.email}`)
        // Note: This is a warning, not an error - multiple contacts can have same email
      }
    }

    // If this is marked as primary contact, ensure no other primary for this company
    if (body.isPrimary && body.companyId) {
      await prisma.contact.updateMany({
        where: {
          companyId: body.companyId,
          isPrimary: true,
          isDeleted: false
        },
        data: { isPrimary: false }
      })
    }

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        ...body,
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
        deals: {
          where: { isDeleted: false },
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
            deals: { where: { isDeleted: false } },
            activities: { where: { isDeleted: false } }
          }
        }
      }
    })

    return successResponse(contact)

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