import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`
    super(404, message, 'NOT_FOUND')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_SERVER_ERROR')
  }
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function successResponse<T>(data: T, meta?: any): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta
  })
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages
    }
  })
}

export function errorResponse(error: ApiError): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    },
    { status: error.statusCode }
  )
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function handleError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(new ValidationError(
      'Validation failed',
      error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    ))
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] || ['field']
        return errorResponse(new ConflictError(
          `${target.join(', ')} already exists`,
          { field: target[0] }
        ))

      case 'P2025':
        // Record not found
        return errorResponse(new NotFoundError('Resource'))

      case 'P2003':
        // Foreign key constraint violation
        return errorResponse(new ValidationError(
          'Referenced record does not exist',
          { field: error.meta?.field_name }
        ))

      case 'P2014':
        // Invalid ID or required relation violation
        return errorResponse(new ValidationError(
          'Invalid reference to related record'
        ))

      default:
        return errorResponse(new InternalServerError('Database operation failed'))
    }
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return errorResponse(error)
  }

  // Handle unknown errors
  return errorResponse(new InternalServerError(
    process.env.NODE_ENV === 'development'
      ? (error as Error).message
      : 'An unexpected error occurred'
  ))
}

// ============================================================================
// REQUEST VALIDATION HELPERS
// ============================================================================

export async function validateRequestBody<T>(
  request: Request,
  schema: any
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON format')
    }
    throw error
  }
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: any
): T {
  const params: Record<string, any> = {}

  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }

  console.log('🔧 [DEBUG] validateQueryParams - params before Zod:', JSON.stringify(params, null, 2))
  console.log('🔧 [DEBUG] validateQueryParams - schema shape keys:', Object.keys(schema.shape || {}))
  console.log('🔧 [DEBUG] validateQueryParams - schema has companySize:', 'companySize' in (schema.shape || {}))

  let result
  try {
    result = schema.parse(params)
    console.log('🔧 [DEBUG] validateQueryParams - Zod validation SUCCESS')
  } catch (error) {
    console.log('🔧 [DEBUG] validateQueryParams - Zod validation ERROR:', error)
    throw error
  }

  console.log('🔧 [DEBUG] validateQueryParams - result after Zod:', JSON.stringify(result, null, 2))

  return result
}

export function validatePathParams<T>(
  params: Record<string, string>,
  schema: any
): T {
  return schema.parse(params)
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit
}

export function buildPaginationQuery(page: number, limit: number) {
  return {
    skip: calculateSkip(page, limit),
    take: limit
  }
}

// ============================================================================
// SEARCH HELPERS
// ============================================================================

export function buildSearchFilter(search: string, fields: string[]) {
  if (!search) return undefined

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search
        // Note: Removed mode: 'insensitive' for SQLite compatibility
        // SQLite case sensitivity depends on collation settings
      }
    }))
  }
}

// ============================================================================
// SORTING HELPERS
// ============================================================================

export function buildSortQuery(sortBy: string, sortOrder: 'asc' | 'desc') {
  return {
    [sortBy]: sortOrder
  }
}

// ============================================================================
// RESPONSE TIME MEASUREMENT
// ============================================================================

export function createPerformanceLogger(endpoint: string) {
  const start = performance.now()

  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`[API] ${endpoint} took ${duration.toFixed(2)}ms`)

      // Log warning if response time exceeds target
      if (duration > 200) {
        console.warn(`[PERFORMANCE] ${endpoint} exceeded 200ms target: ${duration.toFixed(2)}ms`)
      }

      return duration
    }
  }
}

// ============================================================================
// HTTP METHOD HELPERS
// ============================================================================

export function methodNotAllowed(allowedMethods: string[]): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        code: 'METHOD_NOT_ALLOWED'
      }
    },
    {
      status: 405,
      headers: {
        'Allow': allowedMethods.join(', ')
      }
    }
  )
}