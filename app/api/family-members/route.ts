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
  createFamilyMemberSchema,
  familyMemberQuerySchema,
  CreateFamilyMemberInput,
  FamilyMemberQueryInput,
  familyMemberValidationRules
} from '@/lib/validations'

// ============================================================================
// GET /api/family-members - List family members with patient relationship filtering
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/family-members')

  try {
    const { searchParams } = new URL(request.url)
    const query: FamilyMemberQueryInput = validateQueryParams(searchParams, familyMemberQuerySchema)

    // Build search filter for family member fields
    const searchFilter = query.search ? buildSearchFilter(query.search, [
      'firstName',
      'lastName',
      'email',
      'phone',
      'mobilePhone'
    ]) : undefined

    // Build healthcare-specific filters
    const patientFilter = query.patientId ? { patientId: query.patientId } : undefined
    const relationshipFilter = query.relationshipType ? { relationshipType: query.relationshipType } : undefined
    const emergencyFilter = query.isEmergencyContact !== undefined ? { isEmergencyContact: query.isEmergencyContact } : undefined
    const primaryFilter = query.isPrimaryContact !== undefined ? { isPrimaryContact: query.isPrimaryContact } : undefined
    const statusFilter = query.status ? { status: query.status } : undefined

    // Combine all filters
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(patientFilter && patientFilter),
      ...(relationshipFilter && relationshipFilter),
      ...(emergencyFilter && emergencyFilter),
      ...(primaryFilter && primaryFilter),
      ...(statusFilter && statusFilter)
    }

    // Build sort query
    const orderBy = buildSortQuery(query.sortBy, query.sortOrder)

    // Get total count for pagination
    const total = await prisma.familyMember.count({ where })

    // Get paginated results with patient information
    const familyMembers = await prisma.familyMember.findMany({
      where,
      ...buildPaginationQuery(query.page, query.limit),
      orderBy,
      include: {
        // Patient information for context
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true,
            patientStatus: true,
            location: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },

        // Service episodes where family member was involved
        serviceEpisodes: {
          where: { isDeleted: false },
          select: {
            id: true,
            sessionType: true,
            scheduledDate: true,
            status: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 3 // Recent involvement
        },

        // Custom fields
        customFields: {
          select: {
            id: true,
            fieldName: true,
            fieldValue: true,
            fieldType: true
          }
        }
      }
    })

    return paginatedResponse(familyMembers, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/family-members - Create new family member with healthcare validation
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/family-members')

  try {
    const body = await request.json()
    const validatedData: CreateFamilyMemberInput = validateRequestBody(body, createFamilyMemberSchema)

    // Healthcare business rule validations
    familyMemberValidationRules.validateContactMethods(validatedData)
    familyMemberValidationRules.validateEmergencyContact(validatedData)
    familyMemberValidationRules.validateInformationAccess(validatedData)

    // Validate patient exists if provided
    if (validatedData.patientId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: validatedData.patientId,
          isDeleted: false
        },
        select: {
          id: true,
          dateOfBirth: true
        }
      })

      if (!patient) {
        return Response.json({
          error: 'Validation Error',
          details: 'Patient not found or inactive'
        }, { status: 400 })
      }

      // Validate relationship type based on patient age
      if (patient.dateOfBirth) {
        const patientAge = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
        familyMemberValidationRules.validateRelationshipType(validatedData, patientAge)
      }
    }

    // Check for duplicate emergency contacts if this is marked as emergency
    if (validatedData.isEmergencyContact && validatedData.patientId) {
      const emergencyContactCount = await prisma.familyMember.count({
        where: {
          patientId: validatedData.patientId,
          isEmergencyContact: true,
          isDeleted: false
        }
      })

      if (emergencyContactCount >= 3) { // Maximum 3 emergency contacts
        return Response.json({
          error: 'Validation Error',
          details: 'Patient already has maximum number of emergency contacts (3)'
        }, { status: 400 })
      }
    }

    // Check for duplicate primary contacts
    if (validatedData.isPrimaryContact && validatedData.patientId) {
      const existingPrimary = await prisma.familyMember.findFirst({
        where: {
          patientId: validatedData.patientId,
          isPrimaryContact: true,
          isDeleted: false
        }
      })

      if (existingPrimary) {
        return Response.json({
          error: 'Validation Error',
          details: 'Patient already has a primary contact. Please update the existing primary contact or mark this as secondary.'
        }, { status: 400 })
      }
    }

    // Create family member record
    const familyMember = await prisma.familyMember.create({
      data: {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true
          }
        }
      }
    })

    // Update patient's emergency contact reference if this is marked as emergency
    if (familyMember.isEmergencyContact && familyMember.patientId) {
      await prisma.patient.update({
        where: { id: familyMember.patientId },
        data: { emergencyContactId: familyMember.id }
      })
    }

    // TODO: Create audit log entry for family member creation
    // await createAuditLog({
    //   action: 'CREATE',
    //   tableName: 'family_members',
    //   recordId: familyMember.id,
    //   userId: session.user.id,
    //   patientId: familyMember.patientId,
    //   newValues: JSON.stringify(familyMember)
    // })

    return successResponse(familyMember, 'Family member created successfully', 201)

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