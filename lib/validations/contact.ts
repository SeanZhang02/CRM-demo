import { z } from 'zod'

/**
 * Contact validation schemas for forms and API
 *
 * Features:
 * - Email validation with proper regex
 * - Phone number validation
 * - Company relationship validation
 * - Social media URL validation
 */

// Base contact schema
export const contactSchema = z.object({
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

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .optional()
    .nullable(),

  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .nullable(),

  mobilePhone: z
    .string()
    .max(50, 'Mobile phone must be less than 50 characters')
    .optional()
    .nullable(),

  jobTitle: z
    .string()
    .max(100, 'Job title must be less than 100 characters')
    .optional()
    .nullable(),

  department: z
    .string()
    .max(100, 'Department must be less than 100 characters')
    .optional()
    .nullable(),

  companyId: z
    .string()
    .uuid('Invalid company ID')
    .optional()
    .nullable(),

  isPrimary: z
    .boolean()
    .default(false),

  preferredContact: z
    .enum(['EMAIL', 'PHONE', 'MOBILE', 'LINKEDIN', 'IN_PERSON'])
    .default('EMAIL'),

  status: z
    .enum(['ACTIVE', 'INACTIVE', 'BOUNCED', 'UNSUBSCRIBED', 'DO_NOT_CONTACT'])
    .default('ACTIVE'),

  linkedinUrl: z
    .string()
    .url('Please enter a valid LinkedIn URL')
    .max(255, 'LinkedIn URL must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  twitterUrl: z
    .string()
    .url('Please enter a valid Twitter URL')
    .max(255, 'Twitter URL must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
})

// Create contact schema
export const createContactSchema = contactSchema

// Update contact schema
export const updateContactSchema = contactSchema.partial().extend({
  id: z.string().uuid('Invalid contact ID'),
})

// Contact query/filter schema
export const contactQuerySchema = z.object({
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  company: z.string().optional(), // Filter by company name
  firstName: z.string().optional(), // Filter by first name
  lastName: z.string().optional(), // Filter by last name
  name: z.string().optional(), // Filter by contact name (firstName or lastName)
  email: z.string().optional(), // Filter by email
  status: z.enum(['ACTIVE', 'INACTIVE', 'BOUNCED', 'UNSUBSCRIBED', 'DO_NOT_CONTACT']).optional(),
  isPrimary: z.coerce.boolean().optional(),

  // Advanced filters
  // Company filters
  companyStatus: z.enum(['ACTIVE', 'PROSPECT', 'CUSTOMER', 'INACTIVE', 'CHURNED']).optional(),
  companySize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  industry: z.string().optional(),

  // Date-based filters
  createdAfter: z.string().optional(), // Date string for "added after" filtering
  createdBefore: z.string().optional(), // Date string for "added before" filtering
  addedWithin: z.enum(['1_DAY', '1_WEEK', '1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR']).optional(),

  // Contact preference filters
  preferredContact: z.enum(['EMAIL', 'PHONE', 'MOBILE', 'LINKEDIN', 'IN_PERSON']).optional(),
  hasEmail: z.coerce.boolean().optional(),
  hasPhone: z.coerce.boolean().optional(),
  hasMobile: z.coerce.boolean().optional(),

  // Activity filters
  hasRecentActivity: z.coerce.boolean().optional(),
  hasDeals: z.coerce.boolean().optional(),
  dealCount: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(), // 0, 1-2, 3-5, 6+

  sortBy: z.string().default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// TypeScript types
export type Contact = z.infer<typeof contactSchema>
export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type ContactQueryInput = z.infer<typeof contactQuerySchema>

// Contact method options for forms
export const contactMethodOptions = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'IN_PERSON', label: 'In Person' },
] as const

// Contact status options for forms
export const contactStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BOUNCED', label: 'Bounced' },
  { value: 'UNSUBSCRIBED', label: 'Unsubscribed' },
  { value: 'DO_NOT_CONTACT', label: 'Do Not Contact' },
] as const