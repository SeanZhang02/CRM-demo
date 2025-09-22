import { z } from 'zod'

/**
 * Company validation schemas for forms and API
 *
 * Features:
 * - Type-safe validation with Zod
 * - Reusable schemas for create/update operations
 * - Client and server-side validation
 * - Proper error messages for UX
 */

// Base company schema with all fields
export const companySchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters')
    .trim(),

  industry: z
    .string()
    .max(100, 'Industry must be less than 100 characters')
    .optional()
    .nullable(),

  website: z
    .string()
    .url('Please enter a valid website URL')
    .max(255, 'Website URL must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .nullable(),

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
    .optional()
    .nullable(),

  companySize: z
    .enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'])
    .optional()
    .nullable(),

  status: z
    .enum(['ACTIVE', 'PROSPECT', 'CUSTOMER', 'INACTIVE', 'CHURNED'])
    .default('ACTIVE'),

  annualRevenue: z
    .number()
    .positive('Annual revenue must be positive')
    .max(999999999999, 'Annual revenue is too large')
    .optional()
    .nullable(),

  employeeCount: z
    .number()
    .int('Employee count must be a whole number')
    .positive('Employee count must be positive')
    .max(10000000, 'Employee count is too large')
    .optional()
    .nullable(),
})

// Create company schema (excludes system fields)
export const createCompanySchema = companySchema

// Update company schema (all fields optional except ID)
export const updateCompanySchema = companySchema.partial().extend({
  id: z.string().uuid('Invalid company ID'),
})

// Company query/filter schema
export const companyQuerySchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'PROSPECT', 'CUSTOMER', 'INACTIVE', 'CHURNED']).optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// TypeScript types derived from schemas
export type Company = z.infer<typeof companySchema>
export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>

// Company size options for forms
export const companySizeOptions = [
  { value: 'STARTUP', label: 'Startup (1-10 employees)' },
  { value: 'SMALL', label: 'Small (11-50 employees)' },
  { value: 'MEDIUM', label: 'Medium (51-200 employees)' },
  { value: 'LARGE', label: 'Large (201-1000 employees)' },
  { value: 'ENTERPRISE', label: 'Enterprise (1000+ employees)' },
] as const

// Company status options for forms
export const companyStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'CHURNED', label: 'Churned' },
] as const

// Industry options (can be expanded based on business needs)
export const industryOptions = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Construction',
  'Real Estate',
  'Transportation',
  'Energy',
  'Media',
  'Consulting',
  'Other',
] as const