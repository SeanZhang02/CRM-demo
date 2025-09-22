import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Authentication validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  name: z.string().min(1, "Full name is required"),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        // Validate input format
        const validation = loginSchema.safeParse(credentials)
        if (!validation.success) {
          throw new Error("Invalid email or password format")
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error("Invalid email or password")
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is disabled. Please contact administrator.")
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error("Invalid email or password")
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          image: user.image,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "2592000"), // 30 days
    updateAge: parseInt(process.env.SESSION_UPDATE_AGE || "86400"), // 24 hours
  },
  jwt: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "2592000"), // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Include user role and additional info in JWT
      if (user) {
        token.id = user.id
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.emailVerified = user.emailVerified
      }
      return token
    },
    async session({ session, token }) {
      // Include user ID and role in session
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
    },
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email || 'unknown'}`)
    },
  },
  debug: process.env.NODE_ENV === "development",
}

// Authentication helper functions
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.HASH_ROUNDS || "12")
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// User registration function
export async function registerUser(data: z.infer<typeof registerSchema>) {
  // Validate input
  const validation = registerSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password)

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "USER", // Default role
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  })

  return user
}

// User role checking functions
export function isAdmin(userRole: string): boolean {
  return userRole === "ADMIN"
}

export function isManager(userRole: string): boolean {
  return userRole === "MANAGER" || isAdmin(userRole)
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
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

// Password reset functionality
export async function generatePasswordResetToken(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Generate reset token (6-digit code)
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: resetToken,
      expires: expiresAt,
    },
  })

  return resetToken
}

export async function verifyPasswordResetToken(email: string, token: string): Promise<boolean> {
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token,
      expires: {
        gt: new Date(),
      },
    },
  })

  return !!verificationToken
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  // Verify token
  const isValidToken = await verifyPasswordResetToken(email, token)
  if (!isValidToken) {
    throw new Error("Invalid or expired reset token")
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long")
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword)

  // Update user password
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  })

  // Delete used token
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email,
      token,
    },
  })
}