import { Suspense } from 'react'
import { ProviderDashboard } from '@/components/provider/provider-dashboard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Healthcare Provider Command Center Dashboard
 *
 * Transformed from business CRM to healthcare provider workflow:
 * - Provider dashboard optimized for medical professionals
 * - Prominent patient search (99% use case)
 * - Today's schedule and alerts
 * - Recent patients and quick notes
 * - Healthcare-specific quick actions
 *
 * Designed for zero training requirement and 2-click patient finding
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Healthcare Provider Dashboard */}
      <Suspense fallback={<LoadingSpinner />}>
        <ProviderDashboard />
      </Suspense>
    </div>
  )
}