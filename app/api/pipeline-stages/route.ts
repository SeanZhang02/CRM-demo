import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateRequestBody
} from '@/lib/api-utils'
import {
  createPipelineStageSchema,
  CreatePipelineStageInput
} from '@/lib/validations'

// ============================================================================
// GET /api/pipeline-stages - List all pipeline stages for configuration
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/pipeline-stages')

  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build filter for active/inactive stages
    const where = includeInactive ? {} : { isActive: true }

    // Get all pipeline stages with deal counts
    const stages = await prisma.pipelineStage.findMany({
      where,
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: {
            deals: {
              where: { isDeleted: false }
            }
          }
        }
      }
    })

    // Calculate pipeline analytics
    const analytics = await Promise.all(
      stages.map(async (stage) => {
        const dealsInStage = await prisma.deal.findMany({
          where: {
            stageId: stage.id,
            isDeleted: false,
            status: 'OPEN'
          },
          select: {
            value: true
          }
        })

        const totalValue = dealsInStage.reduce((sum, deal) => sum + (deal.value || 0), 0)
        const avgValue = dealsInStage.length > 0 ? totalValue / dealsInStage.length : 0

        return {
          ...stage,
          analytics: {
            totalDeals: dealsInStage.length,
            totalValue,
            averageValue: avgValue
          }
        }
      })
    )

    return successResponse(analytics)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/pipeline-stages - Create a new pipeline stage
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/pipeline-stages')

  try {
    const body: CreatePipelineStageInput = await validateRequestBody(request, createPipelineStageSchema)

    // Check if position is already taken
    const existingStage = await prisma.pipelineStage.findFirst({
      where: { position: body.position }
    })

    if (existingStage) {
      // Shift existing stages to make room
      await prisma.pipelineStage.updateMany({
        where: {
          position: { gte: body.position }
        },
        data: {
          position: { increment: 1 }
        }
      })
    }

    // Create the new stage
    const stage = await prisma.pipelineStage.create({
      data: {
        ...body,
        // Set organization if multi-tenancy is implemented
        // organizationId: user?.organizationId
      },
      include: {
        _count: {
          select: {
            deals: {
              where: { isDeleted: false }
            }
          }
        }
      }
    })

    return successResponse(stage)

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