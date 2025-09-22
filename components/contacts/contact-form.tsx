'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import {
  createContactSchema,
  updateContactSchema,
  CreateContactInput,
  UpdateContactInput,
  contactMethodOptions,
  contactStatusOptions,
} from '@/lib/validations/contact'
import {
  Input,
  Select,
  FormGroup,
  FormGrid,
} from '@/components/ui/form-components'
import { ErrorMessage } from '@/components/ui/error-boundary'

/**
 * Contact form component for create and edit operations
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Desktop-optimized layout with responsive grid
 * - Company association
 * - Form state management
 * - Error handling and user feedback
 */

interface ContactFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<UpdateContactInput>
  onSuccess?: (contact: any) => void
}

export function ContactForm({ mode, initialData, onSuccess }: ContactFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([])

  const schema = mode === 'create' ? createContactSchema : updateContactSchema
  const defaultValues = mode === 'create'
    ? {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobilePhone: '',
        jobTitle: '',
        department: '',
        companyId: '',
        isPrimary: false,
        preferredContact: 'EMAIL' as const,
        status: 'ACTIVE' as const,
        linkedinUrl: '',
        twitterUrl: '',
      }
    : initialData

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    reset,
  } = useForm<CreateContactInput | UpdateContactInput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  })

  // Load companies for selection
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesRes = await fetch('/api/companies?limit=100')
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json()
          setCompanies(companiesData.companies || [])
        } else {
          console.warn('Failed to load companies - using empty list')
          setCompanies([])
        }
      } catch (error) {
        console.error('Failed to load companies:', error)
        setCompanies([])
      }
    }

    loadCompanies()
  }, [])

  const onSubmit = async (data: CreateContactInput | UpdateContactInput) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const url = mode === 'create' ? '/api/contacts' : `/api/contacts/${(data as UpdateContactInput).id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${mode} contact`)
      }

      const result = await response.json()

      if (onSuccess) {
        onSuccess(result.contact)
      } else {
        router.push('/dashboard/contacts')
      }
    } catch (error) {
      console.error(`Failed to ${mode} contact:`, error)
      setSubmitError(error instanceof Error ? error.message : `Failed to ${mode} contact`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmLeave) return
    }
    router.push('/dashboard/contacts')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Sections */}
      <FormGroup title="Personal Information" description="Basic contact details">
        <FormGrid>
          <div>
            <Input
              {...register('firstName')}
              label="First Name*"
              placeholder="Enter first name"
              error={errors.firstName?.message}
            />
          </div>
          <div>
            <Input
              {...register('lastName')}
              label="Last Name*"
              placeholder="Enter last name"
              error={errors.lastName?.message}
            />
          </div>
          <div>
            <Input
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="contact@company.com"
              error={errors.email?.message}
            />
          </div>
          <div>
            <Select
              {...register('status')}
              label="Status*"
              error={errors.status?.message}
            >
              {contactStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </FormGrid>
      </FormGroup>

      <FormGroup title="Contact Information" description="Phone numbers and preferred contact method">
        <FormGrid>
          <div>
            <Input
              {...register('phone')}
              type="tel"
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              error={errors.phone?.message}
            />
          </div>
          <div>
            <Input
              {...register('mobilePhone')}
              type="tel"
              label="Mobile Phone"
              placeholder="+1 (555) 987-6543"
              error={errors.mobilePhone?.message}
            />
          </div>
          <div>
            <Select
              {...register('preferredContact')}
              label="Preferred Contact Method*"
              error={errors.preferredContact?.message}
            >
              {contactMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="flex items-center h-full pt-6">
              <label className="flex items-center">
                <input
                  {...register('isPrimary')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded
                           focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">Primary Contact</span>
              </label>
            </div>
          </div>
        </FormGrid>
      </FormGroup>

      <FormGroup title="Professional Details" description="Job information and company association">
        <FormGrid>
          <div>
            <Input
              {...register('jobTitle')}
              label="Job Title"
              placeholder="Sales Manager"
              error={errors.jobTitle?.message}
            />
          </div>
          <div>
            <Input
              {...register('department')}
              label="Department"
              placeholder="Sales"
              error={errors.department?.message}
            />
          </div>
          <div className="md:col-span-2">
            <Select
              {...register('companyId')}
              label="Company"
              error={errors.companyId?.message}
            >
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </div>
        </FormGrid>
      </FormGroup>

      <FormGroup title="Social Media" description="Social media profiles and links">
        <FormGrid>
          <div>
            <Input
              {...register('linkedinUrl')}
              type="url"
              label="LinkedIn Profile"
              placeholder="https://linkedin.com/in/username"
              error={errors.linkedinUrl?.message}
            />
          </div>
          <div>
            <Input
              {...register('twitterUrl')}
              type="url"
              label="Twitter Profile"
              placeholder="https://twitter.com/username"
              error={errors.twitterUrl?.message}
            />
          </div>
        </FormGrid>
      </FormGroup>

      {/* Error Display */}
      {submitError && (
        <ErrorMessage title="Submission Error" message={submitError} />
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {isDirty && '• Unsaved changes'}
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                     rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-blue-500 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white
                     bg-blue-600 border border-transparent rounded-md shadow-sm
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Create Contact' : 'Update Contact'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}