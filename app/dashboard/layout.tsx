import { Suspense } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Dashboard Layout - Desktop-first CRM interface
 *
 * Features:
 * - Sidebar navigation optimized for 1024px+ screens
 * - Header with search and quick actions
 * - Responsive breakpoints for tablet and mobile
 * - Loading states for smooth UX
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation Header */}
      <Navigation />

      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64">
          <div className="px-4 lg:px-8 py-6">
            <Suspense fallback={<LoadingSpinner />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}