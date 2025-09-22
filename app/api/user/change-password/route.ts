import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { protectedRoute } from "@/lib/middleware/auth"
import { validateRequest, secureRoute } from "@/lib/middleware/security"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { z } from "zod"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation do not match",
  path: ["confirmPassword"],
})

/**
 * POST /api/user/change-password - Change user password
 */
async function handleChangePassword(req: NextRequest) {
  return protectedRoute(async (authReq) => {
    const validation = await validateRequest(changePasswordSchema)(req)
    if (validation.error) return validation.error

    const { currentPassword, newPassword } = validation.data!

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found or no password set" },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Check if new password is different from current
    const isSamePassword = await verifyPassword(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  })(req)
}

export const POST = secureRoute(handleChangePassword)