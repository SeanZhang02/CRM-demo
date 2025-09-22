import { z } from 'zod'

/**
 * Patient validation schemas for healthcare provider portal
 *
 * Features:
 * - HIPAA-compliant field validation
 * - Medical record number validation
 * - Patient status and risk level management
 * - Location-based data isolation
 * - Emergency contact relationships
 */

// Gender enum validation
export const genderSchema = z.enum([
  'MALE',
  'FEMALE',
  'NON_BINARY',
  'OTHER',
  'PREFER_NOT_TO_SAY'
])

// Patient status enum validation
export const patientStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'WAITLIST',
  'DISCHARGED',
  'TRANSFERRED',
  'DECEASED'
])

// Risk level enum validation
export const riskLevelSchema = z.enum([
  'LOW',
  'MODERATE',
  'HIGH',
  'CRITICAL'
])

// Base patient schema with all fields
export const patientSchema = z.object({
  // Basic Demographics (PHI)
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),

  dateOfBirth: z
    .string()
    .datetime('Invalid date of birth format')
    .optional()
    .nullable(),

  gender: genderSchema.optional().nullable(),

  preferredLanguage: z
    .string()
    .max(50, 'Preferred language must be less than 50 characters')
    .default('English')
    .optional(),

  // Contact Information (PHI)
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .nullable(),

  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .nullable(),

  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .nullable(),

  state: z
    .string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .nullable(),

  postalCode: z
    .string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .nullable(),

  country: z
    .string()
    .max(100, 'Country must be less than 100 characters')
    .default('USA')
    .optional(),

  // Healthcare-Specific Fields
  medicalRecordNumber: z
    .string()
    .min(1, 'Medical record number is required')
    .max(50, 'Medical record number must be less than 50 characters')
    .regex(/^[A-Z0-9\-]+$/, 'Medical record number must contain only letters, numbers, and hyphens')
    .optional()
    .nullable(),

  primaryDiagnosis: z
    .string()
    .max(255, 'Primary diagnosis must be less than 255 characters')
    .optional()
    .nullable(),

  insuranceProvider: z
    .string()
    .max(255, 'Insurance provider must be less than 255 characters')
    .optional()
    .nullable(),

  insurancePolicyNumber: z
    .string()
    .max(100, 'Insurance policy number must be less than 100 characters')
    .optional()
    .nullable(),

  emergencyContactId: z
    .string()
    .uuid('Invalid emergency contact ID')
    .optional()
    .nullable(),

  currentProviderId: z
    .string()
    .uuid('Invalid provider ID')
    .optional()
    .nullable(),

  locationId: z
    .string()
    .uuid('Location ID is required'),

  // Patient Status and Care Management
  patientStatus: patientStatusSchema.default('ACTIVE'),

  riskLevel: riskLevelSchema.default('LOW'),

  consentOnFile: z
    .boolean()
    .default(false),

  hipaaAuthorizationDate: z
    .string()
    .datetime('Invalid HIPAA authorization date')
    .optional()
    .nullable(),
})

// Create patient schema (excludes system fields)
export const createPatientSchema = patientSchema

// Update patient schema (all fields optional except ID)
export const updatePatientSchema = patientSchema.partial().extend({
  id: z.string().uuid('Invalid patient ID'),
})

// Patient search/query schema for the "find patient" workflow
export const patientSearchSchema = z.object({
  // Quick search fields (99% use case)
  query: z.string().optional(), // Searches name, MRN, phone, DOB
  medicalRecordNumber: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),

  // Advanced search
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  socialSecurityLast4: z.string().length(4, 'Last 4 digits of SSN must be exactly 4 characters').optional(),

  // Site and service filtering
  siteId: z.string().uuid().optional(),
  serviceCategory: z.enum([
    'MENTAL_HEALTH',
    'CASE_MANAGEMENT',
    'MEDICAL',
    'SUBSTANCE_ABUSE',
    'CRISIS_INTERVENTION',
    'FAMILY_SUPPORT'
  ]).optional(),
  assignedProvider: z.string().uuid().optional(),

  // Status filtering
  patientStatus: patientStatusSchema.optional(),
  isActive: z.boolean().optional(),
  riskLevel: riskLevelSchema.optional(),

  // Date ranges
  lastVisitAfter: z.string().datetime().optional(),
  lastVisitBefore: z.string().datetime().optional(),

  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // Sorting
  sortBy: z.enum(['lastName', 'firstName', 'medicalRecordNumber', 'createdAt', 'lastVisit']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Patient summary response schema (for search results)
export const patientSummarySchema = z.object({
  id: z.string().uuid(),
  medicalRecordNumber: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().nullable(),
  phone: z.string().nullable(),

  // Key provider information
  primaryProvider: z.object({
    id: z.string().uuid(),
    name: z.string(),
    title: z.string(),
  }).optional(),

  lastVisit: z.object({
    date: z.string().datetime(),
    serviceType: z.string(),
    provider: z.string(),
  }).optional(),

  activeServices: z.array(z.string()),
  patientStatus: patientStatusSchema,
  riskLevel: riskLevelSchema,
  siteId: z.string().uuid(),
  siteName: z.string(),

  // Quick access flags
  hasActiveTreatmentPlan: z.boolean(),
  hasUpcomingAppointments: z.boolean(),
  requiresFollowUp: z.boolean(),
  alertFlags: z.array(z.string()),
})

// Patient query/filter schema for reports and analytics
export const patientQuerySchema = z.object({
  search: z.string().optional(),
  patientStatus: patientStatusSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  locationId: z.string().uuid().optional(),
  currentProviderId: z.string().uuid().optional(),
  sortBy: z.string().default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// TypeScript types derived from schemas
export type Patient = z.infer<typeof patientSchema>
export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
export type PatientSearchInput = z.infer<typeof patientSearchSchema>
export type PatientSummary = z.infer<typeof patientSummarySchema>
export type PatientQueryInput = z.infer<typeof patientQuerySchema>

// Patient status options for forms
export const patientStatusOptions = [
  { value: 'ACTIVE', label: 'Active - Currently receiving treatment' },
  { value: 'INACTIVE', label: 'Inactive - Not currently in treatment' },
  { value: 'WAITLIST', label: 'Waitlist - Waiting for services' },
  { value: 'DISCHARGED', label: 'Discharged - Successfully completed treatment' },
  { value: 'TRANSFERRED', label: 'Transferred - Moved to another provider/location' },
  { value: 'DECEASED', label: 'Deceased' },
] as const

// Risk level options for forms
export const riskLevelOptions = [
  { value: 'LOW', label: 'Low Risk', color: 'green' },
  { value: 'MODERATE', label: 'Moderate Risk', color: 'yellow' },
  { value: 'HIGH', label: 'High Risk', color: 'orange' },
  { value: 'CRITICAL', label: 'Critical Risk', color: 'red' },
] as const

// Gender options for forms
export const genderOptions = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-Binary' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const

// Service category options for patient filtering
export const serviceCategoryOptions = [
  { value: 'MENTAL_HEALTH', label: 'Mental Health Counseling' },
  { value: 'CASE_MANAGEMENT', label: 'Case Management' },
  { value: 'MEDICAL', label: 'Medical Services' },
  { value: 'SUBSTANCE_ABUSE', label: 'Substance Abuse Treatment' },
  { value: 'CRISIS_INTERVENTION', label: 'Crisis Intervention' },
  { value: 'FAMILY_SUPPORT', label: 'Family Support Services' },
] as const

// Common languages for APCTC patient population
export const languageOptions = [
  'English',
  'Spanish',
  'Mandarin',
  'Cantonese',
  'Vietnamese',
  'Korean',
  'Tagalog',
  'Hindi',
  'Urdu',
  'Arabic',
  'Russian',
  'Other',
] as const