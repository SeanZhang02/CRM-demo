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
  updatePatientSchema,
  UpdatePatientInput,
  healthcareValidationUtils
} from '@/lib/validations'

interface RouteParams {
  params: {
    id: string
  }
}

// ============================================================================
// GET /api/patients/[id] - Get patient details with comprehensive healthcare data
// ============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`GET /api/patients/${params.id}`)

  try {
    const { id } = params

    // Validate UUID format
    if (!healthcareValidationUtils.validateMRN(id) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({
        error: 'Invalid patient ID format'
      }, { status: 400 })
    }

    // Get comprehensive patient data
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        // Current provider information
        currentProvider: {
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

        // Location information
        location: {
          select: {
            id: true,
            name: true,
            shortName: true,
            address: true,
            city: true,
            state: true,
            phone: true,
            email: true
          }
        },

        // Emergency contact
        emergencyContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            mobilePhone: true,
            email: true,
            relationshipType: true,
            preferredContactMethod: true,
            status: true
          }
        },

        // All family members
        familyMembers: {
          where: { isDeleted: false },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            mobilePhone: true,
            email: true,
            relationshipType: true,
            isEmergencyContact: true,
            isPrimaryContact: true,
            canAccessInformation: true,
            preferredContactMethod: true,
            status: true
          },
          orderBy: [
            { isEmergencyContact: 'desc' },
            { isPrimaryContact: 'desc' },
            { lastName: 'asc' }
          ]
        },

        // Active treatment plans
        treatmentPlans: {
          where: {
            isDeleted: false,
            status: { in: ['ACTIVE', 'ON_HOLD'] }
          },
          include: {
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
          },
          orderBy: { startDate: 'desc' }
        },

        // Recent service episodes (last 10)
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
          orderBy: { scheduledDate: 'desc' },
          take: 10
        },

        // Upcoming appointments (next 5)
        appointments: {
          where: {
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            scheduledDate: { gte: new Date() }
          },
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
            location: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { scheduledDate: 'asc' },
          take: 5
        },

        // Recent audit logs (for compliance tracking)
        auditLogs: {
          select: {
            id: true,
            action: true,
            timestamp: true,
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 5
        },

        // Counts for dashboard metrics
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

    if (!patient) {
      return Response.json({
        error: 'Patient not found'
      }, { status: 404 })
    }

    // Calculate patient age if date of birth is available
    let age: number | null = null
    if (patient.dateOfBirth) {
      age = healthcareValidationUtils.calculateAge(patient.dateOfBirth.toISOString())
    }

    // Enhance patient data with calculated fields
    const enhancedPatient = {
      ...patient,
      age,
      isMinor: age !== null ? age < 18 : false,

      // Risk assessment summary
      riskAssessment: {
        level: patient.riskLevel,
        hasEmergencyContact: !!patient.emergencyContact,
        hasActiveTreatment: patient.treatmentPlans.length > 0,
        recentActivity: patient.serviceEpisodes.length > 0,
        upcomingAppointments: patient.appointments.length
      },

      // Care team summary
      careTeam: {
        primaryProvider: patient.currentProvider ? {
          id: patient.currentProvider.id,
          name: patient.currentProvider.user?.name ||
                `${patient.currentProvider.user?.firstName || ''} ${patient.currentProvider.user?.lastName || ''}`.trim(),
          title: patient.currentProvider.title,
          specialty: patient.currentProvider.specialty,
          email: patient.currentProvider.user?.email
        } : null,

        location: patient.location,
        emergencyContact: patient.emergencyContact
      },

      // Activity summary
      recentActivity: {
        lastVisit: patient.serviceEpisodes[0] ? {
          date: patient.serviceEpisodes[0].scheduledDate,
          type: patient.serviceEpisodes[0].sessionType,
          provider: patient.serviceEpisodes[0].provider?.user?.name || 'Unknown Provider',
          status: patient.serviceEpisodes[0].status
        } : null,

        nextAppointment: patient.appointments[0] ? {
          date: patient.appointments[0].scheduledDate,
          time: patient.appointments[0].scheduledTime,
          type: patient.appointments[0].appointmentType,
          provider: patient.appointments[0].provider?.user?.name || 'Unknown Provider',
          location: patient.appointments[0].location?.name || 'Unknown Location'
        } : null
      },

      // Compliance status
      complianceStatus: {
        consentOnFile: patient.consentOnFile,
        hipaaAuthorizationValid: patient.hipaaAuthorizationDate ?
          healthcareValidationUtils.isValidHIPAAAuth(patient.hipaaAuthorizationDate.toISOString()) : false,
        emergencyContactComplete: patient.emergencyContact ?
          healthcareValidationUtils.validateEmergencyContact(patient.emergencyContact) : false,
        insuranceOnFile: !!(patient.insuranceProvider && patient.insurancePolicyNumber)
      }
    }

    // TODO: Create audit log entry for patient access
    // await createAuditLog({
    //   action: 'READ',
    //   tableName: 'patients',
    //   recordId: patient.id,
    //   userId: session.user.id,
    //   accessType: 'TREATMENT_RELATED'
    // })

    return successResponse(enhancedPatient, 'Patient retrieved successfully')

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// PUT /api/patients/[id] - Update patient with HIPAA compliance validation
// ============================================================================
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`PUT /api/patients/${params.id}`)

  try {
    const { id } = params
    const body = await request.json()

    // Include ID in validation data
    const validatedData: UpdatePatientInput = validateRequestBody(
      { ...body, id },
      updatePatientSchema
    )

    // Check if patient exists and is not deleted
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        isDeleted: false
      }
    })

    if (!existingPatient) {
      return Response.json({
        error: 'Patient not found'
      }, { status: 404 })
    }

    // Validate medical record number uniqueness if being updated
    if (validatedData.medicalRecordNumber &&
        validatedData.medicalRecordNumber !== existingPatient.medicalRecordNumber) {
      const duplicatePatient = await prisma.patient.findFirst({
        where: {
          medicalRecordNumber: validatedData.medicalRecordNumber,
          id: { not: id },
          isDeleted: false
        }
      })

      if (duplicatePatient) {
        return Response.json({
          error: 'Validation Error',
          details: 'Medical record number already exists'
        }, { status: 400 })
      }
    }

    // Validate location if being updated
    if (validatedData.locationId && validatedData.locationId !== existingPatient.locationId) {
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
    }

    // Remove ID from data before update
    const { id: _id, ...updateData } = validatedData

    // Update patient record
    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        ...updateData,
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

    // TODO: Create audit log entry for patient update
    // await createAuditLog({
    //   action: 'UPDATE',
    //   tableName: 'patients',
    //   recordId: id,
    //   userId: session.user.id,
    //   oldValues: JSON.stringify(existingPatient),
    //   newValues: JSON.stringify(updatedPatient)
    // })

    return successResponse(updatedPatient, 'Patient updated successfully')

  } catch (error) {
    return handleError(error)
  } finally {
    perf.end()
  }
}

// ============================================================================
// DELETE /api/patients/[id] - Soft delete patient (HIPAA compliant)
// ============================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const perf = createPerformanceLogger(`DELETE /api/patients/${params.id}`)

  try {
    const { id } = params

    // Check if patient exists and is not already deleted
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        isDeleted: false
      }
    })

    if (!existingPatient) {
      return Response.json({
        error: 'Patient not found'
      }, { status: 404 })
    }

    // Check for active treatment plans or upcoming appointments
    const [activeTreatmentPlans, upcomingAppointments] = await Promise.all([
      prisma.treatmentPlan.count({
        where: {
          patientId: id,
          status: 'ACTIVE',
          isDeleted: false
        }
      }),
      prisma.appointment.count({
        where: {
          patientId: id,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledDate: { gte: new Date() }
        }
      })
    ])

    if (activeTreatmentPlans > 0 || upcomingAppointments > 0) {
      return Response.json({
        error: 'Cannot delete patient',
        details: 'Patient has active treatment plans or upcoming appointments. Please complete or transfer before deletion.'
      }, { status: 400 })
    }

    // Soft delete patient (HIPAA requires maintaining records)
    const deletedPatient = await prisma.patient.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // TODO: Create audit log entry for patient deletion
    // await createAuditLog({
    //   action: 'DELETE',
    //   tableName: 'patients',
    //   recordId: id,
    //   userId: session.user.id,
    //   oldValues: JSON.stringify(existingPatient)
    // })

    return successResponse(
      { id: deletedPatient.id, deletedAt: deletedPatient.deletedAt },
      'Patient deleted successfully'
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