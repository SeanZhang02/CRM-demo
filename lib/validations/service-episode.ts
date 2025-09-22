import { z } from 'zod'

/**
 * Service Episode validation schemas for healthcare provider portal
 *
 * Features:
 * - Clinical session documentation and tracking
 * - Multi-modal service delivery (in-person, telehealth, phone)
 * - Billing code integration and service units
 * - Appointment linking and outcome tracking
 * - Provider scheduling and caseload management
 */

// Service type enum validation
export const serviceTypeSchema = z.enum([
  'INTAKE_ASSESSMENT',
  'INDIVIDUAL_COUNSELING',
  'GROUP_COUNSELING',
  'FAMILY_THERAPY',
  'MEDICATION_CONSULTATION',
  'CASE_MANAGEMENT',
  'CRISIS_SESSION',
  'COMMUNITY_EDUCATION',
  'PREVENTION_WORKSHOP',
  'FOLLOW_UP',
  'DISCHARGE_PLANNING'
])

// Episode status enum validation
export const episodeStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
  'RESCHEDULED'
])

// Delivery method enum validation
export const deliveryMethodSchema = z.enum([
  'IN_PERSON',
  'TELEHEALTH',
  'PHONE',
  'HOME_VISIT',
  'COMMUNITY_BASED'
])

// Priority enum validation
export const prioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
  'CRITICAL'
])

// Service outcome enum validation
export const serviceOutcomeSchema = z.enum([
  'GOAL_MET',
  'PARTIAL_PROGRESS',
  'NO_PROGRESS',
  'REGRESSION',
  'CRISIS_RESOLVED',
  'REFERRAL_MADE',
  'PLAN_MODIFIED',
  'SESSION_TERMINATED_EARLY'
])

// Base service episode schema with all fields
export const serviceEpisodeSchema = z.object({
  // Session Details
  sessionType: serviceTypeSchema,

  subject: z
    .string()
    .min(1, 'Session subject is required')
    .max(255, 'Subject must be less than 255 characters')
    .trim(),

  sessionNotes: z
    .string()
    .max(5000, 'Session notes must be less than 5000 characters')
    .optional()
    .nullable(),

  // Scheduling and completion
  scheduledDate: z
    .string()
    .datetime('Invalid scheduled date format')
    .optional()
    .nullable(),

  actualStartTime: z
    .string()
    .datetime('Invalid actual start time format')
    .optional()
    .nullable(),

  actualEndTime: z
    .string()
    .datetime('Invalid actual end time format')
    .optional()
    .nullable(),

  durationMinutes: z
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be positive')
    .max(480, 'Duration cannot exceed 8 hours (480 minutes)')
    .optional()
    .nullable(),

  // Episode status and priority
  status: episodeStatusSchema.default('SCHEDULED'),
  priority: prioritySchema.default('MEDIUM'),

  // Location and delivery method
  deliveryMethod: deliveryMethodSchema.default('IN_PERSON'),

  locationId: z
    .string()
    .uuid('Invalid location ID')
    .optional()
    .nullable(),

  meetingUrl: z
    .string()
    .url('Invalid meeting URL')
    .max(500, 'Meeting URL must be less than 500 characters')
    .optional()
    .nullable(),

  roomNumber: z
    .string()
    .max(20, 'Room number must be less than 20 characters')
    .optional()
    .nullable(),

  // Clinical and billing information
  billingCode: z
    .string()
    .max(20, 'Billing code must be less than 20 characters')
    .optional()
    .nullable(),

  serviceUnits: z
    .number()
    .positive('Service units must be positive')
    .max(24, 'Service units cannot exceed 24')
    .default(1.0)
    .optional(),

  sessionOutcome: serviceOutcomeSchema.optional().nullable(),

  nextSessionRecommendation: z
    .string()
    .max(500, 'Next session recommendation must be less than 500 characters')
    .optional()
    .nullable(),

  // Foreign key relationships
  patientId: z
    .string()
    .uuid('Invalid patient ID')
    .optional()
    .nullable(),

  familyMemberId: z
    .string()
    .uuid('Invalid family member ID')
    .optional()
    .nullable(),

  treatmentPlanId: z
    .string()
    .uuid('Invalid treatment plan ID')
    .optional()
    .nullable(),

  providerId: z
    .string()
    .uuid('Invalid provider ID')
    .optional()
    .nullable(),

  appointmentId: z
    .string()
    .uuid('Invalid appointment ID')
    .optional()
    .nullable(),
})

// Create service episode schema (excludes system fields)
export const createServiceEpisodeSchema = serviceEpisodeSchema

// Update service episode schema (all fields optional except ID)
export const updateServiceEpisodeSchema = serviceEpisodeSchema.partial().extend({
  id: z.string().uuid('Invalid service episode ID'),
})

// Service episode query/filter schema
export const serviceEpisodeQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  treatmentPlanId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  sessionType: serviceTypeSchema.optional(),
  status: episodeStatusSchema.optional(),
  deliveryMethod: deliveryMethodSchema.optional(),
  priority: prioritySchema.optional(),
  scheduledAfter: z.string().datetime().optional(),
  scheduledBefore: z.string().datetime().optional(),
  completedAfter: z.string().datetime().optional(),
  completedBefore: z.string().datetime().optional(),
  sortBy: z.string().default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Provider schedule query schema
export const providerScheduleQuerySchema = z.object({
  providerId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeCompleted: z.boolean().default(true),
  includeScheduled: z.boolean().default(true),
  includeCancelled: z.boolean().default(false),
})

// Service episode summary for patient timeline
export const serviceEpisodeSummarySchema = z.object({
  id: z.string().uuid(),
  sessionType: serviceTypeSchema,
  subject: z.string(),
  status: episodeStatusSchema,
  priority: prioritySchema,
  scheduledDate: z.string().datetime().nullable(),
  actualStartTime: z.string().datetime().nullable(),
  actualEndTime: z.string().datetime().nullable(),
  durationMinutes: z.number().int().nullable(),
  deliveryMethod: deliveryMethodSchema,
  provider: z.object({
    id: z.string().uuid(),
    name: z.string(),
    title: z.string(),
  }).optional(),
  location: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).optional(),
  sessionOutcome: serviceOutcomeSchema.nullable(),
  billingCode: z.string().nullable(),
  serviceUnits: z.number(),
  hasNotes: z.boolean(),
})

// Daily schedule item for provider dashboard
export const scheduleItemSchema = z.object({
  id: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  actualStartTime: z.string().datetime().nullable(),
  durationMinutes: z.number().int(),
  sessionType: serviceTypeSchema,
  subject: z.string(),
  status: episodeStatusSchema,
  priority: prioritySchema,
  deliveryMethod: deliveryMethodSchema,
  roomNumber: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  patient: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    medicalRecordNumber: z.string().nullable(),
  }),
  isUrgent: z.boolean(),
  alertFlags: z.array(z.string()),
})

// Session note template schema
export const sessionNoteTemplateSchema = z.object({
  sessionType: serviceTypeSchema,
  template: z.string().max(2000, 'Template must be less than 2000 characters'),
  requiredFields: z.array(z.string()).optional(),
  additionalPrompts: z.array(z.string()).optional(),
})

// TypeScript types derived from schemas
export type ServiceEpisode = z.infer<typeof serviceEpisodeSchema>
export type CreateServiceEpisodeInput = z.infer<typeof createServiceEpisodeSchema>
export type UpdateServiceEpisodeInput = z.infer<typeof updateServiceEpisodeSchema>
export type ServiceEpisodeQueryInput = z.infer<typeof serviceEpisodeQuerySchema>
export type ProviderScheduleQueryInput = z.infer<typeof providerScheduleQuerySchema>
export type ServiceEpisodeSummary = z.infer<typeof serviceEpisodeSummarySchema>
export type ScheduleItem = z.infer<typeof scheduleItemSchema>
export type SessionNoteTemplate = z.infer<typeof sessionNoteTemplateSchema>

// Service type options for forms
export const serviceTypeOptions = [
  { value: 'INTAKE_ASSESSMENT', label: 'Intake Assessment', duration: 90, billingCode: '90791' },
  { value: 'INDIVIDUAL_COUNSELING', label: 'Individual Counseling', duration: 60, billingCode: '90834' },
  { value: 'GROUP_COUNSELING', label: 'Group Counseling', duration: 90, billingCode: '90853' },
  { value: 'FAMILY_THERAPY', label: 'Family Therapy', duration: 60, billingCode: '90837' },
  { value: 'MEDICATION_CONSULTATION', label: 'Medication Consultation', duration: 30, billingCode: '90862' },
  { value: 'CASE_MANAGEMENT', label: 'Case Management', duration: 45, billingCode: 'T1017' },
  { value: 'CRISIS_SESSION', label: 'Crisis Session', duration: 60, billingCode: '90834' },
  { value: 'COMMUNITY_EDUCATION', label: 'Community Education', duration: 120, billingCode: 'G0177' },
  { value: 'PREVENTION_WORKSHOP', label: 'Prevention Workshop', duration: 90, billingCode: 'G0177' },
  { value: 'FOLLOW_UP', label: 'Follow-up Session', duration: 30, billingCode: '90834' },
  { value: 'DISCHARGE_PLANNING', label: 'Discharge Planning', duration: 45, billingCode: '90837' },
] as const

// Episode status options for forms
export const episodeStatusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled', color: 'blue' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'yellow' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'NO_SHOW', label: 'No Show', color: 'red' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
  { value: 'RESCHEDULED', label: 'Rescheduled', color: 'orange' },
] as const

// Delivery method options for forms
export const deliveryMethodOptions = [
  { value: 'IN_PERSON', label: 'In Person', icon: 'building' },
  { value: 'TELEHEALTH', label: 'Telehealth', icon: 'video' },
  { value: 'PHONE', label: 'Phone', icon: 'phone' },
  { value: 'HOME_VISIT', label: 'Home Visit', icon: 'home' },
  { value: 'COMMUNITY_BASED', label: 'Community-Based', icon: 'users' },
] as const

// Priority options for forms
export const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'gray' },
  { value: 'MEDIUM', label: 'Medium', color: 'blue' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
  { value: 'CRITICAL', label: 'Critical', color: 'purple' },
] as const

// Service outcome options for forms
export const serviceOutcomeOptions = [
  { value: 'GOAL_MET', label: 'Goal Met', color: 'green' },
  { value: 'PARTIAL_PROGRESS', label: 'Partial Progress', color: 'yellow' },
  { value: 'NO_PROGRESS', label: 'No Progress', color: 'gray' },
  { value: 'REGRESSION', label: 'Regression', color: 'red' },
  { value: 'CRISIS_RESOLVED', label: 'Crisis Resolved', color: 'blue' },
  { value: 'REFERRAL_MADE', label: 'Referral Made', color: 'purple' },
  { value: 'PLAN_MODIFIED', label: 'Plan Modified', color: 'orange' },
  { value: 'SESSION_TERMINATED_EARLY', label: 'Session Terminated Early', color: 'red' },
] as const

// Common billing codes for mental health services
export const billingCodeOptions = [
  { code: '90791', description: 'Psychiatric diagnostic evaluation' },
  { code: '90834', description: 'Psychotherapy, 45 minutes' },
  { code: '90837', description: 'Psychotherapy, 60 minutes' },
  { code: '90847', description: 'Family psychotherapy with patient present' },
  { code: '90853', description: 'Group psychotherapy' },
  { code: '90862', description: 'Medication management' },
  { code: '96116', description: 'Neurobehavioral status exam' },
  { code: 'T1017', description: 'Targeted case management' },
  { code: 'G0177', description: 'Training and educational services' },
  { code: 'H0031', description: 'Mental health assessment' },
  { code: 'H0032', description: 'Mental health service plan development' },
  { code: 'H0036', description: 'Community psychiatric supportive treatment' },
] as const

// Session note templates for different service types
export const sessionNoteTemplates = {
  INTAKE_ASSESSMENT: {
    template: `
PRESENTING CONCERNS:
-

MENTAL STATUS EXAM:
- Appearance:
- Behavior:
- Speech:
- Mood:
- Affect:
- Thought Process:
- Thought Content:
- Perception:
- Cognition:
- Insight:
- Judgment:

RISK ASSESSMENT:
- Suicidal ideation:
- Homicidal ideation:
- Risk factors:
- Protective factors:

INITIAL TREATMENT PLAN:
- Goals:
- Recommended frequency:
- Interventions:

NEXT STEPS:
-
    `,
    requiredFields: ['presentingConcerns', 'riskAssessment', 'initialPlan'],
  },

  INDIVIDUAL_COUNSELING: {
    template: `
SESSION FOCUS:
-

INTERVENTIONS USED:
-

PATIENT RESPONSE:
-

PROGRESS TOWARD GOALS:
-

HOMEWORK/BETWEEN-SESSION TASKS:
-

PLAN FOR NEXT SESSION:
-
    `,
    requiredFields: ['sessionFocus', 'interventions', 'progress'],
  },

  CRISIS_SESSION: {
    template: `
CRISIS PRESENTATION:
-

IMMEDIATE SAFETY CONCERNS:
-

INTERVENTIONS PROVIDED:
-

RISK MITIGATION STRATEGIES:
-

SAFETY PLAN DEVELOPED:
-

FOLLOW-UP PLAN:
-

DISPOSITION:
-
    `,
    requiredFields: ['crisisPresentation', 'safetyPlan', 'disposition'],
  },
} as const