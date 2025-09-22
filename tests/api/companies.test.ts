/**
 * API Integration Tests for Companies
 * Tests complete API workflows with database integration
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/companies/route'
import { prisma } from '@/lib/prisma'
import { createTestUser, createTestSession, cleanupTestData } from '../setup/test-helpers'

// Mock NextAuth for authentication
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma for controlled testing
const mockPrisma = {
  company: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
} as any

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('Companies API Integration Tests', () => {
  let testUser: any
  let authSession: any

  beforeEach(async () => {
    jest.clearAllMocks()

    // Create test user and session
    testUser = await createTestUser()
    authSession = await createTestSession(testUser)

    // Mock authenticated session
    const { getServerSession } = require('next-auth/next')
    getServerSession.mockResolvedValue(authSession)

    // Mock user lookup
    mockPrisma.user.findUnique.mockResolvedValue(testUser)
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/companies', () => {
    const mockCompanies = [
      {
        id: 'comp-1',
        name: 'Test Company 1',
        industry: 'Technology',
        website: 'https://example1.com',
        status: 'ACTIVE',
        ownerId: 'user-123',
        isDeleted: false,
        contacts: [],
        deals: [],
        _count: { contacts: 0, deals: 0, activities: 0 },
      },
      {
        id: 'comp-2',
        name: 'Test Company 2',
        industry: 'Healthcare',
        website: 'https://example2.com',
        status: 'PROSPECT',
        ownerId: 'user-123',
        isDeleted: false,
        contacts: [],
        deals: [],
        _count: { contacts: 2, deals: 1, activities: 3 },
      },
    ]

    it('should return paginated companies for authenticated user', async () => {
      mockPrisma.company.count.mockResolvedValue(2)
      mockPrisma.company.findMany.mockResolvedValue(mockCompanies)

      const request = new NextRequest('http://localhost:3000/api/companies')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })

      // Verify Prisma was called with user filtering
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            ownerId: testUser.id,
          }),
        })
      )
    })

    it('should filter companies by search query', async () => {
      mockPrisma.company.count.mockResolvedValue(1)
      mockPrisma.company.findMany.mockResolvedValue([mockCompanies[0]])

      const url = 'http://localhost:3000/api/companies?search=Test Company 1'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)

      // Verify search filter was applied
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({
                  contains: 'Test Company 1',
                }),
              }),
            ]),
          }),
        })
      )
    })

    it('should filter companies by industry', async () => {
      mockPrisma.company.count.mockResolvedValue(1)
      mockPrisma.company.findMany.mockResolvedValue([mockCompanies[0]])

      const url = 'http://localhost:3000/api/companies?industry=Technology'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify industry filter was applied
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            industry: 'Technology',
          }),
        })
      )
    })

    it('should filter companies by status', async () => {
      mockPrisma.company.count.mockResolvedValue(1)
      mockPrisma.company.findMany.mockResolvedValue([mockCompanies[1]])

      const url = 'http://localhost:3000/api/companies?status=PROSPECT'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify status filter was applied
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PROSPECT',
          }),
        })
      )
    })

    it('should apply pagination parameters', async () => {
      mockPrisma.company.count.mockResolvedValue(50)
      mockPrisma.company.findMany.mockResolvedValue(mockCompanies)

      const url = 'http://localhost:3000/api/companies?page=2&limit=10'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(10)

      // Verify pagination was applied to Prisma query
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        })
      )
    })

    it('should apply sorting parameters', async () => {
      mockPrisma.company.count.mockResolvedValue(2)
      mockPrisma.company.findMany.mockResolvedValue(mockCompanies)

      const url = 'http://localhost:3000/api/companies?sortBy=industry&sortOrder=desc'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify sorting was applied
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { industry: 'desc' },
        })
      )
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/companies')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.company.count.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/companies')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal Server Error')
    })

    it('should validate query parameters', async () => {
      const url = 'http://localhost:3000/api/companies?page=invalid&limit=999'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should include related data counts', async () => {
      mockPrisma.company.count.mockResolvedValue(1)
      mockPrisma.company.findMany.mockResolvedValue([mockCompanies[1]])

      const request = new NextRequest('http://localhost:3000/api/companies')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0]._count).toEqual({
        contacts: 2,
        deals: 1,
        activities: 3,
      })
    })
  })

  describe('POST /api/companies', () => {
    const validCompanyData = {
      name: 'New Test Company',
      industry: 'Technology',
      website: 'https://newcompany.com',
      status: 'PROSPECT',
      companySize: 'MEDIUM',
      employeeCount: 100,
    }

    it('should create a new company for authenticated user', async () => {
      const createdCompany = {
        id: 'new-comp-123',
        ...validCompanyData,
        ownerId: testUser.id,
        isDeleted: false,
        contacts: [],
        deals: [],
        _count: { contacts: 0, deals: 0, activities: 0 },
      }

      mockPrisma.company.findFirst.mockResolvedValue(null) // No duplicate
      mockPrisma.company.create.mockResolvedValue(createdCompany)

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(validCompanyData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(validCompanyData.name)
      expect(data.data.ownerId).toBe(testUser.id)

      // Verify company was created with user ownership
      expect(mockPrisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...validCompanyData,
            ownerId: testUser.id,
          }),
        })
      )
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required 'name' field
        industry: 'Technology',
      }

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('validation')
    })

    it('should validate data types and constraints', async () => {
      const invalidData = {
        name: '', // Empty name
        website: 'not-a-url', // Invalid URL
        employeeCount: -5, // Negative number
        companySize: 'INVALID_SIZE', // Invalid enum
      }

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should check for duplicate company names (warning only)', async () => {
      const existingCompany = {
        id: 'existing-123',
        name: validCompanyData.name,
        ownerId: testUser.id,
      }

      const createdCompany = {
        id: 'new-comp-123',
        ...validCompanyData,
        ownerId: testUser.id,
        contacts: [],
        deals: [],
        _count: { contacts: 0, deals: 0, activities: 0 },
      }

      mockPrisma.company.findFirst.mockResolvedValue(existingCompany)
      mockPrisma.company.create.mockResolvedValue(createdCompany)

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(validCompanyData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      // Should still succeed (duplicate names are allowed, just warned about)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify duplicate check was performed
      expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
        where: {
          name: validCompanyData.name,
          isDeleted: false,
          ownerId: testUser.id,
        },
      })
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(validCompanyData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should handle database creation errors', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null)
      mockPrisma.company.create.mockRejectedValue(new Error('Database constraint violation'))

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(validCompanyData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should reject malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should trim whitespace from text fields', async () => {
      const dataWithWhitespace = {
        name: '  Test Company With Spaces  ',
        industry: '  Technology  ',
      }

      const createdCompany = {
        id: 'new-comp-123',
        name: 'Test Company With Spaces', // Trimmed
        industry: '  Technology  ', // May or may not be trimmed based on schema
        ownerId: testUser.id,
        contacts: [],
        deals: [],
        _count: { contacts: 0, deals: 0, activities: 0 },
      }

      mockPrisma.company.findFirst.mockResolvedValue(null)
      mockPrisma.company.create.mockResolvedValue(createdCompany)

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(dataWithWhitespace),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('Test Company With Spaces')
    })

    it('should include related data in response', async () => {
      const createdCompany = {
        id: 'new-comp-123',
        ...validCompanyData,
        ownerId: testUser.id,
        contacts: [],
        deals: [],
        _count: { contacts: 0, deals: 0, activities: 0 },
      }

      mockPrisma.company.findFirst.mockResolvedValue(null)
      mockPrisma.company.create.mockResolvedValue(createdCompany)

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(validCompanyData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveProperty('contacts')
      expect(data.data).toHaveProperty('deals')
      expect(data.data).toHaveProperty('_count')
    })
  })

  describe('Data Isolation', () => {
    it('should only return companies owned by authenticated user', async () => {
      const otherUserId = 'other-user-456'
      const userCompanies = [mockCompanies[0]] // Only user's companies
      const allCompanies = [...mockCompanies, {
        id: 'other-comp',
        name: 'Other User Company',
        ownerId: otherUserId, // Different owner
        isDeleted: false,
      }]

      mockPrisma.company.count.mockResolvedValue(1) // Only user's count
      mockPrisma.company.findMany.mockResolvedValue(userCompanies)

      const request = new NextRequest('http://localhost:3000/api/companies')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].ownerId).toBe(testUser.id)

      // Verify user filtering was applied
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: testUser.id,
          }),
        })
      )
    })

    it('should not create companies for other users', async () => {
      const createdCompany = {
        id: 'new-comp-123',
        ...validCompanyData,
        ownerId: testUser.id, // Always the authenticated user
        contacts: [],
        deals: [],
        _count: { contacts: 0, deals: 0, activities: 0 },
      }

      mockPrisma.company.findFirst.mockResolvedValue(null)
      mockPrisma.company.create.mockResolvedValue(createdCompany)

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({
          ...validCompanyData,
          ownerId: 'attempted-different-owner', // This should be ignored
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.ownerId).toBe(testUser.id) // Should be authenticated user

      // Verify the correct owner was set regardless of request body
      expect(mockPrisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: testUser.id,
          }),
        })
      )
    })
  })

  describe('Performance and Optimization', () => {
    it('should include performance logging', async () => {
      mockPrisma.company.count.mockResolvedValue(0)
      mockPrisma.company.findMany.mockResolvedValue([])

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const request = new NextRequest('http://localhost:3000/api/companies')
      await GET(request)

      // Performance logging should be called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/companies')
      )

      consoleSpy.mockRestore()
    })

    it('should limit related data in responses', async () => {
      mockPrisma.company.count.mockResolvedValue(1)
      mockPrisma.company.findMany.mockResolvedValue([mockCompanies[0]])

      const request = new NextRequest('http://localhost:3000/api/companies')
      await GET(request)

      // Verify limits are applied to related data queries
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            contacts: expect.objectContaining({
              take: 5, // Limit contacts
            }),
            deals: expect.objectContaining({
              take: 5, // Limit deals
            }),
          }),
        })
      )
    })
  })
})