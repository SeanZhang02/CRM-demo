/**
 * Test Helper Utilities
 * Provides common functions for setting up test data and mocking
 */

import { randomUUID } from 'crypto'

export interface TestUser {
  id: string
  email: string
  name: string
  role: string
  emailVerified: Date | null
  image: string | null
}

export interface TestSession {
  user: TestUser
  expires: string
}

/**
 * Create a test user with realistic data
 */
export async function createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
  return {
    id: randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    emailVerified: new Date(),
    image: null,
    ...overrides,
  }
}

/**
 * Create a test session for authentication
 */
export async function createTestSession(user: TestUser): Promise<TestSession> {
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  }
}

/**
 * Create test company data
 */
export function createTestCompany(overrides: any = {}) {
  return {
    id: randomUUID(),
    name: 'Test Company',
    industry: 'Technology',
    website: 'https://example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'USA',
    companySize: 'MEDIUM',
    status: 'ACTIVE',
    annualRevenue: 1000000,
    employeeCount: 100,
    ownerId: randomUUID(),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Create test contact data
 */
export function createTestContact(overrides: any = {}) {
  return {
    id: randomUUID(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    jobTitle: 'Sales Manager',
    isPrimary: false,
    companyId: randomUUID(),
    ownerId: randomUUID(),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Create test deal data
 */
export function createTestDeal(overrides: any = {}) {
  return {
    id: randomUUID(),
    title: 'Test Deal',
    description: 'A test deal for testing purposes',
    value: 50000,
    currency: 'USD',
    status: 'QUALIFIED',
    probability: 75,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    actualCloseDate: null,
    companyId: randomUUID(),
    contactId: randomUUID(),
    ownerId: randomUUID(),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Create test activity data
 */
export function createTestActivity(overrides: any = {}) {
  return {
    id: randomUUID(),
    type: 'EMAIL',
    subject: 'Test Activity',
    description: 'A test activity for testing purposes',
    status: 'COMPLETED',
    scheduledAt: new Date(),
    completedAt: new Date(),
    companyId: randomUUID(),
    contactId: null,
    dealId: null,
    ownerId: randomUUID(),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Create test filter configuration
 */
export function createTestFilterConfig(overrides: any = {}) {
  return {
    groups: [
      {
        id: randomUUID(),
        conditions: [
          {
            id: randomUUID(),
            field: 'name',
            operator: 'contains',
            value: 'test',
            logicalOperator: 'AND',
          },
        ],
        logicalOperator: 'AND',
      },
    ],
    name: 'Test Filter',
    isPublic: false,
    ...overrides,
  }
}

/**
 * Mock API request with proper headers
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
) {
  const { method = 'GET', body, headers = {}, searchParams } = options

  let fullUrl = url
  if (searchParams) {
    const params = new URLSearchParams(searchParams)
    fullUrl += `?${params.toString()}`
  }

  const mockRequest = {
    url: fullUrl,
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }

  return mockRequest as any
}

/**
 * Mock API response for testing
 */
export function createMockResponse(
  data: any,
  options: {
    status?: number
    headers?: Record<string, string>
  } = {}
) {
  const { status = 200, headers = {} } = options

  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    json: async () => data,
    text: async () => JSON.stringify(data),
  }
}

/**
 * Wait for a specified amount of time (useful for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate realistic test data arrays
 */
export function generateTestCompanies(count: number, baseData: any = {}) {
  return Array.from({ length: count }, (_, index) =>
    createTestCompany({
      name: `Test Company ${index + 1}`,
      industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing'][index % 4],
      status: ['ACTIVE', 'PROSPECT', 'CUSTOMER', 'INACTIVE'][index % 4],
      ...baseData,
    })
  )
}

export function generateTestContacts(count: number, baseData: any = {}) {
  return Array.from({ length: count }, (_, index) =>
    createTestContact({
      firstName: `Contact${index + 1}`,
      lastName: `LastName${index + 1}`,
      email: `contact${index + 1}@example.com`,
      ...baseData,
    })
  )
}

export function generateTestDeals(count: number, baseData: any = {}) {
  return Array.from({ length: count }, (_, index) =>
    createTestDeal({
      title: `Deal ${index + 1}`,
      value: (index + 1) * 10000,
      status: ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'][index % 6],
      ...baseData,
    })
  )
}

/**
 * Clean up test data (implement based on your test setup)
 */
export async function cleanupTestData(): Promise<void> {
  // In a real test environment, you would clean up test database records
  // For now, this is a placeholder that can be extended based on your setup
  console.log('Cleaning up test data...')
}

/**
 * Set up test database (implement based on your test setup)
 */
export async function setupTestDatabase(): Promise<void> {
  // In a real test environment, you would set up test database
  // This could include running migrations, seeding data, etc.
  console.log('Setting up test database...')
}

/**
 * Create mock Prisma client with common methods
 */
export function createMockPrismaClient() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    activity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  }
}

/**
 * Mock performance logger for testing
 */
export function createMockPerformanceLogger(operation: string) {
  return {
    start: Date.now(),
    operation,
    end: jest.fn(() => {
      console.log(`Performance: ${operation} completed`)
    }),
  }
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response: any, expectedStructure: any) {
  expect(response).toHaveProperty('success')
  expect(response).toHaveProperty('data')

  if (expectedStructure.pagination) {
    expect(response).toHaveProperty('pagination')
    expect(response.pagination).toHaveProperty('page')
    expect(response.pagination).toHaveProperty('limit')
    expect(response.pagination).toHaveProperty('total')
    expect(response.pagination).toHaveProperty('totalPages')
  }

  if (expectedStructure.error && !response.success) {
    expect(response).toHaveProperty('error')
  }
}

/**
 * Create realistic filter test scenarios
 */
export const filterTestScenarios = {
  simpleSearch: {
    query: { search: 'Acme' },
    expectedWhere: {
      OR: [
        { name: { contains: 'Acme', mode: 'insensitive' } },
        { industry: { contains: 'Acme', mode: 'insensitive' } },
      ],
    },
  },
  statusFilter: {
    query: { status: 'ACTIVE' },
    expectedWhere: { status: 'ACTIVE' },
  },
  combinedFilters: {
    query: { search: 'Tech', status: 'ACTIVE', industry: 'Technology' },
    expectedWhere: {
      OR: [{ name: { contains: 'Tech', mode: 'insensitive' } }],
      status: 'ACTIVE',
      industry: 'Technology',
    },
  },
  pagination: {
    query: { page: '2', limit: '10' },
    expectedPagination: { skip: 10, take: 10 },
  },
  sorting: {
    query: { sortBy: 'name', sortOrder: 'desc' },
    expectedOrderBy: { name: 'desc' },
  },
}

/**
 * Assertion helpers for common test patterns
 */
export const assertions = {
  isValidUUID: (value: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(value).toMatch(uuidRegex)
  },

  isValidEmail: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    expect(value).toMatch(emailRegex)
  },

  isValidUrl: (value: string) => {
    expect(() => new URL(value)).not.toThrow()
  },

  isValidDate: (value: any) => {
    expect(value).toBeInstanceOf(Date)
    expect(value.getTime()).not.toBeNaN()
  },

  hasValidPagination: (pagination: any) => {
    expect(pagination).toHaveProperty('page')
    expect(pagination).toHaveProperty('limit')
    expect(pagination).toHaveProperty('total')
    expect(pagination).toHaveProperty('totalPages')
    expect(pagination).toHaveProperty('hasNext')
    expect(pagination).toHaveProperty('hasPrev')
    expect(typeof pagination.page).toBe('number')
    expect(typeof pagination.limit).toBe('number')
    expect(typeof pagination.total).toBe('number')
    expect(typeof pagination.totalPages).toBe('number')
    expect(typeof pagination.hasNext).toBe('boolean')
    expect(typeof pagination.hasPrev).toBe('boolean')
  },
}