import { NextRequest, NextResponse } from "next/server"
import { generatePasswordResetToken } from "@/lib/auth"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    try {
      // Generate reset token
      const resetToken = await generatePasswordResetToken(email)

      // TODO: Send reset token via email
      // For now, we'll just log it (in production, integrate with email service)
      console.log(`Password reset token for ${email}: ${resetToken}`)

      // Always return success to prevent email enumeration attacks
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset code.",
      })

    } catch (error) {
      // Even if user doesn't exist, return success to prevent email enumeration
      console.error("Password reset error:", error)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset code.",
      })
    }

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}