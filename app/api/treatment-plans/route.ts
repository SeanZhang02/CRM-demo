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
  createTreatmentPlanSchema,
  treatmentPlanQuerySchema,
  CreateTreatmentPlanInput,
  TreatmentPlanQueryInput,
  TreatmentPlanSummary
} from '@/lib/validations'

// ============================================================================
// GET /api/treatment-plans - List treatment plans with healthcare filtering
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/treatment-plans')

  try {
    const { searchParams } = new URL(request.url)
    const query: TreatmentPlanQueryInput = validateQueryParams(searchParams, treatmentPlanQuerySchema)

    // Build search filter for treatment plan fields
    const searchFilter = query.search ? buildSearchFilter(query.search, [
      'title',
      'description',
      'primaryDiagnosis',
      'progressNotes'
    ]) : undefined

    // Build healthcare-specific filters
    const patientFilter = query.patientId ? { patientId: query.patientId } : undefined
    const providerFilter = query.primaryProviderId ? { primaryProviderId: query.primaryProviderId } : undefined
    const treatmentTypeFilter = query.treatmentType ? { treatmentType: query.treatmentType } : undefined
    const statusFilter = query.status ? { status: query.status } : undefined
    const priorityFilter = query.priority ? { priority: query.priority } : undefined

    // Date range filters
    const dateFilters: any = {}
    if (query.startDateAfter) {
      dateFilters.startDate = { gte: new Date(query.startDateAfter) }
    }
    if (query.startDateBefore) {
      if (dateFilters.startDate) {
        dateFilters.startDate.lte = new Date(query.startDateBefore)
      } else {
        dateFilters.startDate = { lte: new Date(query.startDateBefore) }
      }
    }

    // Special filters for healthcare workflow
    const specialFilters: any = {}

    if (query.reviewDue) {
      const now = new Date()
      specialFilters.OR = [
        {
          reviewDate: {
            lte: now
          }
        },
        {
          reviewDate: null,
          startDate: {
            lte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) // 12 weeks ago
          }
        }
      ]
    }

    if (query.authorizationExpiring) {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      specialFilters.sessionsRemaining = { lte: 5 } // 5 or fewer sessions remaining
    }

    // Combine all filters
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(patientFilter && patientFilter),
      ...(providerFilter && providerFilter),
      ...(treatmentTypeFilter && treatmentTypeFilter),
      ...(statusFilter && statusFilter),
      ...(priorityFilter && priorityFilter),
      ...dateFilters,
      ...specialFilters
    }

    // Build sort query
    const orderBy = buildSortQuery(query.sortBy, query.sortOrder)

    // Get total count for pagination
    const total = await prisma.treatmentPlan.count({ where })

    // Get paginated results with comprehensive healthcare data
    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where,
      ...buildPaginationQuery(query.page, query.limit),
      orderBy,
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
            location: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },

        // Primary provider information
        primaryProvider: {
          select: {
            id: true,
            title: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },

        // Related service episodes for progress tracking
        serviceEpisodes: {
          where: {
            isDeleted: false,
            status: 'COMPLETED'
          },
          select: {
            id: true,
            sessionType: true,
            scheduledDate: true,
            durationMinutes: true,
            sessionOutcome: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5 // Recent sessions
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

    // Transform to treatment plan summary format
    const treatmentPlanSummaries: TreatmentPlanSummary[] = treatmentPlans.map(plan => {
      // Parse treatment goals if stored as JSON string
      let goalsCount = 0
      let goalsAchieved = 0

      try {
        if (plan.treatmentGoals) {
          const goals = typeof plan.treatmentGoals === 'string' ?
            JSON.parse(plan.treatmentGoals) : plan.treatmentGoals
          if (Array.isArray(goals)) {
            goalsCount = goals.length
            goalsAchieved = goals.filter((goal: any) => goal.status === 'ACHIEVED').length
          }
        }
      } catch {
        // Invalid JSON, keep counts as 0
      }

      // Determine authorization status
      let authorizationStatus: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'PENDING' = 'VALID'
      if (!plan.insuranceAuthorization) {
        authorizationStatus = 'PENDING'
      } else if (plan.sessionsRemaining !== null && plan.sessionsRemaining <= 5) {
        authorizationStatus = 'EXPIRING'
      } else if (plan.sessionsRemaining !== null && plan.sessionsRemaining <= 0) {
        authorizationStatus = 'EXPIRED'
      }

      // Check if review is needed
      const needsReview = plan.reviewDate ?
        new Date(plan.reviewDate) <= new Date() :
        new Date(plan.startDate).getTime() + (12 * 7 * 24 * 60 * 60 * 1000) <= Date.now() // 12 weeks

      return {
        id: plan.id,
        title: plan.title,
        treatmentType: plan.treatmentType,
        status: plan.status,
        priority: plan.priority,
        startDate: plan.startDate.toISOString(),
        reviewDate: plan.reviewDate?.toISOString() || null,

        primaryProvider: plan.primaryProvider ? {
          id: plan.primaryProvider.id,
          name: plan.primaryProvider.user?.name ||
                `${plan.primaryProvider.user?.firstName || ''} ${plan.primaryProvider.user?.lastName || ''}`.trim(),
          title: plan.primaryProvider.title || plan.primaryProvider.specialty || 'Provider'
        } : undefined,

        goalsCount,
        goalsAchieved,
        sessionsCompleted: plan.sessionsCompleted || 0,
        sessionsRemaining: plan.sessionsRemaining,
        needsReview,
        authorizationStatus
      }
    })

    return paginatedResponse(treatmentPlanSummaries, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/treatment-plans - Create new treatment plan with healthcare validation
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/treatment-plans')

  try {
    const body = await request.json()
    const validatedData: CreateTreatmentPlanInput = validateRequestBody(body, createTreatmentPlanSchema)

    // Validate patient exists and is active
    if (validatedData.patientId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: validatedData.patientId,
          isDeleted: false,
          patientStatus: { in: ['ACTIVE', 'WAITLIST'] }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientStatus: true,
          riskLevel: true,
          locationId: true
        }
      })

      if (!patient) {
        return Response.json({
          error: 'Validation Error',
          details: 'Patient not found or not eligible for treatment planning'
        }, { status: 400 })
      }

      // Check for existing active treatment plans of the same type
      const existingActivePlan = await prisma.treatmentPlan.findFirst({
        where: {
          patientId: validatedData.patientId,
          treatmentType: validatedData.treatmentType,
          status: 'ACTIVE',
          isDeleted: false
        }
      })

      if (existingActivePlan) {
        return Response.json({
          error: 'Validation Error',
          details: `Patient already has an active ${validatedData.treatmentType.replace('_', ' ').toLowerCase()} treatment plan`
        }, { status: 400 })
      }
    }

    // Validate primary provider exists and has capacity
    if (validatedData.primaryProviderId) {
      const provider = await prisma.provider.findFirst({
        where: {
          id: validatedData.primaryProviderId,
          employmentStatus: 'ACTIVE',
          isAcceptingPatients: true
        },
        select: {
          id: true,
          maxCaseload: true,
          currentCaseload: true,
          serviceTypesProvided: true
        }
      })

      if (!provider) {
        return Response.json({
          error: 'Validation Error',
          details: 'Provider not found or not accepting new patients'
        }, { status: 400 })
      }

      // Check provider caseload capacity
      if (provider.maxCaseload && provider.currentCaseload &&
          provider.currentCaseload >= provider.maxCaseload) {
        return Response.json({
          error: 'Validation Error',
          details: 'Provider has reached maximum caseload capacity'
        }, { status: 400 })
      }

      // Check if provider can deliver the requested treatment type
      if (provider.serviceTypesProvided) {
        try {
          const serviceTypes = JSON.parse(provider.serviceTypesProvided)
          if (Array.isArray(serviceTypes) &&
              !serviceTypes.includes(validatedData.treatmentType)) {
            return Response.json({
              error: 'Validation Error',
              details: 'Provider is not qualified to deliver the requested treatment type'
            }, { status: 400 })
          }
        } catch {
          // Invalid JSON, skip validation
        }
      }
    }

    // Validate treatment goals
    if (validatedData.treatmentGoals && Array.isArray(validatedData.treatmentGoals)) {
      if (validatedData.treatmentGoals.length === 0) {
        return Response.json({
          error: 'Validation Error',
          details: 'At least one treatment goal is required'
        }, { status: 400 })
      }

      if (validatedData.treatmentGoals.length > 10) {
        return Response.json({
          error: 'Validation Error',
          details: 'Maximum of 10 treatment goals allowed per plan'
        }, { status: 400 })
      }
    }

    // Validate date ranges
    if (validatedData.endDate && validatedData.startDate) {
      if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
        return Response.json({
          error: 'Validation Error',
          details: 'End date must be after start date'
        }, { status: 400 })
      }
    }

    // Set default review date if not provided (12 weeks from start)
    if (!validatedData.reviewDate && validatedData.startDate) {
      const startDate = new Date(validatedData.startDate)
      const reviewDate = new Date(startDate.getTime() + (12 * 7 * 24 * 60 * 60 * 1000))
      validatedData.reviewDate = reviewDate.toISOString()
    }

    // Convert complex objects to JSON strings for storage
    const dataForStorage = {
      ...validatedData,
      treatmentGoals: validatedData.treatmentGoals ?
        JSON.stringify(validatedData.treatmentGoals) : null,
      secondaryDiagnoses: validatedData.secondaryDiagnoses ?
        JSON.stringify(validatedData.secondaryDiagnoses) : null,
      objectives: validatedData.objectives ?
        JSON.stringify(validatedData.objectives) : null,
      interventions: validatedData.interventions ?
        JSON.stringify(validatedData.interventions) : null,
      careTeam: validatedData.careTeam ?
        JSON.stringify(validatedData.careTeam) : null,
      measurementTools: validatedData.measurementTools ?
        JSON.stringify(validatedData.measurementTools) : null,
      startDate: new Date(validatedData.startDate),
      reviewDate: validatedData.reviewDate ? new Date(validatedData.reviewDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null
    }

    // Create treatment plan record
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        ...dataForStorage,
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

    // Update provider caseload if applicable
    if (validatedData.primaryProviderId) {
      await prisma.provider.update({
        where: { id: validatedData.primaryProviderId },
        data: {
          currentCaseload: {
            increment: 1
          }
        }
      })
    }

    // TODO: Create audit log entry for treatment plan creation
    // await createAuditLog({
    //   action: 'CREATE',
    //   tableName: 'treatment_plans',
    //   recordId: treatmentPlan.id,
    //   userId: session.user.id,
    //   patientId: treatmentPlan.patientId,
    //   newValues: JSON.stringify(treatmentPlan)
    // })

    return successResponse(treatmentPlan, 'Treatment plan created successfully', 201)

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