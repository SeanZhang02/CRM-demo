import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { protectedRoute } from "@/lib/middleware/auth"
import { validateRequest, secureRoute } from "@/lib/middleware/security"
import { hashPassword } from "@/lib/auth"
import { z } from "zod"

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  name: z.string().min(1, "Full name is required").optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation do not match",
  path: ["confirmPassword"],
})

/**
 * GET /api/user/profile - Get current user profile
 */
async function handleGetProfile(req: NextRequest) {
  return protectedRoute(async (authReq) => {
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        timezone: true,
        locale: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        image: true,
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
 * PUT /api/user/profile - Update current user profile
 */
async function handleUpdateProfile(req: NextRequest) {
  return protectedRoute(async (authReq) => {
    const validation = await validateRequest(updateProfileSchema)(req)
    if (validation.error) return validation.error

    const updateData = validation.data!

    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        timezone: true,
        locale: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  })(req)
}

export const GET = secureRoute(handleGetProfile)
export const PUT = secureRoute(handleUpdateProfile)