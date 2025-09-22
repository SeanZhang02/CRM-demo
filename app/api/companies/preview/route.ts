import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateRequestBody,
} from '@/lib/api-utils'
import { z } from 'zod'
import { FilterConfig } from '@/lib/types/filters'

// ============================================================================
// POST /api/companies/preview - Preview filter results for companies
// ============================================================================

const previewRequestSchema = z.object({
  filters: z.object({
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
})

export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/companies/preview')

  try {
    const body = await validateRequestBody(request, previewRequestSchema)
    const { filters } = body

    // Convert filter config to Prisma where clause
    const whereClause = await convertFiltersToWhereClause(filters)

    // Get count of matching records
    const count = await prisma.company.count({
      where: {
        isDeleted: false,
        ...whereClause,
      },
    })

    // Get sample of matching records (max 10)
    const sample = await prisma.company.findMany({
      where: {
        isDeleted: false,
        ...whereClause,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        companySize: true,
        status: true,
        _count: {
          select: {
            contacts: true,
            deals: true,
            activities: true,
          },
        },
      },
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
    })

    perf.end(`Found ${count} companies matching filters`)

    return successResponse({
      count,
      sample,
    })

  } catch (error) {
    return handleError(error, 'GET /api/companies/preview')
  }
}

export async function GET() {
  return methodNotAllowed(['POST'])
}

// ============================================================================
// Helper Functions
// ============================================================================

async function convertFiltersToWhereClause(config: FilterConfig): Promise<any> {
  if (!config.groups || config.groups.length === 0) {
    return {}
  }

  const groupClauses = await Promise.all(
    config.groups.map(group => convertGroupToWhereClause(group))
  )

  // Filter out empty clauses
  const validClauses = groupClauses.filter(clause =>
    clause && Object.keys(clause).length > 0
  )

  if (validClauses.length === 0) {
    return {}
  }

  if (validClauses.length === 1) {
    return validClauses[0]
  }

  // Combine groups with appropriate logical operator
  // For simplicity, we'll use OR between groups
  return {
    OR: validClauses,
  }
}

async function convertGroupToWhereClause(group: any): Promise<any> {
  if (!group.conditions || group.conditions.length === 0) {
    return {}
  }

  const conditionClauses = await Promise.all(
    group.conditions
      .filter((condition: any) => condition.field && condition.operator)
      .map((condition: any) => convertConditionToWhereClause(condition))
  )

  // Filter out empty clauses
  const validClauses = conditionClauses.filter(clause =>
    clause && Object.keys(clause).length > 0
  )

  if (validClauses.length === 0) {
    return {}
  }

  if (validClauses.length === 1) {
    return validClauses[0]
  }

  // Determine logical operator for conditions within group
  const useAnd = group.conditions[0]?.logicalOperator === 'AND' ||
                 !group.conditions[0]?.logicalOperator

  return useAnd ? { AND: validClauses } : { OR: validClauses }
}

async function convertConditionToWhereClause(condition: any): Promise<any> {
  const { field, operator, value } = condition

  // Handle nested fields (e.g., '_count.contacts')
  const fieldPath = field.split('.')

  switch (operator) {
    case 'equals':
      return buildFieldClause(fieldPath, { equals: value })

    case 'not_equals':
      return buildFieldClause(fieldPath, { not: value })

    case 'contains':
      return buildFieldClause(fieldPath, { contains: value, mode: 'insensitive' })

    case 'not_contains':
      return buildFieldClause(fieldPath, { not: { contains: value, mode: 'insensitive' } })

    case 'starts_with':
      return buildFieldClause(fieldPath, { startsWith: value, mode: 'insensitive' })

    case 'ends_with':
      return buildFieldClause(fieldPath, { endsWith: value, mode: 'insensitive' })

    case 'is_empty':
      return buildFieldClause(fieldPath, { OR: [{ equals: null }, { equals: '' }] })

    case 'is_not_empty':
      return buildFieldClause(fieldPath, { AND: [{ not: null }, { not: '' }] })

    case 'greater_than':
      return buildFieldClause(fieldPath, { gt: parseNumber(value) })

    case 'less_than':
      return buildFieldClause(fieldPath, { lt: parseNumber(value) })

    case 'greater_than_or_equal':
      return buildFieldClause(fieldPath, { gte: parseNumber(value) })

    case 'less_than_or_equal':
      return buildFieldClause(fieldPath, { lte: parseNumber(value) })

    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return buildFieldClause(fieldPath, {
          gte: parseNumber(value[0]),
          lte: parseNumber(value[1])
        })
      }
      return {}

    case 'before':
      return buildFieldClause(fieldPath, { lt: new Date(value) })

    case 'after':
      return buildFieldClause(fieldPath, { gt: new Date(value) })

    case 'on_or_before':
      return buildFieldClause(fieldPath, { lte: new Date(value) })

    case 'on_or_after':
      return buildFieldClause(fieldPath, { gte: new Date(value) })

    case 'date_between':
      if (Array.isArray(value) && value.length === 2) {
        return buildFieldClause(fieldPath, {
          gte: new Date(value[0]),
          lte: new Date(value[1])
        })
      }
      return {}

    case 'is_today':
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      return buildFieldClause(fieldPath, { gte: startOfDay, lt: endOfDay })

    case 'is_true':
      return buildFieldClause(fieldPath, { equals: true })

    case 'is_false':
      return buildFieldClause(fieldPath, { equals: false })

    default:
      console.warn(`Unsupported filter operator: ${operator}`)
      return {}
  }
}

function buildFieldClause(fieldPath: string[], condition: any): any {
  if (fieldPath.length === 1) {
    return { [fieldPath[0]]: condition }
  }

  // Handle nested fields like '_count.contacts'
  if (fieldPath[0] === '_count') {
    return {
      [fieldPath[1]]: condition
    }
  }

  // For other nested fields, build nested object
  let result = condition
  for (let i = fieldPath.length - 1; i >= 0; i--) {
    result = { [fieldPath[i]]: result }
  }
  return result
}

function parseNumber(value: any): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(parsed) ? 0 : parsed
}