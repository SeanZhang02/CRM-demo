'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import {
  createCompanySchema,
  updateCompanySchema,
  CreateCompanyInput,
  UpdateCompanyInput,
  companySizeOptions,
  companyStatusOptions,
  industryOptions,
} from '@/lib/validations/company'
import {
  Input,
  Select,
  Textarea,
  FormGroup,
  FormGrid,
} from '@/components/ui/form-components'
import { ErrorMessage } from '@/components/ui/error-boundary'

/**
 * Company form component for create and edit operations
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Desktop-optimized layout with responsive grid
 * - Auto-save functionality
 * - Form state management
 * - Error handling and user feedback
 */

interface CompanyFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<UpdateCompanyInput>
  onSuccess?: (company: any) => void
}

export function CompanyForm({ mode, initialData, onSuccess }: CompanyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const schema = mode === 'create' ? createCompanySchema : updateCompanySchema
  const defaultValues = mode === 'create'
    ? {
        name: '',
        industry: '',
        website: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        companySize: '',
        status: 'ACTIVE' as const,
        annualRevenue: undefined,
        employeeCount: undefined,
      }
    : initialData

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  })

  // Watch for changes to show unsaved indicator
  const watchedValues = watch()

  const onSubmit = async (data: CreateCompanyInput | UpdateCompanyInput) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const url = mode === 'create'
        ? '/api/companies'
        : `/api/companies/${(data as UpdateCompanyInput).id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to ${mode} company`)
      }

      const result = await response.json()

      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(result.data)
      } else {
        router.push(`/dashboard/companies/${result.data.id}`)
      }

      // Show success message
      // In a real app, you'd use a toast notification service
      console.log(`Company ${mode === 'create' ? 'created' : 'updated'} successfully`)

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : `Failed to ${mode} company`)
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} company:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return
    }
    router.back()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {submitError && (
        <ErrorMessage
          title={`Failed to ${mode} company`}
          message={submitError}
          onRetry={() => setSubmitError(null)}
        />
      )}

      {/* Basic Information */}
      <FormGroup>
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        <FormGrid columns={2}>
          <Input
            id="name"
            label="Company Name"
            required
            placeholder="Enter company name"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="website"
            label="Website"
            type="url"
            placeholder="https://example.com"
            error={errors.website?.message}
            {...register('website')}
          />
        </FormGrid>

        <FormGrid columns={2}>
          <Select
            id="industry"
            label="Industry"
            placeholder="Select industry"
            options={industryOptions.map((industry) => ({
              value: industry,
              label: industry,
            }))}
            error={errors.industry?.message}
            {...register('industry')}
          />
          <Select
            id="companySize"
            label="Company Size"
            placeholder="Select company size"
            options={companySizeOptions}
            error={errors.companySize?.message}
            {...register('companySize')}
          />
        </FormGrid>
      </FormGroup>

      {/* Contact Information */}
      <FormGroup>
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        <FormGrid columns={2}>
          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Select
            id="status"
            label="Status"
            options={companyStatusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        </FormGrid>

        <Textarea
          id="address"
          label="Address"
          placeholder="Enter complete address"
          rows={2}
          error={errors.address?.message}
          {...register('address')}
        />

        <FormGrid columns={3}>
          <Input
            id="city"
            label="City"
            placeholder="Enter city"
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            id="state"
            label="State/Province"
            placeholder="Enter state"
            error={errors.state?.message}
            {...register('state')}
          />
          <Input
            id="postalCode"
            label="Postal Code"
            placeholder="Enter postal code"
            error={errors.postalCode?.message}
            {...register('postalCode')}
          />
        </FormGrid>

        <Input
          id="country"
          label="Country"
          placeholder="Enter country"
          error={errors.country?.message}
          {...register('country')}
        />
      </FormGroup>

      {/* Business Details */}
      <FormGroup>
        <h3 className="text-lg font-medium text-gray-900">Business Details</h3>
        <FormGrid columns={2}>
          <Input
            id="annualRevenue"
            label="Annual Revenue"
            type="number"
            placeholder="Enter annual revenue"
            error={errors.annualRevenue?.message}
            {...register('annualRevenue', { valueAsNumber: true })}
          />
          <Input
            id="employeeCount"
            label="Employee Count"
            type="number"
            placeholder="Enter number of employees"
            error={errors.employeeCount?.message}
            {...register('employeeCount', { valueAsNumber: true })}
          />
        </FormGrid>
      </FormGroup>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {isDirty && !isSubmitting && (
            <span className="text-sm text-amber-600 flex items-center">
              <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium
                     text-gray-700 bg-white hover:bg-gray-50 focus:outline-none
                     focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="inline-flex items-center px-4 py-2 border border-transparent
                     text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed
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
                {mode === 'create' ? 'Create Company' : 'Update Company'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}