import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  handleError,
  methodNotAllowed,
  createPerformanceLogger,
} from '@/lib/api-utils'

// ============================================================================
// GET /api/saved-filters/[id] - Get a specific saved filter
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger('GET /api/saved-filters/[id]')

  try {
    const { id } = params

    // Get the saved filter
    const savedFilter = await prisma.savedFilter.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        config: true,
        isPublic: true,
        entityType: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!savedFilter) {
      return handleError({
        name: 'NotFoundError',
        message: 'Saved filter not found',
        statusCode: 404
      })
    }

    // Increment usage count
    await prisma.savedFilter.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        },
        updatedAt: new Date()
      }
    })

    perf.end('Retrieved saved filter')

    return successResponse(savedFilter)

  } catch (error) {
    return handleError(error, 'GET /api/saved-filters/[id]')
  }
}

// ============================================================================
// DELETE /api/saved-filters/[id] - Delete a specific saved filter
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const perf = createPerformanceLogger('DELETE /api/saved-filters/[id]')

  try {
    const { id } = params

    // Check if filter exists
    const existingFilter = await prisma.savedFilter.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!existingFilter) {
      return handleError({
        name: 'NotFoundError',
        message: 'Saved filter not found',
        statusCode: 404
      })
    }

    // Delete the saved filter
    await prisma.savedFilter.delete({
      where: { id }
    })

    perf.end('Deleted saved filter')

    return successResponse({
      message: 'Saved filter deleted successfully',
      deletedFilter: existingFilter
    })

  } catch (error) {
    return handleError(error, 'DELETE /api/saved-filters/[id]')
  }
}

export async function POST() {
  return methodNotAllowed(['GET', 'DELETE'])
}

export async function PUT() {
  return methodNotAllowed(['GET', 'DELETE'])
}

export async function PATCH() {
  return methodNotAllowed(['GET', 'DELETE'])
}