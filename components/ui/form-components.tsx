'use client'

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

/**
 * Reusable form components with consistent styling
 *
 * Features:
 * - Consistent design system
 * - Error state styling
 * - Accessibility support
 * - React Hook Form integration
 * - Desktop-optimized inputs
 */

// Base input interface
interface BaseInputProps {
  label?: string
  error?: string
  helpText?: string
  required?: boolean
}

// Text Input Component
interface InputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, required, size = 'md', className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-4 text-base',
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              block w-full rounded-lg border border-gray-300
              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:border-blue-500 transition-colors duration-200
              ${sizeClasses[size]}
              ${error
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : 'text-gray-900'
              }
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
            {...props}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${props.id}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Select Component
interface SelectProps extends BaseInputProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: { value: string; label: string }[]
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, required, options, placeholder, size = 'md', className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-4 text-base',
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:border-blue-500 transition-colors duration-200
            ${sizeClasses[size]}
            ${error
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : 'text-gray-900'
            }
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {(options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${props.id}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

// Textarea Component
interface TextareaProps extends BaseInputProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'sm' | 'md' | 'lg'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, required, size = 'md', className = '', rows = 4, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-4 text-base',
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`
            block w-full rounded-lg border border-gray-300
            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:border-blue-500 transition-colors duration-200 resize-none
            ${sizeClasses[size]}
            ${error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'text-gray-900'
            }
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${props.id}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Checkbox Component
interface CheckboxProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helpText, required, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              className={`
                focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded
                ${error ? 'border-red-300' : ''}
                ${className}
              `}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3 text-sm">
              <label htmlFor={props.id} className="font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          )}
        </div>
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${props.id}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

// Form Group Component for better layout
interface FormGroupProps {
  children: React.ReactNode
  className?: string
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}

// Form Grid Component for responsive layouts
interface FormGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function FormGrid({ children, columns = 2, className = '' }: FormGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
      {children}
    </div>
  )
}