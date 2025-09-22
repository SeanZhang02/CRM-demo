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
  updateTreatmentPlanSchema,
  UpdateTreatmentPlanInput
} from '@/lib/validations'

interface RouteParams {
  params: {
    id: string
  }
}

// ============================================================================
// GET /api/treatment-plans/[id] - Get comprehensive treatment plan details
// ============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`GET /api/treatment-plans/${params.id}`)

  try {
    const { id } = params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({
        error: 'Invalid treatment plan ID format'
      }, { status: 400 })
    }

    // Get comprehensive treatment plan data
    const treatmentPlan = await prisma.treatmentPlan.findFirst({
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
            dateOfBirth: true,
            patientStatus: true,
            riskLevel: true,
            primaryDiagnosis: true,
            insuranceProvider: true,
            insurancePolicyNumber: true,
            location: {
              select: {
                id: true,
                name: true,
                shortName: true
              }
            }
          }
        },

        // Primary provider information
        primaryProvider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },

        // All related service episodes for progress tracking
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
            locationService: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { scheduledDate: 'desc' }
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

    if (!treatmentPlan) {
      return Response.json({
        error: 'Treatment plan not found'
      }, { status: 404 })
    }

    // Parse JSON fields
    let treatmentGoals = []
    let secondaryDiagnoses = []
    let objectives = []
    let interventions = []
    let careTeam = []
    let measurementTools = []

    try {
      if (treatmentPlan.treatmentGoals) {
        treatmentGoals = typeof treatmentPlan.treatmentGoals === 'string' ?
          JSON.parse(treatmentPlan.treatmentGoals) : treatmentPlan.treatmentGoals
      }
      if (treatmentPlan.secondaryDiagnoses) {
        secondaryDiagnoses = typeof treatmentPlan.secondaryDiagnoses === 'string' ?
          JSON.parse(treatmentPlan.secondaryDiagnoses) : treatmentPlan.secondaryDiagnoses
      }
      if (treatmentPlan.objectives) {
        objectives = typeof treatmentPlan.objectives === 'string' ?
          JSON.parse(treatmentPlan.objectives) : treatmentPlan.objectives
      }
      if (treatmentPlan.interventions) {
        interventions = typeof treatmentPlan.interventions === 'string' ?
          JSON.parse(treatmentPlan.interventions) : treatmentPlan.interventions
      }
      if (treatmentPlan.careTeam) {
        careTeam = typeof treatmentPlan.careTeam === 'string' ?
          JSON.parse(treatmentPlan.careTeam) : treatmentPlan.careTeam
      }
      if (treatmentPlan.measurementTools) {
        measurementTools = typeof treatmentPlan.measurementTools === 'string' ?
          JSON.parse(treatmentPlan.measurementTools) : treatmentPlan.measurementTools
      }
    } catch (error) {
      console.error('Error parsing JSON fields:', error)
    }

    // Calculate patient age
    let patientAge: number | null = null
    if (treatmentPlan.patient?.dateOfBirth) {
      const birthDate = new Date(treatmentPlan.patient.dateOfBirth)
      const today = new Date()
      patientAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        patientAge--
      }
    }

    // Calculate progress metrics
    const progressMetrics = {
      // Goals progress
      totalGoals: treatmentGoals.length,
      achievedGoals: treatmentGoals.filter((goal: any) => goal.status === 'ACHIEVED').length,
      inProgressGoals: treatmentGoals.filter((goal: any) => goal.status === 'IN_PROGRESS').length,

      // Session metrics
      totalSessions: treatmentPlan.serviceEpisodes.length,
      completedSessions: treatmentPlan.serviceEpisodes.filter(episode => episode.status === 'COMPLETED').length,
      missedSessions: treatmentPlan.serviceEpisodes.filter(episode => episode.status === 'NO_SHOW').length,

      // Duration metrics
      planDurationWeeks: treatmentPlan.expectedDuration || null,
      weeksActive: Math.ceil((Date.now() - new Date(treatmentPlan.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)),
      averageSessionsPerWeek: treatmentPlan.serviceEpisodes.length > 0 ?
        treatmentPlan.serviceEpisodes.length / Math.max(1, Math.ceil((Date.now() - new Date(treatmentPlan.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))) : 0,

      // Authorization metrics
      sessionsAuthorized: treatmentPlan.sessionsAuthorized,
      sessionsCompleted: treatmentPlan.sessionsCompleted || 0,
      sessionsRemaining: treatmentPlan.sessionsRemaining,
      authorizationUtilization: treatmentPlan.sessionsAuthorized ?
        ((treatmentPlan.sessionsCompleted || 0) / treatmentPlan.sessionsAuthorized) * 100 : null
    }

    // Determine review status
    const reviewStatus = {
      needsReview: treatmentPlan.reviewDate ?
        new Date(treatmentPlan.reviewDate) <= new Date() :
        new Date(treatmentPlan.startDate).getTime() + (12 * 7 * 24 * 60 * 60 * 1000) <= Date.now(),
      nextReviewDate: treatmentPlan.reviewDate,
      daysSinceLastReview: treatmentPlan.reviewDate ?
        Math.ceil((Date.now() - new Date(treatmentPlan.reviewDate).getTime()) / (24 * 60 * 60 * 1000)) : null,
      recommendedReviewFrequency: 12 // weeks
    }

    // Authorization status
    const authorizationStatus = {
      hasAuthorization: !!treatmentPlan.insuranceAuthorization,
      authorizationNumber: treatmentPlan.insuranceAuthorization,
      sessionsRemaining: treatmentPlan.sessionsRemaining,
      isExpiring: treatmentPlan.sessionsRemaining !== null && treatmentPlan.sessionsRemaining <= 5,
      isExpired: treatmentPlan.sessionsRemaining !== null && treatmentPlan.sessionsRemaining <= 0,
      utilizationRate: progressMetrics.authorizationUtilization
    }

    // Recent activity summary
    const recentActivity = {
      lastSession: treatmentPlan.serviceEpisodes[0] ? {
        date: treatmentPlan.serviceEpisodes[0].scheduledDate,
        type: treatmentPlan.serviceEpisodes[0].sessionType,
        outcome: treatmentPlan.serviceEpisodes[0].sessionOutcome,
        provider: treatmentPlan.serviceEpisodes[0].provider?.user?.name || 'Unknown Provider',
        duration: treatmentPlan.serviceEpisodes[0].durationMinutes
      } : null,

      recentSessions: treatmentPlan.serviceEpisodes.slice(0, 5).map(episode => ({
        id: episode.id,
        date: episode.scheduledDate,
        type: episode.sessionType,
        status: episode.status,
        outcome: episode.sessionOutcome,
        provider: episode.provider?.user?.name || 'Unknown Provider',
        location: episode.locationService?.name || 'Unknown Location'
      })),

      upcomingAppointments: [] // This would be populated from appointments API
    }

    // Enhanced treatment plan with calculated fields
    const enhancedTreatmentPlan = {
      ...treatmentPlan,

      // Parsed JSON fields
      treatmentGoals,
      secondaryDiagnoses,
      objectives,
      interventions,
      careTeam,
      measurementTools,

      // Patient context
      patientContext: {
        ...treatmentPlan.patient,
        age: patientAge,
        isMinor: patientAge !== null ? patientAge < 18 : false
      },

      // Provider context
      providerContext: treatmentPlan.primaryProvider ? {
        id: treatmentPlan.primaryProvider.id,
        name: treatmentPlan.primaryProvider.user?.name ||
              `${treatmentPlan.primaryProvider.user?.firstName || ''} ${treatmentPlan.primaryProvider.user?.lastName || ''}`.trim(),
        title: treatmentPlan.primaryProvider.title,
        specialty: treatmentPlan.primaryProvider.specialty,
        email: treatmentPlan.primaryProvider.user?.email,
        canPrescribeMedication: treatmentPlan.primaryProvider.canPrescribeMedication
      } : null,

      // Progress and metrics
      progressMetrics,
      reviewStatus,
      authorizationStatus,
      recentActivity,

      // Care coordination
      careCoordination: {
        careTeamSize: careTeam.length,
        activeCareTeamMembers: careTeam.filter((member: any) => !member.endDate),
        multiProviderPlan: careTeam.length > 1,
        needsCoordination: careTeam.length > 1 || treatmentPlan.treatmentType === 'CASE_MANAGEMENT'
      }
    }

    // TODO: Create audit log entry for treatment plan access
    // await createAuditLog({
    //   action: 'READ',
    //   tableName: 'treatment_plans',
    //   recordId: id,
    //   userId: session.user.id,
    //   patientId: treatmentPlan.patientId,
    //   accessType: 'TREATMENT_RELATED'
    // })

    return successResponse(enhancedTreatmentPlan, 'Treatment plan retrieved successfully')

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// PUT /api/treatment-plans/[id] - Update treatment plan with healthcare validation
// ============================================================================
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`PUT /api/treatment-plans/${params.id}`)

  try {
    const { id } = params
    const body = await request.json()

    // Include ID in validation data
    const validatedData: UpdateTreatmentPlanInput = validateRequestBody(
      { ...body, id },
      updateTreatmentPlanSchema
    )

    // Check if treatment plan exists and is not deleted
    const existingPlan = await prisma.treatmentPlan.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        patient: {
          select: {
            id: true,
            patientStatus: true
          }
        }
      }
    })

    if (!existingPlan) {
      return Response.json({
        error: 'Treatment plan not found'
      }, { status: 404 })
    }

    // Validate patient is still eligible if being changed
    if (validatedData.patientId && validatedData.patientId !== existingPlan.patientId) {
      const newPatient = await prisma.patient.findFirst({
        where: {
          id: validatedData.patientId,
          isDeleted: false,
          patientStatus: { in: ['ACTIVE', 'WAITLIST'] }
        }
      })

      if (!newPatient) {
        return Response.json({
          error: 'Validation Error',
          details: 'New patient not found or not eligible for treatment planning'
        }, { status: 400 })
      }
    }

    // Validate provider changes
    if (validatedData.primaryProviderId && validatedData.primaryProviderId !== existingPlan.primaryProviderId) {
      const newProvider = await prisma.provider.findFirst({
        where: {
          id: validatedData.primaryProviderId,
          employmentStatus: 'ACTIVE'
        },
        select: {
          id: true,
          maxCaseload: true,
          currentCaseload: true,
          serviceTypesProvided: true
        }
      })

      if (!newProvider) {
        return Response.json({
          error: 'Validation Error',
          details: 'New provider not found or not active'
        }, { status: 400 })
      }

      // Check if provider can deliver the treatment type
      const treatmentType = validatedData.treatmentType || existingPlan.treatmentType
      if (newProvider.serviceTypesProvided) {
        try {
          const serviceTypes = JSON.parse(newProvider.serviceTypesProvided)
          if (Array.isArray(serviceTypes) && !serviceTypes.includes(treatmentType)) {
            return Response.json({
              error: 'Validation Error',
              details: 'New provider is not qualified to deliver this treatment type'
            }, { status: 400 })
          }
        } catch {
          // Invalid JSON, skip validation
        }
      }
    }

    // Validate status changes
    if (validatedData.status && validatedData.status !== existingPlan.status) {
      // Check business rules for status transitions
      const validTransitions: Record<string, string[]> = {
        'ACTIVE': ['ON_HOLD', 'COMPLETED', 'DISCONTINUED', 'TRANSFERRED'],
        'ON_HOLD': ['ACTIVE', 'DISCONTINUED', 'TRANSFERRED'],
        'COMPLETED': [], // Cannot change from completed
        'DISCONTINUED': [], // Cannot change from discontinued
        'TRANSFERRED': [] // Cannot change from transferred
      }

      const allowedStatuses = validTransitions[existingPlan.status] || []
      if (!allowedStatuses.includes(validatedData.status)) {
        return Response.json({
          error: 'Validation Error',
          details: `Cannot change status from ${existingPlan.status} to ${validatedData.status}`
        }, { status: 400 })
      }

      // Additional validations for specific status changes
      if (validatedData.status === 'COMPLETED') {
        // Ensure there are service episodes
        const sessionCount = await prisma.serviceEpisode.count({
          where: {
            treatmentPlanId: id,
            status: 'COMPLETED',
            isDeleted: false
          }
        })

        if (sessionCount === 0) {
          return Response.json({
            error: 'Validation Error',
            details: 'Cannot mark treatment plan as completed without any completed sessions'
          }, { status: 400 })
        }
      }
    }

    // Validate date changes
    if (validatedData.endDate && validatedData.startDate) {
      if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
        return Response.json({
          error: 'Validation Error',
          details: 'End date must be after start date'
        }, { status: 400 })
      }
    } else if (validatedData.endDate && !validatedData.startDate) {
      if (new Date(validatedData.endDate) <= new Date(existingPlan.startDate)) {
        return Response.json({
          error: 'Validation Error',
          details: 'End date must be after start date'
        }, { status: 400 })
      }
    }

    // Validate session counts
    if (validatedData.sessionsCompleted !== undefined && validatedData.sessionsAuthorized) {
      if (validatedData.sessionsCompleted > validatedData.sessionsAuthorized) {
        return Response.json({
          error: 'Validation Error',
          details: 'Completed sessions cannot exceed authorized sessions'
        }, { status: 400 })
      }
    }

    // Calculate sessions remaining if sessions completed changed
    if (validatedData.sessionsCompleted !== undefined && existingPlan.sessionsAuthorized) {
      validatedData.sessionsRemaining = existingPlan.sessionsAuthorized - validatedData.sessionsCompleted
    }

    // Convert complex objects to JSON strings for storage
    const updateData: any = { ...validatedData }

    if (updateData.treatmentGoals) {
      updateData.treatmentGoals = JSON.stringify(updateData.treatmentGoals)
    }
    if (updateData.secondaryDiagnoses) {
      updateData.secondaryDiagnoses = JSON.stringify(updateData.secondaryDiagnoses)
    }
    if (updateData.objectives) {
      updateData.objectives = JSON.stringify(updateData.objectives)
    }
    if (updateData.interventions) {
      updateData.interventions = JSON.stringify(updateData.interventions)
    }
    if (updateData.careTeam) {
      updateData.careTeam = JSON.stringify(updateData.careTeam)
    }
    if (updateData.measurementTools) {
      updateData.measurementTools = JSON.stringify(updateData.measurementTools)
    }

    // Convert date strings to Date objects
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate)
    }
    if (updateData.reviewDate) {
      updateData.reviewDate = new Date(updateData.reviewDate)
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate)
    }

    // Remove ID from data before update
    const { id: _id, ...dataForUpdate } = updateData

    // Update treatment plan record
    const updatedTreatmentPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        ...dataForUpdate,
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
        },
        primaryProvider: {
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
    })

    // Update provider caseload if provider changed
    if (validatedData.primaryProviderId && validatedData.primaryProviderId !== existingPlan.primaryProviderId) {
      // Decrease old provider's caseload
      if (existingPlan.primaryProviderId) {
        await prisma.provider.update({
          where: { id: existingPlan.primaryProviderId },
          data: { currentCaseload: { decrement: 1 } }
        })
      }

      // Increase new provider's caseload
      await prisma.provider.update({
        where: { id: validatedData.primaryProviderId },
        data: { currentCaseload: { increment: 1 } }
      })
    }

    // TODO: Create audit log entry for treatment plan update
    // await createAuditLog({
    //   action: 'UPDATE',
    //   tableName: 'treatment_plans',
    //   recordId: id,
    //   userId: session.user.id,
    //   patientId: existingPlan.patientId,
    //   oldValues: JSON.stringify(existingPlan),
    //   newValues: JSON.stringify(updatedTreatmentPlan)
    // })

    return successResponse(updatedTreatmentPlan, 'Treatment plan updated successfully')

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// DELETE /api/treatment-plans/[id] - Soft delete treatment plan
// ============================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`DELETE /api/treatment-plans/${params.id}`)

  try {
    const { id } = params

    // Check if treatment plan exists and is not already deleted
    const existingPlan = await prisma.treatmentPlan.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!existingPlan) {
      return Response.json({
        error: 'Treatment plan not found'
      }, { status: 404 })
    }

    // Check for active service episodes
    const activeEpisodes = await prisma.serviceEpisode.count({
      where: {
        treatmentPlanId: id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        isDeleted: false
      }
    })

    if (activeEpisodes > 0) {
      return Response.json({
        error: 'Cannot delete treatment plan',
        details: 'Treatment plan has active or scheduled service episodes. Please complete or cancel them before deletion.'
      }, { status: 400 })
    }

    // Check for upcoming appointments linked to this plan
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        treatmentPlanId: id,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        scheduledDate: { gte: new Date() }
      }
    })

    if (upcomingAppointments > 0) {
      return Response.json({
        error: 'Cannot delete treatment plan',
        details: 'Treatment plan has upcoming appointments. Please reschedule or cancel them before deletion.'
      }, { status: 400 })
    }

    // Only allow deletion if plan is in certain statuses
    if (!['DISCONTINUED', 'TRANSFERRED', 'COMPLETED'].includes(existingPlan.status)) {
      return Response.json({
        error: 'Cannot delete treatment plan',
        details: 'Only treatment plans with status DISCONTINUED, TRANSFERRED, or COMPLETED can be deleted. Please update the status first.'
      }, { status: 400 })
    }

    // Soft delete treatment plan
    const deletedTreatmentPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update provider caseload
    if (existingPlan.primaryProviderId) {
      await prisma.provider.update({
        where: { id: existingPlan.primaryProviderId },
        data: { currentCaseload: { decrement: 1 } }
      })
    }

    // TODO: Create audit log entry for treatment plan deletion
    // await createAuditLog({
    //   action: 'DELETE',
    //   tableName: 'treatment_plans',
    //   recordId: id,
    //   userId: session.user.id,
    //   patientId: existingPlan.patientId,
    //   oldValues: JSON.stringify(existingPlan)
    // })

    return successResponse(
      { id: deletedTreatmentPlan.id, deletedAt: deletedTreatmentPlan.deletedAt },
      'Treatment plan deleted successfully'
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