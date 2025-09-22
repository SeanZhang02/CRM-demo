'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Professional Skeleton Loading Components
 *
 * Features:
 * - Smooth animated loading states
 * - Multiple skeleton variants for different content types
 * - Responsive design patterns
 * - Accessibility compliant with ARIA labels
 * - Optimized for desktop-first design
 */

interface SkeletonProps {
  className?: string
  animate?: boolean
  children?: ReactNode
}

// Base skeleton component
export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <motion.div
      initial={animate ? { opacity: 0.6 } : false}
      animate={animate ? {
        opacity: [0.6, 1, 0.6],
      } : false}
      transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      } : false}
      className={`bg-gray-200 rounded ${className}`}
      aria-label="Loading content..."
      role="status"
    />
  )
}

// Table skeleton for data tables
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}: {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}) {
  return (
    <div className={`w-full ${className}`} aria-label="Loading table data...">
      {/* Table Header */}
      {showHeader && (
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton
                key={`header-${index}`}
                className={`h-4 ${
                  index === 0 ? 'w-32' : index === 1 ? 'w-24' : 'w-20'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-6 py-4">
            <div className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`h-4 ${
                    colIndex === 0
                      ? 'w-32'
                      : colIndex === 1
                      ? 'w-24'
                      : colIndex === 2
                      ? 'w-20'
                      : 'w-16'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Card skeleton for dashboard cards
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        {/* Main content */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

// Form skeleton for loading forms
export function FormSkeleton({
  fields = 4,
  showSubmit = true,
  className = '',
}: {
  fields?: number
  showSubmit?: boolean
  className?: string
}) {
  return (
    <div className={`space-y-6 ${className}`} aria-label="Loading form...">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={`field-${index}`} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}

      {showSubmit && (
        <div className="flex justify-end space-x-3 pt-4">
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      )}
    </div>
  )
}

// Profile/Contact skeleton
export function ProfileSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} aria-label="Loading profile...">
      {/* Avatar and name */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Dashboard stats skeleton
export function StatsSkeleton({
  count = 4,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-6" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Chart skeleton
export function ChartSkeleton({
  height = 'h-64',
  showLegend = true,
  className = '',
}: {
  height?: string
  showLegend?: boolean
  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="space-y-4">
        {/* Chart header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Chart area */}
        <div className={`${height} relative`}>
          <Skeleton className="absolute inset-0" />

          {/* Simulated chart elements */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around space-x-2 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                className={`w-8 bg-gray-300 ${
                  Math.random() > 0.5 ? 'h-16' : 'h-12'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Chart legend */}
        {showLegend && (
          <div className="flex items-center justify-center space-x-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Pipeline/Kanban skeleton
export function PipelineSkeleton({
  stages = 4,
  cardsPerStage = 3,
  className = '',
}: {
  stages?: number
  cardsPerStage?: number
  className?: string
}) {
  return (
    <div className={`flex space-x-6 overflow-x-auto pb-4 ${className}`}>
      {Array.from({ length: stages }).map((_, stageIndex) => (
        <div key={stageIndex} className="flex-shrink-0 w-72">
          {/* Stage header */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>

          {/* Stage cards */}
          <div className="space-y-3">
            {Array.from({ length: cardsPerStage }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add card placeholder */}
          <div className="mt-3">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// List skeleton for general lists
export function ListSkeleton({
  items = 5,
  showAvatar = false,
  className = '',
}: {
  items?: number
  showAvatar?: boolean
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`} aria-label="Loading list...">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

// Page skeleton for full page loading
export function PageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Page header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats */}
      <StatsSkeleton className="mb-8" />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartSkeleton className="mb-6" />
          <TableSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

// Error boundary fallback skeleton
export function ErrorSkeleton({
  message = 'Something went wrong',
  className = '',
}: {
  message?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="bg-red-50 rounded-lg p-6 max-w-md w-full text-center">
        <Skeleton className="h-12 w-12 mx-auto mb-4 bg-red-200" />
        <Skeleton className="h-5 w-32 mx-auto mb-2 bg-red-200" />
        <Skeleton className="h-4 w-48 mx-auto bg-red-200" />
      </div>
    </div>
  )
}

// Progress skeleton for long operations
export function ProgressSkeleton({
  steps = 4,
  currentStep = 1,
  className = '',
}: {
  steps?: number
  currentStep?: number
  className?: string
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress indicator */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: steps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                index < currentStep
                  ? 'bg-blue-600 text-white'
                  : index === currentStep
                  ? 'bg-blue-100 border-2 border-blue-600'
                  : 'bg-gray-200'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            {index < steps - 1 && (
              <div
                className={`h-1 w-16 mx-2 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}