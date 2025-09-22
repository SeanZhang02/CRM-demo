'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

/**
 * Professional Toast Notification System
 *
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable timeout
 * - Manual dismiss capability
 * - Stacked positioning with smooth animations
 * - Action buttons support
 * - Accessible with proper ARIA attributes
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  isDismissible?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Toast>) => string
  error: (title: string, message?: string, options?: Partial<Toast>) => string
  warning: (title: string, message?: string, options?: Partial<Toast>) => string
  info: (title: string, message?: string, options?: Partial<Toast>) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_CONFIG = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    messageColor: 'text-green-700',
    defaultDuration: 5000,
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
    defaultDuration: 8000,
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
    messageColor: 'text-yellow-700',
    defaultDuration: 6000,
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
    defaultDuration: 5000,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      isDismissible: true,
      duration: TOAST_CONFIG[toast.type].defaultDuration,
      ...toast,
    }

    setToasts(prev => [...prev, newToast])

    // Auto-dismiss if duration is set
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, message, ...options })
  }, [addToast])

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'error', title, message, ...options })
  }, [addToast])

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, message, ...options })
  }, [addToast])

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, message, ...options })
  }, [addToast])

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: () => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = TOAST_CONFIG[toast.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className={`pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg ${config.bgColor} ${config.borderColor}`}
      role="alert"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
          </div>

          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${config.titleColor}`}>
              {toast.title}
            </h3>
            {toast.message && (
              <p className={`mt-1 text-sm ${config.messageColor}`}>
                {toast.message}
              </p>
            )}

            {/* Action Button */}
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    toast.action!.onClick()
                    onRemove()
                  }}
                  className={`text-sm font-medium ${config.titleColor} hover:underline focus:outline-none focus:underline`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          {toast.isDismissible && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onRemove}
                className={`inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${config.bgColor.replace('bg-', '')} focus:ring-indigo-500 rounded-md`}
                aria-label="Close notification"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={`h-1 ${config.iconColor.replace('text-', 'bg-')} rounded-b-lg`}
        />
      )}
    </motion.div>
  )
}

// Utility functions for common toast patterns
export const toastUtils = {
  // Data operations
  saveSuccess: (entity: string) => `${entity} saved successfully`,
  saveError: (entity: string, error?: string) => ({
    title: `Failed to save ${entity}`,
    message: error || 'Please try again or contact support if the problem persists.',
  }),

  deleteSuccess: (entity: string) => `${entity} deleted successfully`,
  deleteError: (entity: string, error?: string) => ({
    title: `Failed to delete ${entity}`,
    message: error || 'Please try again or contact support if the problem persists.',
  }),

  // Export/Import operations
  exportSuccess: (count: number, format: string) => ({
    title: 'Export completed',
    message: `Successfully exported ${count} records as ${format.toUpperCase()}`,
  }),
  exportError: (error?: string) => ({
    title: 'Export failed',
    message: error || 'Please check your data and try again.',
  }),

  importSuccess: (count: number) => ({
    title: 'Import completed',
    message: `Successfully imported ${count} records`,
  }),
  importError: (error?: string) => ({
    title: 'Import failed',
    message: error || 'Please check your CSV file format and try again.',
  }),

  // Network operations
  networkError: () => ({
    title: 'Connection error',
    message: 'Please check your internet connection and try again.',
  }),

  // Validation errors
  validationError: (field: string) => ({
    title: 'Validation error',
    message: `Please check the ${field} field and try again.`,
  }),

  // Generic messages
  unexpectedError: () => ({
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  }),

  // Feature notifications
  featureNotAvailable: (feature: string) => ({
    title: 'Feature not available',
    message: `${feature} is coming soon. Stay tuned for updates!`,
  }),

  // Copy to clipboard
  copySuccess: (item: string) => `${item} copied to clipboard`,
}