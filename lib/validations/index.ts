/**
 * Healthcare Provider Portal Validation Schemas
 *
 * Comprehensive validation for APCTC healthcare entities with HIPAA compliance,
 * field-level access control, and healthcare-specific business rules.
 */

// Patient validation schemas and types
export * from './patient'

// Family Member validation schemas and types
export * from './family-member'

// Treatment Plan validation schemas and types
export * from './treatment-plan'

// Service Episode validation schemas and types
export * from './service-episode'

// Appointment validation schemas and types
export * from './appointment'

// Legacy business CRM schemas (to be deprecated)
export * from './company'
export * from './contact'
export * from './deal'

// Re-export commonly used Zod for consistency
export { z } from 'zod'

// Healthcare-specific validation utilities
export const healthcareValidationUtils = {
  // Validate medical record number format
  validateMRN: (mrn: string): boolean => {
    return /^[A-Z0-9\-]{3,20}$/.test(mrn)
  },

  // Validate phone numbers (US format with international support)
  validatePhone: (phone: string): boolean => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone)
  },

  // Validate email addresses
  validateEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },

  // Check if patient is a minor (under 18)
  isMinor: (dateOfBirth: string): boolean => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 < 18
    }
    return age < 18
  },

  // Calculate age from date of birth
  calculateAge: (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  },

  // Validate business hours for appointments
  isBusinessHours: (time: string): boolean => {
    const [hours] = time.split(':').map(Number)
    return hours >= 6 && hours <= 22 // 6 AM to 10 PM
  },

  // Check if date is a weekend
  isWeekend: (date: string): boolean => {
    const dayOfWeek = new Date(date).getDay()
    return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
  },

  // Validate appointment duration based on service type
  validateDuration: (serviceType: string, duration: number): boolean => {
    const standardDurations: Record<string, number[]> = {
      'INTAKE_ASSESSMENT': [60, 90, 120],
      'INDIVIDUAL_COUNSELING': [45, 60],
      'GROUP_COUNSELING': [60, 90],
      'FAMILY_THERAPY': [60, 90],
      'MEDICATION_CONSULTATION': [15, 30, 45],
      'CASE_MANAGEMENT': [30, 45, 60],
      'CRISIS_SESSION': [30, 60, 90],
    }

    const allowedDurations = standardDurations[serviceType]
    return allowedDurations ? allowedDurations.includes(duration) : true
  },

  // Check for scheduling conflicts
  hasTimeConflict: (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    const startTime1 = new Date(start1).getTime()
    const endTime1 = new Date(end1).getTime()
    const startTime2 = new Date(start2).getTime()
    const endTime2 = new Date(end2).getTime()

    return startTime1 < endTime2 && startTime2 < endTime1
  },

  // Validate insurance policy number format
  validateInsurancePolicy: (policyNumber: string): boolean => {
    // Basic validation - can be enhanced based on specific insurance formats
    return /^[A-Z0-9\-]{5,20}$/.test(policyNumber)
  },

  // Check if emergency contact information is complete
  validateEmergencyContact: (contact: any): boolean => {
    return !!(
      contact.firstName &&
      contact.lastName &&
      (contact.phone || contact.mobilePhone) &&
      contact.relationshipType
    )
  },

  // Validate treatment goal measurability
  isMeasurableGoal: (goal: string): boolean => {
    // Check for measurable terms
    const measurableTerms = [
      'increase', 'decrease', 'reduce', 'improve', 'maintain',
      'frequency', 'duration', 'intensity', 'percent', '%',
      'times per', 'within', 'by', 'from', 'to'
    ]

    const goalLower = goal.toLowerCase()
    return measurableTerms.some(term => goalLower.includes(term))
  },

  // Generate medical record number (basic implementation)
  generateMRN: (locationCode: string, sequenceNumber: number): string => {
    const year = new Date().getFullYear().toString().slice(-2)
    const paddedSequence = sequenceNumber.toString().padStart(6, '0')
    return `${locationCode}${year}${paddedSequence}`
  },

  // Validate HIPAA authorization date
  isValidHIPAAAuth: (authDate: string): boolean => {
    const authDateTime = new Date(authDate)
    const now = new Date()
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

    // HIPAA authorization typically valid for 2 years
    return authDateTime >= twoYearsAgo && authDateTime <= now
  }
}

// Healthcare validation error messages
export const healthcareValidationMessages = {
  patient: {
    required: {
      firstName: 'Patient first name is required',
      lastName: 'Patient last name is required',
      locationId: 'APCTC location assignment is required',
    },
    invalid: {
      medicalRecordNumber: 'Medical record number must contain only letters, numbers, and hyphens',
      phone: 'Invalid phone number format',
      email: 'Invalid email address format',
      dateOfBirth: 'Invalid date of birth',
    },
    business: {
      duplicateMRN: 'Medical record number already exists',
      minorConsent: 'Minor patients require guardian consent',
      emergencyContactRequired: 'At least one emergency contact is required',
    }
  },

  appointment: {
    required: {
      patientId: 'Patient selection is required',
      providerId: 'Provider assignment is required',
      scheduledDate: 'Appointment date is required',
      scheduledTime: 'Appointment time is required',
    },
    invalid: {
      businessHours: 'Appointments must be scheduled during business hours (6 AM - 10 PM)',
      pastDate: 'Cannot schedule appointments in the past',
      duration: 'Invalid duration for selected service type',
    },
    business: {
      conflict: 'Provider has a scheduling conflict at this time',
      patientDoubleBooked: 'Patient already has an appointment at this time',
      locationClosed: 'Location is closed at the requested time',
    }
  },

  treatmentPlan: {
    required: {
      title: 'Treatment plan title is required',
      patientId: 'Patient assignment is required',
      treatmentGoals: 'At least one treatment goal is required',
      startDate: 'Start date is required',
    },
    invalid: {
      goalMeasurability: 'Treatment goals should be specific and measurable',
      dateRange: 'End date must be after start date',
      authorization: 'Invalid insurance authorization format',
    },
    business: {
      activePlanExists: 'Patient already has an active treatment plan',
      providerCaseload: 'Provider has reached maximum caseload',
    }
  }
}

// Healthcare business rules and constraints
export const healthcareBusinessRules = {
  patient: {
    maxEmergencyContacts: 3,
    requiredFieldsForMinors: ['emergencyContactId', 'consentOnFile'],
    maxActiveProvidersPerPatient: 3,
  },

  appointment: {
    businessHours: { start: '06:00', end: '22:00' },
    maxDurationMinutes: 480, // 8 hours
    minDurationMinutes: 15,
    maxAdvanceBookingDays: 90,
    reminderLeadTimeHours: [1, 2, 24, 48],
  },

  treatmentPlan: {
    maxDurationWeeks: 520, // 10 years
    maxGoalsPerPlan: 10,
    requiredReviewFrequencyWeeks: 12,
    maxActiveObjectives: 5,
  },

  provider: {
    maxCaseload: 100,
    maxDailyAppointments: 12,
    maxConsecutiveAppointments: 6,
    requiredBreakMinutes: 15,
  }
}

// Export types for external use
export type HealthcareValidationUtils = typeof healthcareValidationUtils
export type HealthcareValidationMessages = typeof healthcareValidationMessages
export type HealthcareBusinessRules = typeof healthcareBusinessRules