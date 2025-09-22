import { z } from 'zod'

/**
 * Treatment Plan validation schemas for healthcare provider portal
 *
 * Features:
 * - Long-term care coordination and planning
 * - Treatment goal tracking with measurable outcomes
 * - Insurance authorization management
 * - Service category classification
 * - Progress monitoring and review cycles
 */

// Treatment type enum validation
export const treatmentTypeSchema = z.enum([
  'INDIVIDUAL_THERAPY',
  'GROUP_THERAPY',
  'FAMILY_THERAPY',
  'COUPLES_THERAPY',
  'MEDICATION_MANAGEMENT',
  'CASE_MANAGEMENT',
  'ASSESSMENT',
  'CRISIS_INTERVENTION',
  'COMMUNITY_EDUCATION',
  'PREVENTION_SERVICES'
])

// Treatment status enum validation
export const treatmentStatusSchema = z.enum([
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'DISCONTINUED',
  'TRANSFERRED'
])

// Priority enum validation
export const prioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
  'CRITICAL'
])

// Goal status enum validation
export const goalStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'ACHIEVED',
  'MODIFIED',
  'DISCONTINUED'
])

// Treatment goal schema
export const treatmentGoalSchema = z.object({
  id: z.string().uuid().optional(),
  description: z
    .string()
    .min(1, 'Goal description is required')
    .max(500, 'Goal description must be less than 500 characters'),
  targetDate: z
    .string()
    .datetime('Invalid target date format')
    .optional()
    .nullable(),
  priority: prioritySchema,
  measureable: z.boolean().default(true),
  status: goalStatusSchema.default('NOT_STARTED'),
  progressNotes: z
    .string()
    .max(1000, 'Progress notes must be less than 1000 characters')
    .optional()
    .nullable(),
})

// Progress metric schema
export const progressMetricSchema = z.object({
  id: z.string().uuid().optional(),
  metricName: z
    .string()
    .min(1, 'Metric name is required')
    .max(100, 'Metric name must be less than 100 characters'),
  baseline: z.number().optional().nullable(),
  target: z.number(),
  current: z.number().optional().nullable(),
  unit: z
    .string()
    .max(20, 'Unit must be less than 20 characters'),
  lastUpdated: z
    .string()
    .datetime('Invalid last updated date')
    .optional()
    .nullable(),
})

// Care team member schema
export const careTeamMemberSchema = z.object({
  id: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  role: z
    .string()
    .max(100, 'Role must be less than 100 characters'),
  isPrimary: z.boolean().default(false),
  startDate: z
    .string()
    .datetime('Invalid start date format'),
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional()
    .nullable(),
})

// Plan objective schema
export const planObjectiveSchema = z.object({
  id: z.string().uuid().optional(),
  description: z
    .string()
    .min(1, 'Objective description is required')
    .max(500, 'Objective description must be less than 500 characters'),
  targetDate: z
    .string()
    .datetime('Invalid target date format')
    .optional()
    .nullable(),
  status: goalStatusSchema.default('NOT_STARTED'),
  progressMetrics: z.array(progressMetricSchema).optional(),
})

// Intervention schema
export const interventionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, 'Intervention name is required')
    .max(100, 'Intervention name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Intervention description must be less than 500 characters')
    .optional()
    .nullable(),
  frequency: z
    .string()
    .max(50, 'Frequency must be less than 50 characters')
    .optional()
    .nullable(),
  duration: z
    .string()
    .max(50, 'Duration must be less than 50 characters')
    .optional()
    .nullable(),
})

// Base treatment plan schema with all fields
export const treatmentPlanSchema = z.object({
  title: z
    .string()
    .min(1, 'Treatment plan title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),

  // Treatment Planning Details
  treatmentType: treatmentTypeSchema,

  primaryDiagnosis: z
    .string()
    .max(255, 'Primary diagnosis must be less than 255 characters')
    .optional()
    .nullable(),

  secondaryDiagnoses: z
    .array(z.string().max(255, 'Secondary diagnosis must be less than 255 characters'))
    .optional()
    .nullable(),

  treatmentGoals: z
    .array(treatmentGoalSchema)
    .min(1, 'At least one treatment goal is required'),

  // Timeline and Progress
  startDate: z
    .string()
    .datetime('Invalid start date format'),

  reviewDate: z
    .string()
    .datetime('Invalid review date format')
    .optional()
    .nullable(),

  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional()
    .nullable(),

  expectedDuration: z
    .number()
    .int('Expected duration must be a whole number')
    .positive('Expected duration must be positive')
    .max(520, 'Expected duration cannot exceed 10 years (520 weeks)')
    .optional()
    .nullable(),

  // Treatment coordination
  status: treatmentStatusSchema.default('ACTIVE'),
  priority: prioritySchema.default('MEDIUM'),

  // Insurance and Authorization
  insuranceAuthorization: z
    .string()
    .max(100, 'Insurance authorization must be less than 100 characters')
    .optional()
    .nullable(),

  sessionsAuthorized: z
    .number()
    .int('Sessions authorized must be a whole number')
    .positive('Sessions authorized must be positive')
    .max(1000, 'Sessions authorized cannot exceed 1000')
    .optional()
    .nullable(),

  sessionsCompleted: z
    .number()
    .int('Sessions completed must be a whole number')
    .min(0, 'Sessions completed cannot be negative')
    .default(0)
    .optional(),

  sessionsRemaining: z
    .number()
    .int('Sessions remaining must be a whole number')
    .min(0, 'Sessions remaining cannot be negative')
    .optional()
    .nullable(),

  // Plan details
  objectives: z.array(planObjectiveSchema).optional(),
  interventions: z.array(interventionSchema).optional(),
  measurementTools: z
    .array(z.string().max(100, 'Measurement tool name must be less than 100 characters'))
    .optional(),

  // Care team
  careTeam: z.array(careTeamMemberSchema).optional(),

  // Progress tracking
  progressNotes: z
    .string()
    .max(2000, 'Progress notes must be less than 2000 characters')
    .optional()
    .nullable(),

  outcomesMeasures: z
    .string()
    .max(1000, 'Outcomes measures must be less than 1000 characters')
    .optional()
    .nullable(),

  // Foreign key relationships
  patientId: z
    .string()
    .uuid('Invalid patient ID')
    .optional()
    .nullable(),

  primaryProviderId: z
    .string()
    .uuid('Invalid provider ID')
    .optional()
    .nullable(),

  // Status tracking
  approvalRequired: z
    .boolean()
    .default(false)
    .optional(),
})

// Create treatment plan schema (excludes system fields)
export const createTreatmentPlanSchema = treatmentPlanSchema

// Update treatment plan schema (all fields optional except ID)
export const updateTreatmentPlanSchema = treatmentPlanSchema.partial().extend({
  id: z.string().uuid('Invalid treatment plan ID'),
})

// Treatment plan query/filter schema
export const treatmentPlanQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().uuid().optional(),
  primaryProviderId: z.string().uuid().optional(),
  treatmentType: treatmentTypeSchema.optional(),
  status: treatmentStatusSchema.optional(),
  priority: prioritySchema.optional(),
  startDateAfter: z.string().datetime().optional(),
  startDateBefore: z.string().datetime().optional(),
  reviewDue: z.boolean().optional(), // Plans due for review
  authorizationExpiring: z.boolean().optional(), // Plans with expiring insurance authorization
  sortBy: z.string().default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Treatment plan summary for patient view
export const treatmentPlanSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  treatmentType: treatmentTypeSchema,
  status: treatmentStatusSchema,
  priority: prioritySchema,
  startDate: z.string().datetime(),
  reviewDate: z.string().datetime().nullable(),
  primaryProvider: z.object({
    id: z.string().uuid(),
    name: z.string(),
    title: z.string(),
  }).optional(),
  goalsCount: z.number().int(),
  goalsAchieved: z.number().int(),
  sessionsCompleted: z.number().int(),
  sessionsRemaining: z.number().int().nullable(),
  needsReview: z.boolean(),
  authorizationStatus: z.enum(['VALID', 'EXPIRING', 'EXPIRED', 'PENDING']),
})

// TypeScript types derived from schemas
export type TreatmentPlan = z.infer<typeof treatmentPlanSchema>
export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>
export type TreatmentPlanQueryInput = z.infer<typeof treatmentPlanQuerySchema>
export type TreatmentPlanSummary = z.infer<typeof treatmentPlanSummarySchema>
export type TreatmentGoal = z.infer<typeof treatmentGoalSchema>
export type ProgressMetric = z.infer<typeof progressMetricSchema>
export type CareTeamMember = z.infer<typeof careTeamMemberSchema>
export type PlanObjective = z.infer<typeof planObjectiveSchema>
export type Intervention = z.infer<typeof interventionSchema>

// Treatment type options for forms
export const treatmentTypeOptions = [
  { value: 'INDIVIDUAL_THERAPY', label: 'Individual Therapy' },
  { value: 'GROUP_THERAPY', label: 'Group Therapy' },
  { value: 'FAMILY_THERAPY', label: 'Family Therapy' },
  { value: 'COUPLES_THERAPY', label: 'Couples Therapy' },
  { value: 'MEDICATION_MANAGEMENT', label: 'Medication Management' },
  { value: 'CASE_MANAGEMENT', label: 'Case Management' },
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'CRISIS_INTERVENTION', label: 'Crisis Intervention' },
  { value: 'COMMUNITY_EDUCATION', label: 'Community Education' },
  { value: 'PREVENTION_SERVICES', label: 'Prevention Services' },
] as const

// Treatment status options for forms
export const treatmentStatusOptions = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'yellow' },
  { value: 'COMPLETED', label: 'Completed', color: 'blue' },
  { value: 'DISCONTINUED', label: 'Discontinued', color: 'red' },
  { value: 'TRANSFERRED', label: 'Transferred', color: 'orange' },
] as const

// Priority options for forms
export const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'gray' },
  { value: 'MEDIUM', label: 'Medium', color: 'blue' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
  { value: 'CRITICAL', label: 'Critical', color: 'purple' },
] as const

// Goal status options for forms
export const goalStatusOptions = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'gray' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
  { value: 'ACHIEVED', label: 'Achieved', color: 'green' },
  { value: 'MODIFIED', label: 'Modified', color: 'yellow' },
  { value: 'DISCONTINUED', label: 'Discontinued', color: 'red' },
] as const

// Common measurement tools for treatment planning
export const measurementToolOptions = [
  'PHQ-9 (Depression)',
  'GAD-7 (Anxiety)',
  'Beck Depression Inventory',
  'Beck Anxiety Inventory',
  'DASS-21 (Depression, Anxiety, Stress)',
  'Mood Disorder Questionnaire',
  'PTSD Checklist for DSM-5',
  'Trauma Symptom Inventory',
  'CAGE Questionnaire (Substance Use)',
  'AUDIT (Alcohol Use)',
  'Functional Assessment Rating Scale',
  'Global Assessment of Functioning',
  'Custom Rating Scale',
] as const

// Common therapeutic interventions
export const interventionOptions = [
  'Cognitive Behavioral Therapy (CBT)',
  'Dialectical Behavior Therapy (DBT)',
  'Acceptance and Commitment Therapy (ACT)',
  'Motivational Interviewing',
  'Trauma-Focused CBT',
  'EMDR (Eye Movement Desensitization)',
  'Solution-Focused Brief Therapy',
  'Mindfulness-Based Therapy',
  'Psychodynamic Therapy',
  'Interpersonal Therapy',
  'Exposure Therapy',
  'Behavioral Activation',
  'Group Process Therapy',
  'Family Systems Therapy',
  'Crisis Counseling',
  'Case Management Services',
  'Psychoeducation',
  'Skill Building',
  'Relapse Prevention',
  'Medication Management Support',
] as const