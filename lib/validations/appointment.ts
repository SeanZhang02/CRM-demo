import { z } from 'zod'

/**
 * Appointment validation schemas for healthcare provider portal
 *
 * Features:
 * - Multi-provider scheduling coordination
 * - Recurring appointment patterns
 * - Reminder and notification management
 * - No-show and cancellation tracking
 * - Telehealth and in-person scheduling
 * - Urgent and emergency appointment slots
 */

// Appointment type enum validation
export const appointmentTypeSchema = z.enum([
  'INITIAL_ASSESSMENT',
  'THERAPY_SESSION',
  'MEDICATION_REVIEW',
  'CASE_MANAGEMENT',
  'CRISIS_APPOINTMENT',
  'GROUP_SESSION',
  'FAMILY_SESSION',
  'FOLLOW_UP',
  'DISCHARGE_MEETING'
])

// Appointment status enum validation
export const appointmentStatusSchema = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
  'RESCHEDULED'
])

// Confirmation status enum validation
export const confirmationStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'DECLINED',
  'NO_RESPONSE'
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

// Recurring pattern schema
export const recurringPatternSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']),
  interval: z.number().int().positive().default(1),
  daysOfWeek: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).optional(),
  endDate: z.string().datetime().optional(),
  maxOccurrences: z.number().int().positive().optional(),
})

// Base appointment schema with all fields
export const appointmentSchema = z.object({
  // Appointment details
  scheduledDate: z
    .string()
    .datetime('Invalid scheduled date format'),

  scheduledTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 6 && hours <= 22 // Business hours 6 AM to 10 PM
    }, 'Appointment time must be between 6:00 AM and 10:00 PM'),

  durationMinutes: z
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be positive')
    .min(15, 'Minimum appointment duration is 15 minutes')
    .max(480, 'Maximum appointment duration is 8 hours')
    .default(60),

  // Appointment classification
  appointmentType: appointmentTypeSchema,
  urgency: prioritySchema.default('MEDIUM'),

  isRecurring: z
    .boolean()
    .default(false),

  recurringPattern: recurringPatternSchema.optional().nullable(),

  // Status and logistics
  status: appointmentStatusSchema.default('SCHEDULED'),
  deliveryMethod: deliveryMethodSchema.default('IN_PERSON'),
  confirmationStatus: confirmationStatusSchema.default('PENDING'),

  // Reminders and notifications
  sendReminders: z
    .boolean()
    .default(true),

  reminderHours: z
    .array(z.number().int().positive().max(168)) // Max 1 week in advance
    .default([24, 2]) // 24 hours and 2 hours before
    .optional(),

  lastReminderSent: z
    .string()
    .datetime('Invalid last reminder sent date')
    .optional()
    .nullable(),

  // Session information
  roomNumber: z
    .string()
    .max(20, 'Room number must be less than 20 characters')
    .optional()
    .nullable(),

  meetingUrl: z
    .string()
    .url('Invalid meeting URL')
    .max(500, 'Meeting URL must be less than 500 characters')
    .optional()
    .nullable(),

  specialInstructions: z
    .string()
    .max(1000, 'Special instructions must be less than 1000 characters')
    .optional()
    .nullable(),

  // No-show and cancellation tracking
  noShowReason: z
    .string()
    .max(255, 'No-show reason must be less than 255 characters')
    .optional()
    .nullable(),

  cancellationReason: z
    .string()
    .max(255, 'Cancellation reason must be less than 255 characters')
    .optional()
    .nullable(),

  rescheduledFromId: z
    .string()
    .uuid('Invalid rescheduled from appointment ID')
    .optional()
    .nullable(),

  rescheduledToId: z
    .string()
    .uuid('Invalid rescheduled to appointment ID')
    .optional()
    .nullable(),

  // Check-in tracking
  checkedInAt: z
    .string()
    .datetime('Invalid check-in time')
    .optional()
    .nullable(),

  actualStartTime: z
    .string()
    .datetime('Invalid actual start time')
    .optional()
    .nullable(),

  actualEndTime: z
    .string()
    .datetime('Invalid actual end time')
    .optional()
    .nullable(),

  // Foreign key relationships
  patientId: z
    .string()
    .uuid('Patient ID is required'),

  providerId: z
    .string()
    .uuid('Provider ID is required'),

  locationId: z
    .string()
    .uuid('Location ID is required'),

  serviceEpisodeId: z
    .string()
    .uuid('Invalid service episode ID')
    .optional()
    .nullable(),

  treatmentPlanId: z
    .string()
    .uuid('Invalid treatment plan ID')
    .optional()
    .nullable(),
})

// Create appointment schema (excludes system fields)
export const createAppointmentSchema = appointmentSchema

// Update appointment schema (all fields optional except ID)
export const updateAppointmentSchema = appointmentSchema.partial().extend({
  id: z.string().uuid('Invalid appointment ID'),
})

// Appointment availability query schema
export const availabilityQuerySchema = z.object({
  providerId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  serviceCategory: z.enum([
    'MENTAL_HEALTH',
    'CASE_MANAGEMENT',
    'MEDICAL',
    'SUBSTANCE_ABUSE',
    'CRISIS_INTERVENTION',
    'FAMILY_SUPPORT'
  ]).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  duration: z.number().int().positive().default(60), // Minutes
  patientId: z.string().uuid().optional(), // For follow-up scheduling
  urgency: prioritySchema.optional(),
})

// Appointment query/filter schema
export const appointmentQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  appointmentType: appointmentTypeSchema.optional(),
  status: appointmentStatusSchema.optional(),
  confirmationStatus: confirmationStatusSchema.optional(),
  deliveryMethod: deliveryMethodSchema.optional(),
  urgency: prioritySchema.optional(),
  scheduledAfter: z.string().datetime().optional(),
  scheduledBefore: z.string().datetime().optional(),
  todayOnly: z.boolean().default(false),
  upcomingOnly: z.boolean().default(false),
  needsReminder: z.boolean().optional(),
  sortBy: z.string().default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Provider schedule query for dashboard
export const providerScheduleQuerySchema = z.object({
  providerId: z.string().uuid(),
  date: z.string().datetime().optional(), // Specific date, defaults to today
  startDate: z.string().datetime().optional(), // Date range start
  endDate: z.string().datetime().optional(), // Date range end
  includeCompleted: z.boolean().default(true),
  includeCancelled: z.boolean().default(false),
  view: z.enum(['DAY', 'WEEK', 'MONTH']).default('DAY'),
})

// Appointment conflict check schema
export const conflictCheckSchema = z.object({
  providerId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  durationMinutes: z.number().int().positive(),
  excludeAppointmentId: z.string().uuid().optional(), // For updates
})

// Appointment summary for calendars and lists
export const appointmentSummarySchema = z.object({
  id: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string(),
  durationMinutes: z.number().int(),
  appointmentType: appointmentTypeSchema,
  status: appointmentStatusSchema,
  urgency: prioritySchema,
  deliveryMethod: deliveryMethodSchema,
  confirmationStatus: confirmationStatusSchema,
  patient: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    medicalRecordNumber: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  provider: z.object({
    id: z.string().uuid(),
    name: z.string(),
    title: z.string(),
  }),
  location: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  roomNumber: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  isUrgent: z.boolean(),
  needsReminder: z.boolean(),
  canCheckIn: z.boolean(),
  alertFlags: z.array(z.string()),
})

// Available time slot schema
export const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().int().positive(),
  isAvailable: z.boolean(),
  providerId: z.string().uuid(),
  locationId: z.string().uuid(),
  conflictReason: z.string().optional(), // If not available
})

// TypeScript types derived from schemas
export type Appointment = z.infer<typeof appointmentSchema>
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>
export type ProviderScheduleQueryInput = z.infer<typeof providerScheduleQuerySchema>
export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>
export type AppointmentSummary = z.infer<typeof appointmentSummarySchema>
export type TimeSlot = z.infer<typeof timeSlotSchema>
export type RecurringPattern = z.infer<typeof recurringPatternSchema>

// Appointment type options for forms
export const appointmentTypeOptions = [
  { value: 'INITIAL_ASSESSMENT', label: 'Initial Assessment', duration: 90, color: 'blue' },
  { value: 'THERAPY_SESSION', label: 'Therapy Session', duration: 60, color: 'green' },
  { value: 'MEDICATION_REVIEW', label: 'Medication Review', duration: 30, color: 'purple' },
  { value: 'CASE_MANAGEMENT', label: 'Case Management', duration: 45, color: 'orange' },
  { value: 'CRISIS_APPOINTMENT', label: 'Crisis Appointment', duration: 60, color: 'red' },
  { value: 'GROUP_SESSION', label: 'Group Session', duration: 90, color: 'teal' },
  { value: 'FAMILY_SESSION', label: 'Family Session', duration: 60, color: 'indigo' },
  { value: 'FOLLOW_UP', label: 'Follow-up', duration: 30, color: 'gray' },
  { value: 'DISCHARGE_MEETING', label: 'Discharge Meeting', duration: 45, color: 'yellow' },
] as const

// Appointment status options for forms
export const appointmentStatusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled', color: 'blue' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'green' },
  { value: 'CHECKED_IN', label: 'Checked In', color: 'yellow' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'orange' },
  { value: 'COMPLETED', label: 'Completed', color: 'gray' },
  { value: 'NO_SHOW', label: 'No Show', color: 'red' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
  { value: 'RESCHEDULED', label: 'Rescheduled', color: 'purple' },
] as const

// Confirmation status options for forms
export const confirmationStatusOptions = [
  { value: 'PENDING', label: 'Pending Confirmation', color: 'yellow' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'green' },
  { value: 'DECLINED', label: 'Declined', color: 'red' },
  { value: 'NO_RESPONSE', label: 'No Response', color: 'gray' },
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

// Recurring frequency options for forms
export const recurringFrequencyOptions = [
  { value: 'WEEKLY', label: 'Weekly', description: 'Same day and time each week' },
  { value: 'BIWEEKLY', label: 'Bi-weekly', description: 'Every two weeks' },
  { value: 'MONTHLY', label: 'Monthly', description: 'Same date each month' },
  { value: 'CUSTOM', label: 'Custom', description: 'Custom recurring pattern' },
] as const

// Day of week options for recurring appointments
export const dayOfWeekOptions = [
  { value: 'MONDAY', label: 'Monday', short: 'Mon' },
  { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { value: 'SUNDAY', label: 'Sunday', short: 'Sun' },
] as const

// Standard appointment durations
export const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
] as const

// Reminder timing options (hours before appointment)
export const reminderOptions = [
  { value: 1, label: '1 hour before' },
  { value: 2, label: '2 hours before' },
  { value: 4, label: '4 hours before' },
  { value: 24, label: '1 day before' },
  { value: 48, label: '2 days before' },
  { value: 168, label: '1 week before' },
] as const

// No-show reason options
export const noShowReasonOptions = [
  'Patient forgot appointment',
  'Transportation issues',
  'Work/school conflict',
  'Illness',
  'Family emergency',
  'Weather conditions',
  'Unable to contact patient',
  'Other',
] as const

// Cancellation reason options
export const cancellationReasonOptions = [
  'Patient requested',
  'Provider unavailable',
  'Facility closed',
  'Emergency situation',
  'Insurance issue',
  'Patient no longer needs service',
  'Rescheduled to different time',
  'Technical issues (telehealth)',
  'Other',
] as const