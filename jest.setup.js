import '@testing-library/jest-dom'

// Mock console.warn and console.error for cleaner test output
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Prisma client for database tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
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
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  })),
}))

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}))

// Mock drag and drop
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => children,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}))

// Mock framer-motion for animation tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
  },
  AnimatePresence: ({ children }) => children,
}))

// Setup global test utilities
global.testUtils = {
  // Mock user data
  mockUser: {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  },

  // Mock company data
  mockCompany: {
    id: 'comp_123',
    name: 'Test Company',
    industry: 'Technology',
    website: 'https://example.com',
    employees: 50,
    userId: 'user_123',
  },

  // Mock contact data
  mockContact: {
    id: 'cont_123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    companyId: 'comp_123',
    userId: 'user_123',
  },

  // Mock deal data
  mockDeal: {
    id: 'deal_123',
    title: 'Test Deal',
    value: 50000,
    stage: 'qualified',
    probability: 75,
    companyId: 'comp_123',
    contactId: 'cont_123',
    userId: 'user_123',
  },
}

// Increase timeout for slow operations
jest.setTimeout(30000)

// Mock fetch for API testing
global.fetch = jest.fn()

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  fetch.mockClear()
})

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks()
})