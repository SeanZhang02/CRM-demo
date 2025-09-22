import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  paginatedResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateRequestBody,
  buildPaginationQuery
} from '@/lib/api-utils'
import {
  buildAdvancedWhereClause,
  validateFilterQuery,
  type AdvancedFilterQuery,
  FILTER_FIELD_CONFIG
} from '@/lib/advanced-filters'

// ============================================================================
// POST /api/filter - Advanced filtering across all CRM entities
// Supports complex AND/OR logic with sophisticated operators
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/filter')

  try {
    const body: AdvancedFilterQuery = await request.json()

    // Validate the filter query
    const validation = validateFilterQuery(body)
    if (!validation.isValid) {
      return handleError({
        name: 'ValidationError',
        message: 'Invalid filter query',
        statusCode: 400,
        details: validation.errors
      })
    }

    // Build the advanced where clause
    const advancedWhere = buildAdvancedWhereClause(body.filters)

    // Add default soft delete filter
    const where = {
      isDeleted: false,
      ...advancedWhere
    }

    // Add global search if provided
    if (body.search) {
      const searchConditions = buildSearchConditions(body.entity, body.search)
      if (searchConditions) {
        where.OR = where.OR ? [...where.OR, ...searchConditions] : searchConditions
      }
    }

    // Build sort configuration
    const orderBy = body.sort ? {
      [body.sort.field]: body.sort.direction
    } : undefined

    // Execute query based on entity type
    const result = await executeEntityQuery(
      body.entity,
      where,
      orderBy,
      body.pagination
    )

    return result

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// GET /api/filter/config - Get filter configuration for entities
// Returns available fields and operators for the filter builder UI
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/filter/config')

  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')

    if (entity && !['companies', 'contacts', 'deals', 'activities'].includes(entity)) {
      return handleError({
        name: 'ValidationError',
        message: 'Invalid entity type',
        statusCode: 400
      })
    }

    // Return configuration for specific entity or all entities
    const config = entity
      ? { [entity]: FILTER_FIELD_CONFIG[entity as keyof typeof FILTER_FIELD_CONFIG] }
      : FILTER_FIELD_CONFIG

    // Get additional metadata for each entity
    const metadata = await getEntityMetadata(entity as any)

    return successResponse({
      config,
      metadata,
      operators: {
        text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
        number: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'between', 'is_empty', 'is_not_empty'],
        date: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_relative', 'is_empty', 'is_not_empty'],
        enum: ['equals', 'not_equals', 'in', 'not_in'],
        boolean: ['equals']
      },
      relativeDateOptions: [
        'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month',
        'last_7_days', 'last_30_days', 'last_90_days'
      ]
    })

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// HELPER FUNCTIONS
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

async function executeEntityQuery(
  entity: string,
  where: any,
  orderBy: any,
  pagination?: { page: number; limit: number }
) {
  const paginationQuery = pagination ? buildPaginationQuery(pagination.page, pagination.limit) : {}

  switch (entity) {
    case 'companies':
      const [companies, companiesTotal] = await Promise.all([
        prisma.company.findMany({
          where,
          orderBy,
          ...paginationQuery,
          include: {
            contacts: {
              where: { isDeleted: false },
              take: 3,
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isPrimary: true
              }
            },
            deals: {
              where: { isDeleted: false },
              take: 3,
              select: {
                id: true,
                title: true,
                value: true,
                status: true,
                stage: { select: { name: true, color: true } }
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
        }),
        prisma.company.count({ where })
      ])

      return pagination
        ? paginatedResponse(companies, pagination.page, pagination.limit, companiesTotal)
        : successResponse(companies)

    case 'contacts':
      const [contacts, contactsTotal] = await Promise.all([
        prisma.contact.findMany({
          where,
          orderBy,
          ...paginationQuery,
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
              take: 3,
              select: {
                id: true,
                title: true,
                value: true,
                status: true,
                stage: { select: { name: true, color: true } }
              }
            },
            _count: {
              select: {
                deals: { where: { isDeleted: false } },
                activities: { where: { isDeleted: false } }
              }
            }
          }
        }),
        prisma.contact.count({ where })
      ])

      return pagination
        ? paginatedResponse(contacts, pagination.page, pagination.limit, contactsTotal)
        : successResponse(contacts)

    case 'deals':
      const [deals, dealsTotal] = await Promise.all([
        prisma.deal.findMany({
          where,
          orderBy,
          ...paginationQuery,
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
            stage: {
              select: {
                id: true,
                name: true,
                color: true,
                probability: true,
                stageType: true
              }
            },
            _count: {
              select: {
                activities: { where: { isDeleted: false } }
              }
            }
          }
        }),
        prisma.deal.count({ where })
      ])

      return pagination
        ? paginatedResponse(deals, pagination.page, pagination.limit, dealsTotal)
        : successResponse(deals)

    case 'activities':
      const [activities, activitiesTotal] = await Promise.all([
        prisma.activity.findMany({
          where,
          orderBy,
          ...paginationQuery,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                industry: true
              }
            },
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            deal: {
              select: {
                id: true,
                title: true,
                value: true,
                stage: { select: { name: true, color: true } }
              }
            }
          }
        }),
        prisma.activity.count({ where })
      ])

      return pagination
        ? paginatedResponse(activities, pagination.page, pagination.limit, activitiesTotal)
        : successResponse(activities)

    default:
      throw new Error(`Unsupported entity type: ${entity}`)
  }
}

async function getEntityMetadata(entity?: string) {
  const metadata: any = {}

  if (!entity || entity === 'companies') {
    metadata.companies = {
      industries: await getUniqueValues('company', 'industry'),
      sizes: ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
      statuses: ['ACTIVE', 'PROSPECT', 'CUSTOMER', 'INACTIVE', 'CHURNED'],
      cities: await getUniqueValues('company', 'city'),
      states: await getUniqueValues('company', 'state'),
      countries: await getUniqueValues('company', 'country')
    }
  }

  if (!entity || entity === 'contacts') {
    metadata.contacts = {
      jobTitles: await getUniqueValues('contact', 'jobTitle'),
      departments: await getUniqueValues('contact', 'department'),
      statuses: ['ACTIVE', 'INACTIVE', 'BOUNCED', 'UNSUBSCRIBED', 'DO_NOT_CONTACT'],
      preferredContacts: ['EMAIL', 'PHONE', 'MOBILE', 'LINKEDIN', 'IN_PERSON']
    }
  }

  if (!entity || entity === 'deals') {
    metadata.deals = {
      stages: await prisma.pipelineStage.findMany({
        where: { isActive: true },
        select: { id: true, name: true, color: true, position: true },
        orderBy: { position: 'asc' }
      }),
      statuses: ['OPEN', 'WON', 'LOST', 'POSTPONED', 'CANCELLED'],
      priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      sources: await getUniqueValues('deal', 'source')
    }
  }

  if (!entity || entity === 'activities') {
    metadata.activities = {
      types: ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'PROPOSAL', 'CONTRACT', 'DEMO', 'FOLLOW_UP'],
      statuses: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'],
      priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    }
  }

  return metadata
}

async function getUniqueValues(table: string, field: string, limit = 50) {
  try {
    const tableName = table === 'company' ? 'companies' :
                      table === 'contact' ? 'contacts' :
                      table === 'deal' ? 'deals' : 'activities'

    const results = await (prisma as any)[table].findMany({
      where: {
        isDeleted: false,
        [field]: { not: null }
      },
      select: { [field]: true },
      distinct: [field],
      take: limit,
      orderBy: { [field]: 'asc' }
    })

    return results.map((item: any) => item[field]).filter(Boolean)
  } catch (error) {
    console.warn(`Error getting unique values for ${table}.${field}:`, error)
    return []
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