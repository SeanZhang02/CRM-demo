'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ServiceCategoryButtons } from '@/components/navigation/service-category-buttons'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PatientResults } from '@/components/patients/patient-results'

/**
 * Patient Search Page - Service Category Selection
 *
 * Level 2 of progressive disclosure navigation for healthcare providers.
 * Replaces complex Airtable-style filters with button-based service selection
 * that matches clinical mental models.
 *
 * Progressive Disclosure Flow:
 * Level 1: Provider Command Center →
 * Level 2: Service Category Buttons (THIS PAGE) →
 * Level 3: Demographic/Status Filters →
 * Level 4: Patient Results
 *
 * Designed for medical professionals who think in service categories,
 * not business metrics.
 */

export default function PatientSearchPage() {
  const searchParams = useSearchParams()
  const service = searchParams.get('service')

  // If a service is selected, show patient results
  if (service) {
    return (
      <div className="space-y-6">
        <Suspense fallback={<LoadingSpinner />}>
          <PatientResults service={service} />
        </Suspense>
      </div>
    )
  }

  // Otherwise, show service category selection
  return (
    <div className="space-y-6">
      {/* Patient Search via Service Categories */}
      <Suspense fallback={<LoadingSpinner />}>
        <ServiceCategoryButtons
          title="Find Patient by Service Type"
          subtitle="Select the service category to find patients. This matches how APCTC organizes care delivery across all 8 locations."
          showBackButton={true}
        />
      </Suspense>
    </div>
  )
}