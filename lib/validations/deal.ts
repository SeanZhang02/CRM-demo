import { z } from 'zod'

/**
 * Deal validation schemas for forms and API
 *
 * Features:
 * - Monetary value validation
 * - Date validation for close dates
 * - Probability validation (0-100%)
 * - Stage and status validation
 */

// Base deal schema
export const dealSchema = z.object({
  title: z
    .string()
    .min(1, 'Deal title is required')
    .max(255, 'Deal title must be less than 255 characters')
    .trim(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),

  value: z
    .number()
    .positive('Deal value must be positive')
    .max(999999999999, 'Deal value is too large')
    .optional()
    .nullable(),

  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code (e.g., USD)')
    .default('USD'),

  expectedCloseDate: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .or(z.date().optional().nullable()),

  actualCloseDate: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .or(z.date().optional().nullable()),

  probability: z
    .number()
    .min(0, 'Probability must be between 0 and 100')
    .max(100, 'Probability must be between 0 and 100')
    .optional()
    .nullable(),

  status: z
    .enum(['OPEN', 'WON', 'LOST', 'POSTPONED', 'CANCELLED'])
    .default('OPEN'),

  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .default('MEDIUM'),

  source: z
    .string()
    .max(100, 'Source must be less than 100 characters')
    .optional()
    .nullable(),

  companyId: z
    .string()
    .uuid('Invalid company ID')
    .optional()
    .nullable(),

  contactId: z
    .string()
    .uuid('Invalid contact ID')
    .optional()
    .nullable(),

  stageId: z
    .string()
    .uuid('Pipeline stage is required'),
})

// Create deal schema
export const createDealSchema = dealSchema

// Update deal schema
export const updateDealSchema = dealSchema.partial().extend({
  id: z.string().uuid('Invalid deal ID'),
})

// Deal query/filter schema
export const dealQuerySchema = z.object({
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST', 'POSTPONED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  minValue: z.coerce.number().positive().optional(),
  maxValue: z.coerce.number().positive().optional(),
  sortBy: z.string().default('expectedCloseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Pipeline stage schema
export const pipelineStageSchema = z.object({
  name: z
    .string()
    .min(1, 'Stage name is required')
    .max(100, 'Stage name must be less than 100 characters')
    .trim(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),

  position: z
    .number()
    .int('Position must be a whole number')
    .min(0, 'Position must be non-negative'),

  probability: z
    .number()
    .min(0, 'Probability must be between 0 and 1')
    .max(1, 'Probability must be between 0 and 1')
    .default(0.0),

  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF0000)')
    .optional()
    .nullable(),

  isActive: z
    .boolean()
    .default(true),

  stageType: z
    .enum(['LEAD', 'OPPORTUNITY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
    .default('OPPORTUNITY'),
})

// TypeScript types
export type Deal = z.infer<typeof dealSchema>
export type CreateDealInput = z.infer<typeof createDealSchema>
export type UpdateDealInput = z.infer<typeof updateDealSchema>
export type DealQueryInput = z.infer<typeof dealQuerySchema>
export type PipelineStage = z.infer<typeof pipelineStageSchema>

// Deal status options for forms
export const dealStatusOptions = [
  { value: 'OPEN', label: 'Open' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
  { value: 'POSTPONED', label: 'Postponed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

// Priority options for forms
export const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
] as const

// Stage type options
export const stageTypeOptions = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'OPPORTUNITY', label: 'Opportunity' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
] as const

// Common deal sources
export const dealSourceOptions = [
  'Website',
  'Referral',
  'Cold Call',
  'Email Campaign',
  'Social Media',
  'Trade Show',
  'Partner',
  'Advertisement',
  'Other',
] as const