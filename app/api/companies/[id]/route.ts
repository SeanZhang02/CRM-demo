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
  updateCompanySchema,
  idParamSchema,
  UpdateCompanyInput,
  IdParam
} from '@/lib/validations'
import { protectedRoute, checkOwnership } from '@/lib/middleware/auth'
import { secureRoute } from '@/lib/middleware/security'

// ============================================================================
// GET /api/companies/[id] - Get a specific company by ID
// ============================================================================
async function handleGetCompany(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return protectedRoute(async (authReq) => {
    const perf = createPerformanceLogger(`GET /api/companies/${params.id}`)

    try {
      const { id }: IdParam = validatePathParams(params, idParamSchema)

      const company = await prisma.company.findFirst({
        where: {
          id,
          isDeleted: false,
          ownerId: authReq.user.id // User can only access their own companies
        },
      include: {
        contacts: {
          where: { isDeleted: false, ownerId: authReq.user.id },
          orderBy: [
            { isPrimary: 'desc' },
            { lastName: 'asc' },
            { firstName: 'asc' }
          ],
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
            status: true,
            linkedinUrl: true,
            twitterUrl: true,
            createdAt: true,
            updatedAt: true
          }
        },
        deals: {
          where: { isDeleted: false, ownerId: authReq.user.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            value: true,
            currency: true,
            expectedCloseDate: true,
            actualCloseDate: true,
            probability: true,
            status: true,
            priority: true,
            source: true,
            createdAt: true,
            updatedAt: true,
            stage: {
              select: {
                id: true,
                name: true,
                color: true,
                position: true,
                probability: true
              }
            },
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        activities: {
          where: { isDeleted: false, ownerId: authReq.user.id },
          orderBy: { createdAt: 'desc' },
          take: 10, // Recent activities
          select: {
            id: true,
            type: true,
            subject: true,
            description: true,
            dueDate: true,
            completedAt: true,
            status: true,
            priority: true,
            duration: true,
            location: true,
            meetingUrl: true,
            createdAt: true,
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            deal: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        _count: {
          select: {
            contacts: { where: { isDeleted: false, ownerId: authReq.user.id } },
            deals: { where: { isDeleted: false, ownerId: authReq.user.id } },
            activities: { where: { isDeleted: false, ownerId: authReq.user.id } }
          }
        }
      }
    })

    if (!company) {
      throw new NotFoundError('Company', id)
    }

    return successResponse(company)

    } catch (error) {
      return handleError(error)
    } finally {
      perf.end()
    }
  })(request)
}

// ============================================================================
// PUT /api/companies/[id] - Update a specific company
// ============================================================================
async function handleUpdateCompany(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return protectedRoute(async (authReq) => {
    const perf = createPerformanceLogger(`PUT /api/companies/${params.id}`)

    try {
      const { id }: IdParam = validatePathParams(params, idParamSchema)
      const body: UpdateCompanyInput = await validateRequestBody(request, updateCompanySchema)

      // Check if company exists and user owns it
      const existingCompany = await prisma.company.findFirst({
        where: {
          id,
          isDeleted: false,
          ownerId: authReq.user.id
        }
      })

      if (!existingCompany) {
        throw new NotFoundError('Company', id)
      }

      // Update the company
      const company = await prisma.company.update({
        where: { id },
        data: {
          ...body,
          updatedAt: new Date()
        },
        include: {
          contacts: {
            where: { isDeleted: false, ownerId: authReq.user.id },
            orderBy: [
              { isPrimary: 'desc' },
              { lastName: 'asc' }
            ],
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              jobTitle: true,
              isPrimary: true
            }
          },
          deals: {
            where: { isDeleted: false, ownerId: authReq.user.id },
            orderBy: { expectedCloseDate: 'asc' },
            select: {
              id: true,
              title: true,
              value: true,
              status: true,
              expectedCloseDate: true
            }
          },
          _count: {
            select: {
              contacts: { where: { isDeleted: false, ownerId: authReq.user.id } },
              deals: { where: { isDeleted: false, ownerId: authReq.user.id } },
              activities: { where: { isDeleted: false, ownerId: authReq.user.id } }
            }
          }
        }
      })

      return successResponse(company)

    } catch (error) {
      return handleError(error)
    } finally {
      perf.end()
    }
  })(request)
}

// ============================================================================
// DELETE /api/companies/[id] - Soft delete a company
// ============================================================================
async function handleDeleteCompany(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return protectedRoute(async (authReq) => {
    const perf = createPerformanceLogger(`DELETE /api/companies/${params.id}`)

    try {
      const { id }: IdParam = validatePathParams(params, idParamSchema)

      // Check if company exists and user owns it
      const existingCompany = await prisma.company.findFirst({
        where: {
          id,
          isDeleted: false,
          ownerId: authReq.user.id
        },
        include: {
          _count: {
            select: {
              contacts: { where: { isDeleted: false, ownerId: authReq.user.id } },
              deals: { where: { isDeleted: false, status: 'OPEN', ownerId: authReq.user.id } },
              activities: { where: { isDeleted: false, status: { in: ['PENDING', 'IN_PROGRESS'] }, ownerId: authReq.user.id } }
            }
          }
        }
      })

      if (!existingCompany) {
        throw new NotFoundError('Company', id)
      }

      // Soft delete the company and related records
      const result = await prisma.$transaction(async (tx) => {
        // Soft delete the company
        const deletedCompany = await tx.company.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Optionally soft delete related contacts (business decision)
        // await tx.contact.updateMany({
        //   where: { companyId: id, isDeleted: false, ownerId: authReq.user.id },
        //   data: { isDeleted: true, deletedAt: new Date() }
        // })

        // Optionally soft delete related deals (business decision)
        // await tx.deal.updateMany({
        //   where: { companyId: id, isDeleted: false, ownerId: authReq.user.id },
        //   data: { isDeleted: true, deletedAt: new Date() }
        // })

        return deletedCompany
      })

      return successResponse({
        id: result.id,
        name: result.name,
        deletedAt: result.deletedAt,
        message: 'Company deleted successfully',
        relatedRecords: {
          contacts: existingCompany._count.contacts,
          openDeals: existingCompany._count.deals,
          activeActivities: existingCompany._count.activities
        }
      })

    } catch (error) {
      return handleError(error)
    } finally {
      perf.end()
    }
  })(request)
}

// Export protected route handlers
export const GET = secureRoute(handleGetCompany)
export const PUT = secureRoute(handleUpdateCompany)
export const DELETE = secureRoute(handleDeleteCompany)

// Handle unsupported methods
export async function POST() {
  return methodNotAllowed(['GET', 'PUT', 'DELETE'])
}

export async function PATCH() {
  return methodNotAllowed(['GET', 'PUT', 'DELETE'])
}