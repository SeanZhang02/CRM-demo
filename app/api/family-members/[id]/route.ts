import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateRequestBody,
} from '@/lib/api-utils'
import {
  updateFamilyMemberSchema,
  UpdateFamilyMemberInput,
  familyMemberValidationRules
} from '@/lib/validations'

interface RouteParams {
  params: {
    id: string
  }
}

// ============================================================================
// GET /api/family-members/[id] - Get family member details
// ============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`GET /api/family-members/${params.id}`)

  try {
    const { id } = params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({
        error: 'Invalid family member ID format'
      }, { status: 400 })
    }

    // Get comprehensive family member data
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        // Patient information
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true,
            patientStatus: true,
            riskLevel: true,
            dateOfBirth: true,
            location: {
              select: {
                id: true,
                name: true,
                shortName: true
              }
            },
            currentProvider: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },

        // Service episodes where family member was involved
        serviceEpisodes: {
          where: { isDeleted: false },
          include: {
            provider: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { scheduledDate: 'desc' },
          take: 10
        },

        // Custom fields
        customFields: {
          select: {
            id: true,
            fieldName: true,
            fieldValue: true,
            fieldType: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!familyMember) {
      return Response.json({
        error: 'Family member not found'
      }, { status: 404 })
    }

    // Check if this family member is referenced as emergency contact
    const emergencyContactFor = await prisma.patient.findMany({
      where: {
        emergencyContactId: id,
        isDeleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        medicalRecordNumber: true
      }
    })

    // Enhance family member data with calculated fields
    const enhancedFamilyMember = {
      ...familyMember,

      // Contact validation status
      contactValidation: {
        hasPhoneNumber: !!(familyMember.phone || familyMember.mobilePhone),
        hasEmailAddress: !!familyMember.email,
        isContactable: familyMember.status === 'ACTIVE' && familyMember.status !== 'DO_NOT_CONTACT',
        emergencyContactCompliant: familyMemberValidationRules.validateEmergencyContact(familyMember),
        preferredMethodAvailable: (() => {
          switch (familyMember.preferredContactMethod) {
            case 'PHONE': return !!familyMember.phone
            case 'MOBILE': return !!familyMember.mobilePhone
            case 'EMAIL': return !!familyMember.email
            default: return true
          }
        })()
      },

      // Relationship context
      relationshipContext: {
        isEmergencyContactFor: emergencyContactFor,
        canAccessPatientInfo: familyMember.canAccessInformation,
        hasRecentInvolvement: familyMember.serviceEpisodes.length > 0,
        lastInvolvement: familyMember.serviceEpisodes[0] ? {
          date: familyMember.serviceEpisodes[0].scheduledDate,
          sessionType: familyMember.serviceEpisodes[0].sessionType,
          provider: familyMember.serviceEpisodes[0].provider?.user?.name || 'Unknown Provider'
        } : null
      },

      // Patient context (if associated with a patient)
      patientContext: familyMember.patient ? {
        ...familyMember.patient,
        isMinor: familyMember.patient.dateOfBirth ?
          new Date().getFullYear() - new Date(familyMember.patient.dateOfBirth).getFullYear() < 18 : false,
        needsGuardianConsent: familyMember.patient.dateOfBirth ?
          new Date().getFullYear() - new Date(familyMember.patient.dateOfBirth).getFullYear() < 18 &&
          ['PARENT', 'GUARDIAN'].includes(familyMember.relationshipType) : false
      } : null,

      // Activity summary
      activitySummary: {
        totalInvolvements: familyMember.serviceEpisodes.length,
        recentInvolvements: familyMember.serviceEpisodes.filter(episode =>
          episode.scheduledDate && new Date(episode.scheduledDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        lastContactDate: familyMember.serviceEpisodes[0]?.scheduledDate || familyMember.updatedAt
      }
    }

    // TODO: Create audit log entry for family member access
    // await createAuditLog({
    //   action: 'READ',
    //   tableName: 'family_members',
    //   recordId: id,
    //   userId: session.user.id,
    //   patientId: familyMember.patientId,
    //   accessType: 'TREATMENT_RELATED'
    // })

    return successResponse(enhancedFamilyMember, 'Family member retrieved successfully')

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// PUT /api/family-members/[id] - Update family member with validation
// ============================================================================
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`PUT /api/family-members/${params.id}`)

  try {
    const { id } = params
    const body = await request.json()

    // Include ID in validation data
    const validatedData: UpdateFamilyMemberInput = validateRequestBody(
      { ...body, id },
      updateFamilyMemberSchema
    )

    // Check if family member exists and is not deleted
    const existingFamilyMember = await prisma.familyMember.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        patient: {
          select: {
            id: true,
            dateOfBirth: true
          }
        }
      }
    })

    if (!existingFamilyMember) {
      return Response.json({
        error: 'Family member not found'
      }, { status: 404 })
    }

    // Healthcare business rule validations
    if (validatedData.phone || validatedData.mobilePhone || validatedData.email) {
      familyMemberValidationRules.validateContactMethods({
        ...existingFamilyMember,
        ...validatedData
      })
    }

    if (validatedData.isEmergencyContact !== undefined) {
      familyMemberValidationRules.validateEmergencyContact({
        ...existingFamilyMember,
        ...validatedData
      })
    }

    if (validatedData.canAccessInformation !== undefined || validatedData.status) {
      familyMemberValidationRules.validateInformationAccess({
        ...existingFamilyMember,
        ...validatedData
      })
    }

    // Validate relationship type changes
    if (validatedData.relationshipType && existingFamilyMember.patient?.dateOfBirth) {
      const patientAge = new Date().getFullYear() - new Date(existingFamilyMember.patient.dateOfBirth).getFullYear()
      familyMemberValidationRules.validateRelationshipType(validatedData, patientAge)
    }

    // Handle emergency contact status changes
    if (validatedData.isEmergencyContact !== undefined && existingFamilyMember.patientId) {
      if (validatedData.isEmergencyContact && !existingFamilyMember.isEmergencyContact) {
        // Adding emergency contact status
        const emergencyContactCount = await prisma.familyMember.count({
          where: {
            patientId: existingFamilyMember.patientId,
            isEmergencyContact: true,
            id: { not: id },
            isDeleted: false
          }
        })

        if (emergencyContactCount >= 3) {
          return Response.json({
            error: 'Validation Error',
            details: 'Patient already has maximum number of emergency contacts (3)'
          }, { status: 400 })
        }
      }
    }

    // Handle primary contact status changes
    if (validatedData.isPrimaryContact && !existingFamilyMember.isPrimaryContact && existingFamilyMember.patientId) {
      const existingPrimary = await prisma.familyMember.findFirst({
        where: {
          patientId: existingFamilyMember.patientId,
          isPrimaryContact: true,
          id: { not: id },
          isDeleted: false
        }
      })

      if (existingPrimary) {
        return Response.json({
          error: 'Validation Error',
          details: 'Patient already has a primary contact. Please update the existing primary contact first.'
        }, { status: 400 })
      }
    }

    // Remove ID from data before update
    const { id: _id, ...updateData } = validatedData

    // Update family member record
    const updatedFamilyMember = await prisma.familyMember.update({
      where: { id },
      data: {
        ...updateData,
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

    // Update patient's emergency contact reference if needed
    if (validatedData.isEmergencyContact !== undefined && existingFamilyMember.patientId) {
      if (validatedData.isEmergencyContact && !existingFamilyMember.isEmergencyContact) {
        // Set as emergency contact
        await prisma.patient.update({
          where: { id: existingFamilyMember.patientId },
          data: { emergencyContactId: id }
        })
      } else if (!validatedData.isEmergencyContact && existingFamilyMember.isEmergencyContact) {
        // Remove emergency contact reference if this was the current emergency contact
        const patient = await prisma.patient.findFirst({
          where: { emergencyContactId: id }
        })

        if (patient) {
          // Find another emergency contact to replace this one
          const alternateEmergencyContact = await prisma.familyMember.findFirst({
            where: {
              patientId: existingFamilyMember.patientId,
              isEmergencyContact: true,
              id: { not: id },
              isDeleted: false
            }
          })

          await prisma.patient.update({
            where: { id: existingFamilyMember.patientId },
            data: { emergencyContactId: alternateEmergencyContact?.id || null }
          })
        }
      }
    }

    // TODO: Create audit log entry for family member update
    // await createAuditLog({
    //   action: 'UPDATE',
    //   tableName: 'family_members',
    //   recordId: id,
    //   userId: session.user.id,
    //   patientId: existingFamilyMember.patientId,
    //   oldValues: JSON.stringify(existingFamilyMember),
    //   newValues: JSON.stringify(updatedFamilyMember)
    // })

    return successResponse(updatedFamilyMember, 'Family member updated successfully')

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// DELETE /api/family-members/[id] - Soft delete family member
// ============================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`DELETE /api/family-members/${params.id}`)

  try {
    const { id } = params

    // Check if family member exists and is not already deleted
    const existingFamilyMember = await prisma.familyMember.findFirst({
      where: {
        id,
        isDeleted: false
      }
    })

    if (!existingFamilyMember) {
      return Response.json({
        error: 'Family member not found'
      }, { status: 404 })
    }

    // Check if this family member is currently the emergency contact for any patient
    const patientsWithThisEmergencyContact = await prisma.patient.findMany({
      where: {
        emergencyContactId: id,
        isDeleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        medicalRecordNumber: true
      }
    })

    if (patientsWithThisEmergencyContact.length > 0) {
      return Response.json({
        error: 'Cannot delete family member',
        details: 'This family member is the emergency contact for one or more patients. Please assign a different emergency contact before deletion.',
        affectedPatients: patientsWithThisEmergencyContact
      }, { status: 400 })
    }

    // Check for recent service episode involvement
    const recentInvolvement = await prisma.serviceEpisode.findFirst({
      where: {
        familyMemberId: id,
        scheduledDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        isDeleted: false
      }
    })

    if (recentInvolvement) {
      return Response.json({
        error: 'Cannot delete family member',
        details: 'This family member has been involved in recent treatment sessions. Please wait 30 days after last involvement before deletion.'
      }, { status: 400 })
    }

    // Soft delete family member
    const deletedFamilyMember = await prisma.familyMember.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // TODO: Create audit log entry for family member deletion
    // await createAuditLog({
    //   action: 'DELETE',
    //   tableName: 'family_members',
    //   recordId: id,
    //   userId: session.user.id,
    //   patientId: existingFamilyMember.patientId,
    //   oldValues: JSON.stringify(existingFamilyMember)
    // })

    return successResponse(
      { id: deletedFamilyMember.id, deletedAt: deletedFamilyMember.deletedAt },
      'Family member deleted successfully'
    )

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// Handle unsupported methods
export async function PATCH() {
  return methodNotAllowed(['GET', 'PUT', 'DELETE'])
}