import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Session } from "next-auth"

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    name?: string
    role: string
    firstName?: string
    lastName?: string
  }
}

export interface AuthenticationResult {
  success: boolean
  user?: AuthenticatedRequest["user"]
  error?: string
  response?: NextResponse
}

/**
 * Authentication middleware for API routes
 * Verifies user session and adds user context to request
 */
export async function authenticate(): Promise<AuthenticationResult> {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return {
        success: false,
        error: "Authentication required",
        response: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }
    }

    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || undefined,
        role: session.user.role,
        firstName: session.user.firstName || undefined,
        lastName: session.user.lastName || undefined,
      }
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return {
      success: false,
      error: "Authentication failed",
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      )
    }
  }
}

/**
 * Authorization middleware for role-based access control
 */
export function authorize(requiredRole: string, userRole: string): boolean {
  const roleHierarchy = {
    VIEWER: 0,
    USER: 1,
    MANAGER: 2,
    ADMIN: 3,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}

/**
 * Combined authentication and authorization middleware
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredRole: string = "USER"
) {
  return async (req: NextRequest) => {
    // Authenticate user
    const authResult = await authenticate()

    if (!authResult.success || !authResult.user) {
      return authResult.response!
    }

    // Check authorization
    if (!authorize(requiredRole, authResult.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Add user to request
    const authenticatedRequest = req as AuthenticatedRequest
    authenticatedRequest.user = authResult.user

    return handler(authenticatedRequest)
  }
}

/**
 * Admin-only middleware
 */
export async function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, "ADMIN")
}

/**
 * Manager-level middleware
 */
export async function withManagerAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, "MANAGER")
}

/**
 * Extract user ID from authenticated request
 */
export function getUserId(req: AuthenticatedRequest): string {
  return req.user.id
}

/**
 * Check if user owns a resource
 */
export function checkOwnership(req: AuthenticatedRequest, resourceOwnerId: string): boolean {
  return req.user.id === resourceOwnerId || req.user.role === "ADMIN"
}

/**
 * Middleware wrapper for easy use in API routes
 */
export function protectedRoute(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredRole: string = "USER"
) {
  return async (req: NextRequest) => {
    try {
      const authHandler = await withAuth(handler, requiredRole)
      return authHandler(req)
    } catch (error) {
      console.error("Protected route error:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}