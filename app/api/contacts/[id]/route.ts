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
  updateContactSchema,
  idParamSchema,
  UpdateContactInput,
  IdParam
} from '@/lib/validations'

// ============================================================================
// GET /api/contacts/[id] - Get contact details with full relationships
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger(`GET /api/contacts/${params.id}`)

  try {
    const { id }: IdParam = validatePathParams(params, idParamSchema)

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            status: true,
            companySize: true
          }
        },
        deals: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          include: {
            stage: {
              select: {
                id: true,
                name: true,
                color: true,
                probability: true,
                stageType: true
              }
            }
          }
        },
        activities: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 20, // More activities in detail view
          include: {
            deal: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        customFields: {
          orderBy: { fieldName: 'asc' }
        },
        _count: {
          select: {
            deals: { where: { isDeleted: false } },
            activities: { where: { isDeleted: false } }
          }
        }
      }
    })

    if (!contact) {
      throw new NotFoundError('Contact', id)
    }

    return successResponse(contact)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// PUT /api/contacts/[id] - Update contact
// ============================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger(`PUT /api/contacts/${params.id}`)

  try {
    const { id }: IdParam = validatePathParams(params, idParamSchema)
    const body: UpdateContactInput = await validateRequestBody(request, updateContactSchema)

    // Check if contact exists
    const existingContact = await prisma.contact.findFirst({
      where: { id, isDeleted: false }
    })

    if (!existingContact) {
      throw new NotFoundError('Contact', id)
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

    // Handle primary contact logic
    if (body.isPrimary && body.companyId) {
      // Remove primary status from other contacts in the same company
      await prisma.contact.updateMany({
        where: {
          companyId: body.companyId,
          isPrimary: true,
          isDeleted: false,
          id: { not: id } // Exclude current contact
        },
        data: { isPrimary: false }
      })
    }

    // Update the contact
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...body,
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
        deals: {
          where: { isDeleted: false },
          include: {
            stage: {
              select: {
                id: true,
                name: true,
                color: true,
                probability: true
              }
            }
          }
        },
        activities: {
          where: { isDeleted: false },
          take: 10,
          orderBy: { createdAt: 'desc' }
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

// ============================================================================
// DELETE /api/contacts/[id] - Soft delete contact
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger(`DELETE /api/contacts/${params.id}`)

  try {
    const { id }: IdParam = validatePathParams(params, idParamSchema)

    // Check if contact exists
    const existingContact = await prisma.contact.findFirst({
      where: { id, isDeleted: false }
    })

    if (!existingContact) {
      throw new NotFoundError('Contact', id)
    }

    // Soft delete the contact
    await prisma.contact.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return successResponse({ message: 'Contact deleted successfully' })

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// PATCH /api/contacts/[id] - Partial update contact
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // PATCH uses the same logic as PUT for this simple CRM
  return PUT(request, { params })
}

// Handle unsupported methods
export async function POST() {
  return methodNotAllowed(['GET', 'PUT', 'PATCH', 'DELETE'])
}