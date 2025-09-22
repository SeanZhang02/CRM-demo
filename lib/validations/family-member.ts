import { z } from 'zod'

/**
 * Family Member validation schemas for healthcare provider portal
 *
 * Features:
 * - Emergency contact and family relationship management
 * - HIPAA-compliant access control validation
 * - Multi-contact method support
 * - Relationship type classification
 */

// Relationship type enum validation
export const relationshipTypeSchema = z.enum([
  'SPOUSE',
  'PARENT',
  'CHILD',
  'SIBLING',
  'GRANDPARENT',
  'GRANDCHILD',
  'GUARDIAN',
  'FRIEND',
  'CAREGIVER',
  'OTHER'
])

// Contact method enum validation
export const contactMethodSchema = z.enum([
  'PHONE',
  'MOBILE',
  'EMAIL',
  'TEXT_MESSAGE',
  'MAIL',
  'IN_PERSON'
])

// Contact status enum validation
export const contactStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'DO_NOT_CONTACT',
  'EMERGENCY_ONLY'
])

// Base family member schema with all fields
export const familyMemberSchema = z.object({
  // Basic Information
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
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .nullable(),

  mobilePhone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid mobile phone number format')
    .max(20, 'Mobile phone number must be less than 20 characters')
    .optional()
    .nullable(),

  // Healthcare-Specific Fields
  relationshipType: relationshipTypeSchema,

  isEmergencyContact: z
    .boolean()
    .default(false),

  isPrimaryContact: z
    .boolean()
    .default(false),

  canAccessInformation: z
    .boolean()
    .default(false),

  preferredContactMethod: contactMethodSchema.default('PHONE'),

  // Contact preferences and status
  status: contactStatusSchema.default('ACTIVE'),

  // Additional contact details
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

  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable(),

  // Foreign key relationship to Patient
  patientId: z
    .string()
    .uuid('Invalid patient ID')
    .optional()
    .nullable(),
})

// Create family member schema (excludes system fields)
export const createFamilyMemberSchema = familyMemberSchema

// Update family member schema (all fields optional except ID)
export const updateFamilyMemberSchema = familyMemberSchema.partial().extend({
  id: z.string().uuid('Invalid family member ID'),
})

// Family member query/filter schema
export const familyMemberQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().uuid().optional(),
  relationshipType: relationshipTypeSchema.optional(),
  isEmergencyContact: z.boolean().optional(),
  isPrimaryContact: z.boolean().optional(),
  status: contactStatusSchema.optional(),
  sortBy: z.string().default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Emergency contact search schema
export const emergencyContactSearchSchema = z.object({
  patientId: z.string().uuid(),
  availableOnly: z.boolean().default(true), // Only contacts marked as emergency contacts
  includeInactive: z.boolean().default(false),
})

// Family member summary for patient view
export const familyMemberSummarySchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  relationshipType: relationshipTypeSchema,
  phone: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  email: z.string().nullable(),
  isEmergencyContact: z.boolean(),
  isPrimaryContact: z.boolean(),
  preferredContactMethod: contactMethodSchema,
  status: contactStatusSchema,
  canAccessInformation: z.boolean(),
})

// TypeScript types derived from schemas
export type FamilyMember = z.infer<typeof familyMemberSchema>
export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>
export type FamilyMemberQueryInput = z.infer<typeof familyMemberQuerySchema>
export type EmergencyContactSearchInput = z.infer<typeof emergencyContactSearchSchema>
export type FamilyMemberSummary = z.infer<typeof familyMemberSummarySchema>

// Relationship type options for forms
export const relationshipTypeOptions = [
  { value: 'SPOUSE', label: 'Spouse/Partner' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'CHILD', label: 'Child' },
  { value: 'SIBLING', label: 'Sibling' },
  { value: 'GRANDPARENT', label: 'Grandparent' },
  { value: 'GRANDCHILD', label: 'Grandchild' },
  { value: 'GUARDIAN', label: 'Legal Guardian' },
  { value: 'FRIEND', label: 'Friend' },
  { value: 'CAREGIVER', label: 'Caregiver' },
  { value: 'OTHER', label: 'Other' },
] as const

// Contact method options for forms
export const contactMethodOptions = [
  { value: 'PHONE', label: 'Phone' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TEXT_MESSAGE', label: 'Text Message' },
  { value: 'MAIL', label: 'Mail' },
  { value: 'IN_PERSON', label: 'In Person' },
] as const

// Contact status options for forms
export const contactStatusOptions = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
  { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'red' },
  { value: 'EMERGENCY_ONLY', label: 'Emergency Only', color: 'orange' },
] as const

// Validation helpers for family member business rules
export const familyMemberValidationRules = {
  // Ensure at least one contact method is provided
  validateContactMethods: (data: Partial<FamilyMember>) => {
    if (!data.phone && !data.mobilePhone && !data.email) {
      throw new Error('At least one contact method (phone, mobile, or email) is required')
    }
  },

  // Ensure emergency contacts have required information
  validateEmergencyContact: (data: Partial<FamilyMember>) => {
    if (data.isEmergencyContact) {
      if (!data.phone && !data.mobilePhone) {
        throw new Error('Emergency contacts must have a phone number')
      }
      if (data.status === 'DO_NOT_CONTACT') {
        throw new Error('Emergency contacts cannot have "Do Not Contact" status')
      }
    }
  },

  // Validate information access permissions
  validateInformationAccess: (data: Partial<FamilyMember>) => {
    if (data.canAccessInformation && data.status === 'INACTIVE') {
      throw new Error('Inactive contacts cannot access patient information')
    }
  },

  // Validate relationship type and age appropriateness
  validateRelationshipType: (data: Partial<FamilyMember>, patientAge?: number) => {
    if (patientAge && patientAge < 18) {
      if (data.relationshipType === 'CHILD') {
        throw new Error('Minor patients cannot have children as contacts')
      }
    }
  },
}