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
  buildPaginationQuery
} from '@/lib/api-utils'
import { z } from 'zod'

// ============================================================================
// SAVED FILTERS VALIDATION SCHEMAS
// ============================================================================

const createSavedFilterSchema = z.object({
  name: z.string().min(1, 'Filter name is required').max(100),
  config: z.object({
    groups: z.array(z.object({
      id: z.string(),
      conditions: z.array(z.object({
        id: z.string(),
        field: z.string(),
        operator: z.string(),
        value: z.any().optional(),
        logicalOperator: z.enum(['AND', 'OR']).optional(),
      })),
      logicalOperator: z.enum(['AND', 'OR']).optional(),
    })),
    name: z.string().optional(),
    isPublic: z.boolean().optional(),
  }),
  isPublic: z.boolean().default(false),
  entity: z.string().min(1, 'Entity type is required'),
})

const updateSavedFilterSchema = createSavedFilterSchema.partial()

const savedFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  entityType: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

type CreateSavedFilterInput = z.infer<typeof createSavedFilterSchema>
type UpdateSavedFilterInput = z.infer<typeof updateSavedFilterSchema>
type SavedFilterQueryInput = z.infer<typeof savedFilterQuerySchema>

// ============================================================================
// GET /api/saved-filters - List saved filters with search and filtering
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/saved-filters')

  try {
    const { searchParams } = new URL(request.url)
    const query: SavedFilterQueryInput = validateQueryParams(searchParams, savedFilterQuerySchema)

    // Build filters for saved filters query
    const where: any = {
      // TODO: Add user ownership filter when auth is implemented
      // ownerId: user?.id
    }

    // Entity filter
    if (query.entityType) {
      // Convert entityType string to enum value
      const entityMap: Record<string, string> = {
        'companies': 'COMPANIES',
        'contacts': 'CONTACTS',
        'deals': 'DEALS',
        'activities': 'ACTIVITIES'
      }
      where.entity = entityMap[query.entityType.toLowerCase()] || query.entityType.toUpperCase()
    }

    // Public/private filter
    if (query.isPublic !== undefined) {
      where.isPublic = query.isPublic
    }

    // Search in name
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' }
    }

    // Get total count
    const total = await prisma.savedFilter.count({ where })

    // Get paginated results
    const savedFilters = await prisma.savedFilter.findMany({
      where,
      ...buildPaginationQuery(query.page, query.limit),
      orderBy: [
        { useCount: 'desc' },
        { updatedAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        filterConfig: true,
        isPublic: true,
        entity: true,
        useCount: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return paginatedResponse(savedFilters, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/saved-filters - Create a new saved filter
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/saved-filters')

  try {
    const body: CreateSavedFilterInput = await validateRequestBody(request, createSavedFilterSchema)

    // Check for duplicate names for the same user and entity
    const existingFilter = await prisma.savedFilter.findFirst({
      where: {
        name: body.name,
        entity: body.entity,
        // TODO: Add user ownership filter when auth is implemented
        // ownerId: user?.id
      }
    })

    if (existingFilter) {
      return handleError({
        name: 'ConflictError',
        message: 'A filter with this name already exists for this entity',
        statusCode: 409
      })
    }

    // Create the saved filter
    const savedFilter = await prisma.savedFilter.create({
      data: {
        name: body.name,
        filterConfig: body.config,
        isPublic: body.isPublic,
        entity: body.entity,
        useCount: 0,
        // TODO: Set owner when auth is implemented
        // ownerId: user?.id
      },
      select: {
        id: true,
        name: true,
        filterConfig: true,
        isPublic: true,
        entity: true,
        useCount: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return successResponse(savedFilter)

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