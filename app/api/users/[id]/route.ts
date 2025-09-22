import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { protectedRoute, checkOwnership } from "@/lib/middleware/auth"
import { validateRequest, secureRoute } from "@/lib/middleware/security"
import { z } from "zod"

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
})

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/users/[id] - Get user details
 */
async function handleGetUser(req: NextRequest, { params }: RouteParams) {
  return protectedRoute(async (authReq) => {
    const userId = params.id

    // Users can view their own profile, admins can view any user
    if (authReq.user.id !== userId && authReq.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        timezone: true,
        locale: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            companies: true,
            contacts: true,
            deals: true,
            activities: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  })(req)
}

/**
 * PUT /api/users/[id] - Update user
 */
async function handleUpdateUser(req: NextRequest, { params }: RouteParams) {
  return protectedRoute(async (authReq) => {
    const userId = params.id

    // Users can update their own profile, admins can update any user
    const canEdit = authReq.user.id === userId || authReq.user.role === "ADMIN"
    if (!canEdit) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const validation = await validateRequest(updateUserSchema)(req)
    if (validation.error) return validation.error

    const updateData = validation.data!

    // Non-admins cannot change role or active status
    if (authReq.user.role !== "ADMIN") {
      delete updateData.role
      delete updateData.isActive
    }

    // Prevent users from deactivating themselves
    if (authReq.user.id === userId && updateData.isActive === false) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        timezone: true,
        locale: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user,
    })
  })(req)
}

/**
 * DELETE /api/users/[id] - Deactivate user (Admin only)
 */
async function handleDeleteUser(req: NextRequest, { params }: RouteParams) {
  return protectedRoute(async (authReq) => {
    const userId = params.id

    // Prevent users from deleting themselves
    if (authReq.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Deactivate user instead of hard delete
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
      user,
    })
  }, "ADMIN")(req)
}

export const GET = secureRoute(handleGetUser)
export const PUT = secureRoute(handleUpdateUser)
export const DELETE = secureRoute(handleDeleteUser)