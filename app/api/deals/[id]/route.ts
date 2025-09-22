import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateRequestBody,
  validatePathParams,
  NotFoundError
} from '@/lib/api-utils'
import {
  updateDealSchema,
  idParamSchema,
  UpdateDealInput,
  IdParam
} from '@/lib/validations'

// ============================================================================
// GET /api/deals/[id] - Get deal details with full context
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger(`GET /api/deals/${params.id}`)

  try {
    const { id }: IdParam = validatePathParams(params, idParamSchema)

    const deal = await prisma.deal.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        company: {
          include: {
            contacts: {
              where: { isDeleted: false },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
                isPrimary: true
              }
            }
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobilePhone: true,
            jobTitle: true,
            department: true,
            isPrimary: true,
            preferredContact: true,
            linkedinUrl: true
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
          orderBy: { createdAt: 'desc' },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        customFields: {
          orderBy: { fieldName: 'asc' }
        },
        _count: {
          select: {
            activities: { where: { isDeleted: false } }
          }
        }
      }
    })

    if (!deal) {
      throw new NotFoundError('Deal', id)
    }

    return successResponse(deal)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// PUT /api/deals/[id] - Update deal and handle stage progression
// ============================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger(`PUT /api/deals/${params.id}`)

  try {
    const { id }: IdParam = validatePathParams(params, idParamSchema)
    const body: UpdateDealInput = await validateRequestBody(request, updateDealSchema)

    // Check if deal exists
    const existingDeal = await prisma.deal.findFirst({
      where: { id, isDeleted: false },
      include: {
        stage: true
      }
    })

    if (!existingDeal) {
      throw new NotFoundError('Deal', id)
    }

    // Validate stage exists if provided
    if (body.stageId) {
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

      // Update probability from stage if not explicitly provided
      if (body.probability === undefined) {
        body.probability = stage.probability
      }
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

    // Validate contact exists and belongs to company if provided
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

      // Check company-contact relationship
      const finalCompanyId = body.companyId || existingDeal.companyId
      if (finalCompanyId && contact.companyId !== finalCompanyId) {
        return handleError({
          name: 'ValidationError',
          message: 'Contact does not belong to the specified company',
          statusCode: 400
        })
      }
    }

    // Handle status changes for closed deals
    const updateData = { ...body }
    if (body.status === 'WON' || body.status === 'LOST') {
      updateData.actualCloseDate = new Date()
    } else if (body.status === 'OPEN' && existingDeal.actualCloseDate) {
      // Reopening a closed deal
      updateData.actualCloseDate = null
    }

    // Convert expectedCloseDate string to Date if provided
    if (updateData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(updateData.expectedCloseDate)
    }

    // Update the deal
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
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
          take: 10,
          orderBy: { createdAt: 'desc' }
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

// ============================================================================
// DELETE /api/deals/[id] - Soft delete deal
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger(`DELETE /api/deals/${params.id}`)

  try {
    const { id }: IdParam = validatePathParams(params, idParamSchema)

    // Check if deal exists
    const existingDeal = await prisma.deal.findFirst({
      where: { id, isDeleted: false }
    })

    if (!existingDeal) {
      throw new NotFoundError('Deal', id)
    }

    // Soft delete the deal
    await prisma.deal.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return successResponse({ message: 'Deal deleted successfully' })

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// PATCH /api/deals/[id] - Partial update deal (same as PUT for simplicity)
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params })
}

// Handle unsupported methods
export async function POST() {
  return methodNotAllowed(['GET', 'PUT', 'PATCH', 'DELETE'])
}