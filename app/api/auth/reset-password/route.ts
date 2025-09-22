import { NextRequest, NextResponse } from "next/server"
import { resetPassword } from "@/lib/auth"
import { z } from "zod"

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  token: z.string().min(6, "Reset token must be 6 digits").max(6, "Reset token must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { email, token, password } = validation.data

    // Reset password
    await resetPassword(email, token, password)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })

  } catch (error) {
    console.error("Reset password error:", error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}