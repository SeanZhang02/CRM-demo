import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateQueryParams
} from '@/lib/api-utils'
import { z } from 'zod'

// ============================================================================
// GLOBAL SEARCH VALIDATION SCHEMA
// ============================================================================

const globalSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  entities: z.string().optional(), // Comma-separated entity types
  limit: z.coerce.number().int().positive().max(50).default(20),
  includeRelated: z.coerce.boolean().default(false)
})

type GlobalSearchInput = z.infer<typeof globalSearchSchema>

// ============================================================================
// GET /api/search - Global full-text search across all CRM entities
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/search')

  try {
    const { searchParams } = new URL(request.url)
    const query: GlobalSearchInput = validateQueryParams(searchParams, globalSearchSchema)

    // Parse entities filter
    const entityTypes = query.entities
      ? query.entities.split(',').map(e => e.trim().toLowerCase())
      : ['companies', 'contacts', 'deals', 'activities']

    // Validate entity types
    const validEntities = ['companies', 'contacts', 'deals', 'activities']
    const filteredEntities = entityTypes.filter(e => validEntities.includes(e))

    if (filteredEntities.length === 0) {
      return handleError({
        name: 'ValidationError',
        message: 'At least one valid entity type must be specified',
        statusCode: 400
      })
    }

    // Execute searches across all requested entities
    const searchResults = await Promise.all([
      filteredEntities.includes('companies') ? searchCompanies(query.q, query.limit, query.includeRelated) : null,
      filteredEntities.includes('contacts') ? searchContacts(query.q, query.limit, query.includeRelated) : null,
      filteredEntities.includes('deals') ? searchDeals(query.q, query.limit, query.includeRelated) : null,
      filteredEntities.includes('activities') ? searchActivities(query.q, query.limit, query.includeRelated) : null
    ])

    // Combine and structure results
    const results = {
      query: query.q,
      entities: filteredEntities,
      results: {
        companies: searchResults[0] || [],
        contacts: searchResults[1] || [],
        deals: searchResults[2] || [],
        activities: searchResults[3] || []
      },
      totalResults: (searchResults[0]?.length || 0) +
                   (searchResults[1]?.length || 0) +
                   (searchResults[2]?.length || 0) +
                   (searchResults[3]?.length || 0),
      searchTime: perf.end()
    }

    return successResponse(results)

  } catch (error) {
    return handleError(error)
  } finally {
    // Performance logging is handled in the response
  }
}

// ============================================================================
// ENTITY-SPECIFIC SEARCH FUNCTIONS
// ============================================================================

async function searchCompanies(searchTerm: string, limit: number, includeRelated: boolean) {
  const searchConditions = [
    { name: { contains: searchTerm, mode: 'insensitive' as const } },
    { industry: { contains: searchTerm, mode: 'insensitive' as const } },
    { website: { contains: searchTerm, mode: 'insensitive' as const } },
    { city: { contains: searchTerm, mode: 'insensitive' as const } },
    { state: { contains: searchTerm, mode: 'insensitive' as const } },
    { country: { contains: searchTerm, mode: 'insensitive' as const } }
  ]

  const companies = await prisma.company.findMany({
    where: {
      isDeleted: false,
      OR: searchConditions
    },
    take: limit,
    orderBy: [
      // Prioritize exact name matches
      { name: 'asc' }
    ],
    include: {
      contacts: includeRelated ? {
        where: { isDeleted: false },
        take: 3,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isPrimary: true
        }
      } : false,
      deals: includeRelated ? {
        where: { isDeleted: false },
        take: 3,
        select: {
          id: true,
          title: true,
          value: true,
          status: true,
          stage: { select: { name: true, color: true } }
        }
      } : false,
      _count: {
        select: {
          contacts: { where: { isDeleted: false } },
          deals: { where: { isDeleted: false } },
          activities: { where: { isDeleted: false } }
        }
      }
    }
  })

  return companies.map(company => ({
    ...company,
    entityType: 'company',
    relevanceScore: calculateRelevanceScore(searchTerm, [
      company.name,
      company.industry,
      company.website,
      company.city
    ])
  }))
}

async function searchContacts(searchTerm: string, limit: number, includeRelated: boolean) {
  const searchConditions = [
    { firstName: { contains: searchTerm, mode: 'insensitive' as const } },
    { lastName: { contains: searchTerm, mode: 'insensitive' as const } },
    { email: { contains: searchTerm, mode: 'insensitive' as const } },
    { phone: { contains: searchTerm, mode: 'insensitive' as const } },
    { mobilePhone: { contains: searchTerm, mode: 'insensitive' as const } },
    { jobTitle: { contains: searchTerm, mode: 'insensitive' as const } },
    { department: { contains: searchTerm, mode: 'insensitive' as const } }
  ]

  const contacts = await prisma.contact.findMany({
    where: {
      isDeleted: false,
      OR: searchConditions
    },
    take: limit,
    orderBy: [
      // Prioritize exact name matches
      { lastName: 'asc' },
      { firstName: 'asc' }
    ],
    include: {
      company: {
        select: {
          id: true,
          name: true,
          industry: true,
          status: true
        }
      },
      deals: includeRelated ? {
        where: { isDeleted: false },
        take: 3,
        select: {
          id: true,
          title: true,
          value: true,
          status: true,
          stage: { select: { name: true, color: true } }
        }
      } : false,
      _count: {
        select: {
          deals: { where: { isDeleted: false } },
          activities: { where: { isDeleted: false } }
        }
      }
    }
  })

  return contacts.map(contact => ({
    ...contact,
    entityType: 'contact',
    relevanceScore: calculateRelevanceScore(searchTerm, [
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.jobTitle,
      contact.company?.name
    ])
  }))
}

async function searchDeals(searchTerm: string, limit: number, includeRelated: boolean) {
  const searchConditions = [
    { title: { contains: searchTerm, mode: 'insensitive' as const } },
    { description: { contains: searchTerm, mode: 'insensitive' as const } },
    { source: { contains: searchTerm, mode: 'insensitive' as const } }
  ]

  const deals = await prisma.deal.findMany({
    where: {
      isDeleted: false,
      OR: searchConditions
    },
    take: limit,
    orderBy: [
      // Prioritize higher value deals
      { value: 'desc' },
      { title: 'asc' }
    ],
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
      activities: includeRelated ? {
        where: { isDeleted: false },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          subject: true,
          status: true,
          dueDate: true
        }
      } : false,
      _count: {
        select: {
          activities: { where: { isDeleted: false } }
        }
      }
    }
  })

  return deals.map(deal => ({
    ...deal,
    entityType: 'deal',
    relevanceScore: calculateRelevanceScore(searchTerm, [
      deal.title,
      deal.description,
      deal.source,
      deal.company?.name
    ])
  }))
}

async function searchActivities(searchTerm: string, limit: number, includeRelated: boolean) {
  const searchConditions = [
    { subject: { contains: searchTerm, mode: 'insensitive' as const } },
    { description: { contains: searchTerm, mode: 'insensitive' as const } },
    { location: { contains: searchTerm, mode: 'insensitive' as const } }
  ]

  const activities = await prisma.activity.findMany({
    where: {
      isDeleted: false,
      OR: searchConditions
    },
    take: limit,
    orderBy: [
      // Prioritize recent activities
      { createdAt: 'desc' }
    ],
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
          status: true,
          stage: { select: { name: true, color: true } }
        }
      }
    }
  })

  return activities.map(activity => ({
    ...activity,
    entityType: 'activity',
    relevanceScore: calculateRelevanceScore(searchTerm, [
      activity.subject,
      activity.description,
      activity.location,
      activity.company?.name
    ])
  }))
}

// ============================================================================
// RELEVANCE SCORING
// ============================================================================

function calculateRelevanceScore(searchTerm: string, fields: (string | null | undefined)[]): number {
  const term = searchTerm.toLowerCase()
  let score = 0

  for (const field of fields) {
    if (!field) continue

    const fieldValue = field.toLowerCase()

    // Exact match gets highest score
    if (fieldValue === term) {
      score += 100
    }
    // Starts with search term gets high score
    else if (fieldValue.startsWith(term)) {
      score += 50
    }
    // Contains search term gets medium score
    else if (fieldValue.includes(term)) {
      score += 25
    }
    // Fuzzy match (words within the field) gets low score
    else {
      const words = fieldValue.split(/\s+/)
      for (const word of words) {
        if (word.includes(term)) {
          score += 10
          break
        }
      }
    }
  }

  return score
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