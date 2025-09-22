import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  paginatedResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
  validateQueryParams
} from '@/lib/api-utils'
import {
  patientSearchSchema,
  PatientSearchInput,
  PatientSummary,
  healthcareValidationUtils
} from '@/lib/validations'

// ============================================================================
// GET /api/patients/search - Optimized patient search for provider workflow
// 99% use case: "Find patient by name, MRN, phone, or DOB"
// Performance target: <200ms response time
// ============================================================================
export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/patients/search')

  try {
    const { searchParams } = new URL(request.url)
    const query: PatientSearchInput = validateQueryParams(searchParams, patientSearchSchema)

    // Build optimized search conditions for healthcare workflow
    const searchConditions = []

    // Quick search (covers 99% of provider searches)
    if (query.query) {
      const searchTerm = query.query.trim()

      // Determine search type based on input pattern
      const isPhone = /^[\+]?[1-9][\d\-\s\(\)]{0,15}$/.test(searchTerm)
      const isMRN = /^[A-Z0-9\-]{3,20}$/.test(searchTerm.toUpperCase())
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(searchTerm) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(searchTerm)

      if (isMRN) {
        // Medical record number search (highest priority)
        searchConditions.push({
          medicalRecordNumber: {
            equals: searchTerm.toUpperCase(),
            mode: 'insensitive' as const
          }
        })
      } else if (isPhone) {
        // Phone number search
        const cleanPhone = searchTerm.replace(/[\D]/g, '') // Remove non-digits
        searchConditions.push({
          OR: [
            { phone: { contains: cleanPhone } },
            { phone: { contains: searchTerm } }
          ]
        })
      } else if (isDate) {
        // Date of birth search
        try {
          const searchDate = new Date(searchTerm)
          if (!isNaN(searchDate.getTime())) {
            searchConditions.push({
              dateOfBirth: {
                gte: new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate()),
                lt: new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate() + 1)
              }
            })
          }
        } catch {
          // Invalid date format, fall back to name search
        }
      }

      // Always include name search for flexible matching
      if (searchTerm.includes(' ')) {
        // Handle "first last" or "last, first" patterns
        const nameParts = searchTerm.split(/[\s,]+/).filter(Boolean)
        if (nameParts.length >= 2) {
          searchConditions.push({
            AND: [
              {
                OR: [
                  { firstName: { contains: nameParts[0], mode: 'insensitive' } },
                  { lastName: { contains: nameParts[0], mode: 'insensitive' } }
                ]
              },
              {
                OR: [
                  { firstName: { contains: nameParts[1], mode: 'insensitive' } },
                  { lastName: { contains: nameParts[1], mode: 'insensitive' } }
                ]
              }
            ]
          })
        }
      } else {
        // Single term - search both first and last name
        searchConditions.push({
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } }
          ]
        })
      }
    }

    // Specific field searches
    if (query.medicalRecordNumber) {
      searchConditions.push({
        medicalRecordNumber: {
          equals: query.medicalRecordNumber.toUpperCase(),
          mode: 'insensitive' as const
        }
      })
    }

    if (query.phone) {
      const cleanPhone = query.phone.replace(/[\D]/g, '')
      searchConditions.push({
        OR: [
          { phone: { contains: cleanPhone } },
          { phone: { contains: query.phone } }
        ]
      })
    }

    if (query.dateOfBirth) {
      try {
        const searchDate = new Date(query.dateOfBirth)
        searchConditions.push({
          dateOfBirth: {
            gte: new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate()),
            lt: new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate() + 1)
          }
        })
      } catch {
        // Invalid date format
      }
    }

    if (query.firstName) {
      searchConditions.push({
        firstName: { contains: query.firstName, mode: 'insensitive' }
      })
    }

    if (query.lastName) {
      searchConditions.push({
        lastName: { contains: query.lastName, mode: 'insensitive' }
      })
    }

    // Build additional filters
    const filters: any = {
      isDeleted: false,
      ...(searchConditions.length > 0 && { OR: searchConditions }),
      ...(query.siteId && { locationId: query.siteId }),
      ...(query.assignedProvider && { currentProviderId: query.assignedProvider }),
      ...(query.patientStatus && { patientStatus: query.patientStatus }),
      ...(query.riskLevel && { riskLevel: query.riskLevel }),
      ...(query.isActive !== undefined && {
        patientStatus: query.isActive ? { in: ['ACTIVE', 'WAITLIST'] } : { in: ['INACTIVE', 'DISCHARGED', 'TRANSFERRED'] }
      })
    }

    // Date range filters
    if (query.lastVisitAfter || query.lastVisitBefore) {
      const dateFilter: any = {}
      if (query.lastVisitAfter) {
        dateFilter.gte = new Date(query.lastVisitAfter)
      }
      if (query.lastVisitBefore) {
        dateFilter.lte = new Date(query.lastVisitBefore)
      }

      filters.serviceEpisodes = {
        some: {
          scheduledDate: dateFilter,
          status: 'COMPLETED',
          isDeleted: false
        }
      }
    }

    // Service category filter
    if (query.serviceCategory) {
      filters.treatmentPlans = {
        some: {
          treatmentType: query.serviceCategory,
          status: 'ACTIVE',
          isDeleted: false
        }
      }
    }

    // Build sort query optimized for healthcare workflow
    let orderBy: any = []
    switch (query.sortBy) {
      case 'lastName':
        orderBy = [{ lastName: query.sortOrder }, { firstName: query.sortOrder }]
        break
      case 'firstName':
        orderBy = [{ firstName: query.sortOrder }, { lastName: query.sortOrder }]
        break
      case 'medicalRecordNumber':
        orderBy = { medicalRecordNumber: query.sortOrder }
        break
      case 'lastVisit':
        orderBy = { updatedAt: query.sortOrder } // Proxy for last activity
        break
      default:
        orderBy = [{ lastName: 'asc' }, { firstName: 'asc' }]
    }

    // Get total count for pagination
    const total = await prisma.patient.count({ where: filters })

    // Get paginated results with optimized includes for patient search
    const patients = await prisma.patient.findMany({
      where: filters,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        medicalRecordNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        phone: true,
        patientStatus: true,
        riskLevel: true,
        locationId: true,
        currentProviderId: true,
        createdAt: true,

        // Current provider (optimized select)
        currentProvider: {
          select: {
            id: true,
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

        // Location (optimized select)
        location: {
          select: {
            id: true,
            name: true,
            shortName: true
          }
        },

        // Most recent service episode
        serviceEpisodes: {
          where: {
            isDeleted: false,
            status: 'COMPLETED'
          },
          select: {
            scheduledDate: true,
            sessionType: true,
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
          take: 1
        },

        // Active treatment plans (for service categories)
        treatmentPlans: {
          where: {
            isDeleted: false,
            status: 'ACTIVE'
          },
          select: {
            treatmentType: true
          }
        },

        // Upcoming appointments
        appointments: {
          where: {
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            scheduledDate: { gte: new Date() }
          },
          select: {
            id: true,
            scheduledDate: true
          },
          take: 1
        },

        // Critical flags
        consentOnFile: true,
        emergencyContactId: true
      }
    })

    // Transform to PatientSummary format optimized for search results
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

      // Active service categories
      activeServices: patient.treatmentPlans.map(plan => plan.treatmentType),

      patientStatus: patient.patientStatus,
      riskLevel: patient.riskLevel,
      siteId: patient.locationId,
      siteName: patient.location?.name || 'Unknown Location',

      // Quick access flags
      hasActiveTreatmentPlan: patient.treatmentPlans.length > 0,
      hasUpcomingAppointments: patient.appointments.length > 0,
      requiresFollowUp: patient.riskLevel === 'HIGH' || patient.riskLevel === 'CRITICAL',

      // Alert flags for provider dashboard
      alertFlags: [
        ...(patient.riskLevel === 'CRITICAL' ? ['Critical Risk'] : []),
        ...(patient.riskLevel === 'HIGH' ? ['High Risk'] : []),
        ...(patient.consentOnFile ? [] : ['Missing Consent']),
        ...(patient.emergencyContactId ? [] : ['No Emergency Contact']),
        ...(patient.appointments.length > 0 ? ['Upcoming Appointment'] : [])
      ]
    }))

    // Calculate search performance metrics
    const searchTime = perf.getElapsed()

    return paginatedResponse(
      patientSummaries,
      query.page,
      query.limit,
      total,
      {
        searchTime: Math.round(searchTime),
        searchQuery: query.query || 'Advanced search',
        filtersApplied: Object.keys(query).filter(key =>
          query[key as keyof PatientSearchInput] !== undefined &&
          !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)
        ).length
      }
    )

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// POST /api/patients/search - Advanced patient search with complex filters
// ============================================================================
export async function POST(request: NextRequest) {
  const perf = createPerformanceLogger('POST /api/patients/search')

  try {
    const body = await request.json()
    const searchCriteria = body

    // Complex search logic for administrative use
    // This endpoint supports more sophisticated queries than GET /search

    const filters: any = {
      isDeleted: false
    }

    // Multi-field search with AND/OR logic
    if (searchCriteria.complexQuery) {
      const { conditions, operator = 'AND' } = searchCriteria.complexQuery

      if (conditions && conditions.length > 0) {
        const conditionFilters = conditions.map((condition: any) => {
          const { field, operation, value } = condition

          switch (operation) {
            case 'equals':
              return { [field]: value }
            case 'contains':
              return { [field]: { contains: value, mode: 'insensitive' } }
            case 'startsWith':
              return { [field]: { startsWith: value, mode: 'insensitive' } }
            case 'in':
              return { [field]: { in: value } }
            case 'between':
              return { [field]: { gte: value[0], lte: value[1] } }
            case 'isNull':
              return { [field]: null }
            case 'isNotNull':
              return { [field]: { not: null } }
            default:
              return {}
          }
        }).filter(Boolean)

        if (conditionFilters.length > 0) {
          filters[operator] = conditionFilters
        }
      }
    }

    // Service-based filtering (button-based navigation)
    if (searchCriteria.serviceFilters) {
      const serviceConditions = []

      if (searchCriteria.serviceFilters.mentalHealth) {
        serviceConditions.push({
          treatmentPlans: {
            some: {
              treatmentType: { in: ['INDIVIDUAL_THERAPY', 'GROUP_THERAPY', 'FAMILY_THERAPY'] },
              status: 'ACTIVE',
              isDeleted: false
            }
          }
        })
      }

      if (searchCriteria.serviceFilters.caseManagement) {
        serviceConditions.push({
          treatmentPlans: {
            some: {
              treatmentType: 'CASE_MANAGEMENT',
              status: 'ACTIVE',
              isDeleted: false
            }
          }
        })
      }

      if (searchCriteria.serviceFilters.crisis) {
        serviceConditions.push({
          OR: [
            { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
            {
              serviceEpisodes: {
                some: {
                  sessionType: 'CRISIS_SESSION',
                  scheduledDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
                  isDeleted: false
                }
              }
            }
          ]
        })
      }

      if (serviceConditions.length > 0) {
        filters.OR = [...(filters.OR || []), ...serviceConditions]
      }
    }

    // Demographics filtering
    if (searchCriteria.demographics) {
      const { ageRange, gender, language, riskLevel } = searchCriteria.demographics

      if (ageRange) {
        const now = new Date()
        const maxBirthDate = new Date(now.getFullYear() - ageRange.min, now.getMonth(), now.getDate())
        const minBirthDate = new Date(now.getFullYear() - ageRange.max, now.getMonth(), now.getDate())

        filters.dateOfBirth = {
          gte: minBirthDate,
          lte: maxBirthDate
        }
      }

      if (gender) {
        filters.gender = gender
      }

      if (language) {
        filters.preferredLanguage = language
      }

      if (riskLevel) {
        filters.riskLevel = riskLevel
      }
    }

    // Execute search with performance monitoring
    const startTime = Date.now()

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: filters,
        include: {
          currentProvider: {
            select: {
              id: true,
              user: { select: { name: true, firstName: true, lastName: true } }
            }
          },
          location: {
            select: { id: true, name: true }
          },
          treatmentPlans: {
            where: { status: 'ACTIVE', isDeleted: false },
            select: { treatmentType: true }
          }
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        take: 100 // Limit for performance
      }),
      prisma.patient.count({ where: filters })
    ])

    const searchTime = Date.now() - startTime

    return successResponse({
      patients: patients.map(patient => ({
        id: patient.id,
        medicalRecordNumber: patient.medicalRecordNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth?.toISOString() || null,
        patientStatus: patient.patientStatus,
        riskLevel: patient.riskLevel,
        location: patient.location?.name,
        activeServices: patient.treatmentPlans.map(plan => plan.treatmentType)
      })),
      total,
      searchTime,
      performance: {
        queryTime: searchTime,
        resultCount: patients.length,
        totalMatches: total
      }
    }, 'Advanced search completed successfully')

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