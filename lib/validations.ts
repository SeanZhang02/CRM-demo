import { z } from 'zod'

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

const phoneRegex = /^\+?[1-9]\d{1,14}$/
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

// ============================================================================
// COMPANY VALIDATIONS
// ============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  industry: z.string().max(100).optional(),
  website: z.string().regex(urlRegex, 'Invalid URL format').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  companySize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'PROSPECT', 'CUSTOMER', 'INACTIVE', 'CHURNED']).default('PROSPECT'),
  annualRevenue: z.number().positive().optional(),
  employeeCount: z.number().int().positive().optional()
})

export const updateCompanySchema = createCompanySchema.partial()

export const companyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(['ACTIVE', 'PROSPECT', 'CUSTOMER', 'INACTIVE', 'CHURNED']).optional(),
  companySize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'annualRevenue', 'employeeCount']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// ============================================================================
// CONTACT VALIDATIONS
// ============================================================================

export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format').max(255).optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').optional().or(z.literal('')),
  mobilePhone: z.string().regex(phoneRegex, 'Invalid mobile phone format').optional().or(z.literal('')),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  preferredContact: z.enum(['EMAIL', 'PHONE', 'MOBILE', 'LINKEDIN', 'IN_PERSON']).default('EMAIL'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BOUNCED', 'UNSUBSCRIBED', 'DO_NOT_CONTACT']).default('ACTIVE'),
  linkedinUrl: z.string().regex(urlRegex, 'Invalid LinkedIn URL').optional().or(z.literal('')),
  twitterUrl: z.string().regex(urlRegex, 'Invalid Twitter URL').optional().or(z.literal('')),
  companyId: z.string().uuid('Invalid company ID').optional()
})

export const updateContactSchema = createContactSchema.partial()

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BOUNCED', 'UNSUBSCRIBED', 'DO_NOT_CONTACT']).optional(),
  isPrimary: z.coerce.boolean().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'updatedAt']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// ============================================================================
// DEAL VALIDATIONS
// ============================================================================

export const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(255),
  description: z.string().max(1000).optional(),
  value: z.number().positive('Deal value must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  expectedCloseDate: z.string().datetime('Invalid date format').optional(),
  probability: z.number().min(0).max(1, 'Probability must be between 0 and 1').optional(),
  status: z.enum(['OPEN', 'WON', 'LOST', 'POSTPONED', 'CANCELLED']).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  source: z.string().max(100).optional(),
  companyId: z.string().uuid('Invalid company ID').optional(),
  contactId: z.string().uuid('Invalid contact ID').optional(),
  stageId: z.string().uuid('Invalid stage ID')
})

export const updateDealSchema = createDealSchema.partial().extend({
  stageId: z.string().uuid('Invalid stage ID').optional()
})

export const dealQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST', 'POSTPONED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  minValue: z.coerce.number().positive().optional(),
  maxValue: z.coerce.number().positive().optional(),
  expectedCloseDateFrom: z.string().datetime().optional(),
  expectedCloseDateTo: z.string().datetime().optional(),
  sortBy: z.enum(['title', 'value', 'expectedCloseDate', 'createdAt', 'updatedAt']).default('expectedCloseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// ============================================================================
// PIPELINE STAGE VALIDATIONS
// ============================================================================

export const createPipelineStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required').max(100),
  description: z.string().max(500).optional(),
  position: z.number().int().min(0, 'Position must be non-negative'),
  probability: z.number().min(0).max(1, 'Probability must be between 0 and 1').default(0),
  color: z.string().regex(colorRegex, 'Invalid color format').optional(),
  stageType: z.enum(['LEAD', 'OPPORTUNITY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('OPPORTUNITY'),
  isActive: z.boolean().default(true)
})

export const updatePipelineStageSchema = createPipelineStageSchema.partial()

// ============================================================================
// ACTIVITY VALIDATIONS
// ============================================================================

export const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'PROPOSAL', 'CONTRACT', 'DEMO', 'FOLLOW_UP']),
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime('Invalid due date format').optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  duration: z.number().int().positive('Duration must be positive').optional(),
  location: z.string().max(255).optional(),
  meetingUrl: z.string().regex(urlRegex, 'Invalid meeting URL').optional().or(z.literal('')),
  companyId: z.string().uuid('Invalid company ID').optional(),
  contactId: z.string().uuid('Invalid contact ID').optional(),
  dealId: z.string().uuid('Invalid deal ID').optional()
})

export const updateActivitySchema = createActivitySchema.partial()

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'PROPOSAL', 'CONTRACT', 'DEMO', 'FOLLOW_UP']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  sortBy: z.enum(['subject', 'dueDate', 'createdAt', 'updatedAt', 'priority']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// ============================================================================
// GENERAL VALIDATIONS
// ============================================================================

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

// Export types for use in API routes
export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type ContactQueryInput = z.infer<typeof contactQuerySchema>

export type CreateDealInput = z.infer<typeof createDealSchema>
export type UpdateDealInput = z.infer<typeof updateDealSchema>
export type DealQueryInput = z.infer<typeof dealQuerySchema>

export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type ActivityQueryInput = z.infer<typeof activityQuerySchema>

export type IdParam = z.infer<typeof idParamSchema>
export type PaginationQuery = z.infer<typeof paginationSchema>