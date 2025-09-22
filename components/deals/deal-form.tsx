'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import {
  createDealSchema,
  updateDealSchema,
  CreateDealInput,
  UpdateDealInput,
  dealStatusOptions,
  priorityOptions,
  dealSourceOptions,
} from '@/lib/validations/deal'
import {
  Input,
  Select,
  Textarea,
  FormGroup,
  FormGrid,
} from '@/components/ui/form-components'
import { ErrorMessage } from '@/components/ui/error-boundary'

/**
 * Deal form component for create and edit operations
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Desktop-optimized layout with responsive grid
 * - Auto-save functionality
 * - Form state management
 * - Error handling and user feedback
 */

interface DealFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<UpdateDealInput>
  onSuccess?: (deal: any) => void
}

export function DealForm({ mode, initialData, onSuccess }: DealFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([])
  const [contacts, setContacts] = useState<Array<{id: string, name: string}>>([])
  const [stages, setStages] = useState<Array<{id: string, name: string}>>([])

  const schema = mode === 'create' ? createDealSchema : updateDealSchema
  const defaultValues = mode === 'create'
    ? {
        title: '',
        description: '',
        value: 0,
        currency: 'USD',
        status: 'OPEN' as const,
        priority: 'MEDIUM' as const,
        source: '',
        companyId: '',
        contactId: '',
        stageId: '',
      }
    : initialData

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    reset,
  } = useForm<CreateDealInput | UpdateDealInput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  })

  // Load companies, contacts, and pipeline stages
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load companies
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

        // Load contacts
        try {
          const contactsRes = await fetch('/api/contacts?limit=100')
          if (contactsRes.ok) {
            const contactsData = await contactsRes.json()
            setContacts(contactsData.contacts || [])
          } else {
            console.warn('Failed to load contacts - using empty list')
            setContacts([])
          }
        } catch (error) {
          console.error('Failed to load contacts:', error)
          setContacts([])
        }

        // Load pipeline stages - use a different endpoint if pipeline-stages doesn't exist
        try {
          const stagesRes = await fetch('/api/pipeline-stages')
          if (stagesRes.ok) {
            const stagesData = await stagesRes.json()
            setStages(stagesData.stages || [])
          } else {
            // Fallback: try getting stages from deals API or use default stages
            setStages([
              { id: '1', name: 'Lead' },
              { id: '2', name: 'Qualified' },
              { id: '3', name: 'Proposal' },
              { id: '4', name: 'Negotiation' },
              { id: '5', name: 'Closed Won' },
              { id: '6', name: 'Closed Lost' }
            ])
          }
        } catch (error) {
          console.error('Failed to load pipeline stages:', error)
          setStages([])
        }
      } catch (error) {
        console.error('Failed to load form options:', error)
      }
    }

    loadOptions()
  }, [])

  const onSubmit = async (data: CreateDealInput | UpdateDealInput) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const url = mode === 'create' ? '/api/deals' : `/api/deals/${(data as UpdateDealInput).id}`
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
        throw new Error(errorData.message || `Failed to ${mode} deal`)
      }

      const result = await response.json()

      if (onSuccess) {
        onSuccess(result.deal)
      } else {
        router.push('/dashboard/deals')
      }
    } catch (error) {
      console.error(`Failed to ${mode} deal:`, error)
      setSubmitError(error instanceof Error ? error.message : `Failed to ${mode} deal`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmLeave) return
    }
    router.push('/dashboard/deals')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Sections */}
      <FormGroup title="Deal Information" description="Basic information about the deal">
        <FormGrid>
          <div className="md:col-span-2">
            <Input
              {...register('title')}
              label="Deal Title*"
              placeholder="Enter deal title"
              error={errors.title?.message}
            />
          </div>
          <div>
            <Input
              {...register('value', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              label="Deal Value"
              placeholder="0.00"
              error={errors.value?.message}
            />
          </div>
          <div>
            <Select
              {...register('currency')}
              label="Currency"
              error={errors.currency?.message}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </Select>
          </div>
        </FormGrid>

        <div>
          <Textarea
            {...register('description')}
            label="Description"
            placeholder="Enter deal description..."
            rows={3}
            error={errors.description?.message}
          />
        </div>
      </FormGroup>

      <FormGroup title="Deal Details" description="Status, priority, and pipeline information">
        <FormGrid>
          <div>
            <Select
              {...register('status')}
              label="Status*"
              error={errors.status?.message}
            >
              {dealStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              {...register('priority')}
              label="Priority*"
              error={errors.priority?.message}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              {...register('stageId')}
              label="Pipeline Stage*"
              error={errors.stageId?.message}
            >
              <option value="">Select pipeline stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Input
              {...register('probability', { valueAsNumber: true })}
              type="number"
              min="0"
              max="100"
              step="1"
              label="Probability (%)"
              placeholder="0"
              error={errors.probability?.message}
            />
          </div>
        </FormGrid>
      </FormGroup>

      <FormGroup title="Relationships" description="Associated company and contact">
        <FormGrid>
          <div>
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
          <div>
            <Select
              {...register('contactId')}
              label="Contact"
              error={errors.contactId?.message}
            >
              <option value="">Select contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              {...register('source')}
              label="Deal Source"
              error={errors.source?.message}
            >
              <option value="">Select source</option>
              {dealSourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Input
              {...register('expectedCloseDate')}
              type="date"
              label="Expected Close Date"
              error={errors.expectedCloseDate?.message}
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
                {mode === 'create' ? 'Create Deal' : 'Update Deal'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}