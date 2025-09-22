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
  createPatientSchema,
  patientQuerySchema,
  CreatePatientInput,
  PatientQueryInput,
  PatientSummary,
  healthcareValidationUtils
} from '@/lib/validations'

// ============================================================================
// GET /api/patients - List patients with HIPAA-compliant filtering and search
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/patients')

  try {
    const { searchParams } = new URL(request.url)
    const query: PatientQueryInput = validateQueryParams(searchParams, patientQuerySchema)

    // Build search filter for patient-specific fields
    const searchFilter = query.search ? buildSearchFilter(query.search, [
      'firstName',
      'lastName',
      'medicalRecordNumber',
      'phone',
      'email'
    ]) : undefined

    // Build healthcare-specific filters
    const statusFilter = query.patientStatus ? { patientStatus: query.patientStatus } : undefined
    const riskFilter = query.riskLevel ? { riskLevel: query.riskLevel } : undefined
    const locationFilter = query.locationId ? { locationId: query.locationId } : undefined
    const providerFilter = query.currentProviderId ? { currentProviderId: query.currentProviderId } : undefined

    // Combine all filters with HIPAA compliance (no soft-deleted records)
    const where = {
      isDeleted: false,
      ...(searchFilter && { OR: searchFilter.OR }),
      ...(statusFilter && statusFilter),
      ...(riskFilter && riskFilter),
      ...(locationFilter && locationFilter),
      ...(providerFilter && providerFilter)
    }

    // Build sort query
    const orderBy = buildSortQuery(query.sortBy, query.sortOrder)

    // Get total count for pagination
    const total = await prisma.patient.count({ where })

    // Get paginated results with related data
    const patients = await prisma.patient.findMany({
      where,
      ...buildPaginationQuery(query.page, query.limit),
      orderBy,
      include: {
        // Current provider information
        currentProvider: {
          select: {
            id: true,
            userId: true,
            title: true,
            specialty: true,
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },

        // Location information
        location: {
          select: {
            id: true,
            name: true,
            shortName: true,
            city: true,
            state: true
          }
        },

        // Emergency contact preview
        emergencyContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            relationshipType: true
          }
        },

        // Active treatment plans count
        treatmentPlans: {
          where: {
            isDeleted: false,
            status: 'ACTIVE'
          },
          select: {
            id: true,
            title: true,
            status: true,
            treatmentType: true,
            startDate: true
          },
          take: 3 // Preview of active plans
        },

        // Recent service episodes
        serviceEpisodes: {
          where: {
            isDeleted: false,
            status: 'COMPLETED'
          },
          select: {
            id: true,
            sessionType: true,
            scheduledDate: true,
            status: true,
            provider: {
              select: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { scheduledDate: 'desc' },
          take: 1 // Most recent episode
        },

        // Upcoming appointments
        appointments: {
          where: {
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            scheduledDate: { gte: new Date() }
          },
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
            appointmentType: true,
            status: true
          },
          orderBy: { scheduledDate: 'asc' },
          take: 1 // Next appointment
        },

        // Family members count
        _count: {
          select: {
            familyMembers: { where: { isDeleted: false } },
            treatmentPlans: { where: { isDeleted: false } },
            serviceEpisodes: { where: { isDeleted: false } },
            appointments: true
          }
        }
      }
    })

    // Transform to patient summary format for HIPAA compliance
    const patientSummaries: PatientSummary[] = patients.map(patient => ({
      id: patient.id,
      medicalRecordNumber: patient.medicalRecordNumber,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth?.toISOString() || null,
      phone: patient.phone,

      // Primary provider information
      primaryProvider: patient.currentProvider ? {
        id: patient.currentProvider.id,
        name: patient.currentProvider.user?.name ||
              `${patient.currentProvider.user?.firstName || ''} ${patient.currentProvider.user?.lastName || ''}`.trim(),
        title: patient.currentProvider.title || patient.currentProvider.specialty || 'Provider'
      } : undefined,

      // Last visit information
      lastVisit: patient.serviceEpisodes[0] ? {
        date: patient.serviceEpisodes[0].scheduledDate?.toISOString() || '',
        serviceType: patient.serviceEpisodes[0].sessionType,
        provider: patient.serviceEpisodes[0].provider?.user?.name || 'Unknown Provider'
      } : undefined,

      // Service categories (simplified for summary)
      activeServices: patient.treatmentPlans.map(plan => plan.treatmentType),

      patientStatus: patient.patientStatus,
      riskLevel: patient.riskLevel,
      siteId: patient.locationId,
      siteName: patient.location?.name || 'Unknown Location',

      // Quick access flags
      hasActiveTreatmentPlan: patient.treatmentPlans.length > 0,
      hasUpcomingAppointments: patient.appointments.length > 0,
      requiresFollowUp: patient.riskLevel === 'HIGH' || patient.riskLevel === 'CRITICAL',

      // Alert flags based on patient data
      alertFlags: [
        ...(patient.riskLevel === 'CRITICAL' ? ['Critical Risk'] : []),
        ...(patient.riskLevel === 'HIGH' ? ['High Risk'] : []),
        ...(patient.consentOnFile ? [] : ['Missing Consent']),
        ...(patient.emergencyContact ? [] : ['No Emergency Contact']),
        ...(patient.appointments.length > 0 ? ['Upcoming Appointment'] : [])
      ]
    }))

    return paginatedResponse(patientSummaries, query.page, query.limit, total)

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/patients - Create new patient with HIPAA validation
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/patients')

  try {
    const body = await request.json()
    const validatedData: CreatePatientInput = validateRequestBody(body, createPatientSchema)

    // Healthcare business rule validations
    if (validatedData.medicalRecordNumber) {
      const existingPatient = await prisma.patient.findFirst({
        where: {
          medicalRecordNumber: validatedData.medicalRecordNumber,
          isDeleted: false
        }
      })

      if (existingPatient) {
        return Response.json({
          error: 'Validation Error',
          details: 'Medical record number already exists'
        }, { status: 400 })
      }
    }

    // Validate location exists and is active
    const location = await prisma.location.findFirst({
      where: {
        id: validatedData.locationId,
        isActive: true
      }
    })

    if (!location) {
      return Response.json({
        error: 'Validation Error',
        details: 'Invalid or inactive location'
      }, { status: 400 })
    }

    // Generate medical record number if not provided
    if (!validatedData.medicalRecordNumber) {
      // Get location-specific sequence number
      const lastPatient = await prisma.patient.findFirst({
        where: {
          locationId: validatedData.locationId,
          medicalRecordNumber: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Simple MRN generation (should be enhanced for production)
      const sequence = lastPatient ?
        parseInt(lastPatient.medicalRecordNumber?.slice(-6) || '0') + 1 : 1

      validatedData.medicalRecordNumber = healthcareValidationUtils.generateMRN(
        location.shortName || location.name.substring(0, 3).toUpperCase(),
        sequence
      )
    }

    // Create patient record
    const patient = await prisma.patient.create({
      data: {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
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
    })

    // TODO: Create audit log entry for patient creation
    // await createAuditLog({
    //   action: 'CREATE',
    //   tableName: 'patients',
    //   recordId: patient.id,
    //   userId: session.user.id,
    //   newValues: JSON.stringify(patient)
    // })

    return successResponse(patient, 'Patient created successfully', 201)

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