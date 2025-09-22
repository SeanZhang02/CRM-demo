import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { protectedRoute, getUserId } from "@/lib/middleware/auth"
import { validateRequest, secureRoute } from "@/lib/middleware/security"
import { z } from "zod"

// Validation schemas
const getUsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  search: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER", "VIEWER"]).optional(),
  isActive: z.string().optional().transform(val => val ? val === "true" : undefined),
})

const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  name: z.string().min(1, "Full name is required"),
  role: z.enum(["ADMIN", "MANAGER", "USER", "VIEWER"]).default("USER"),
  isActive: z.boolean().default(true),
})

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
})

/**
 * GET /api/users - List users (Admin/Manager only)
 */
async function handleGetUsers(req: NextRequest) {
  return protectedRoute(async (authReq) => {
    // Only admins and managers can list users
    if (!["ADMIN", "MANAGER"].includes(authReq.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())

    const validation = await validateRequest(getUsersQuerySchema)
    const validationResult = getUsersQuerySchema.safeParse(queryParams)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { page, limit, search, role, isActive } = validationResult.data

    // Build filters
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  }, "MANAGER")(req)
}

/**
 * POST /api/users - Create user (Admin only)
 */
async function handleCreateUser(req: NextRequest) {
  return protectedRoute(async (authReq) => {
    const validation = await validateRequest(createUserSchema)(req)
    if (validation.error) return validation.error

    const userData = validation.data!

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create user (password will be set via invitation)
    const user = await prisma.user.create({
      data: {
        ...userData,
        emailVerified: null, // User needs to verify email
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    // TODO: Send invitation email
    console.log(`User invitation sent to ${user.email}`)

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user,
    }, { status: 201 })
  }, "ADMIN")(req)
}

export const GET = secureRoute(handleGetUsers)
export const POST = secureRoute(handleCreateUser)