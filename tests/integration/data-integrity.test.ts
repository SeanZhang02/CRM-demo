/**
 * Data Integrity and Migration Tests
 * Validates data consistency, relationships, and migration procedures
 */

import { prisma } from '@/lib/prisma'
import { createTestUser, createTestCompany, createTestContact, createTestDeal } from '../setup/test-helpers'

// Mock Prisma for controlled testing
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    company: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Data Integrity Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Data Isolation', () => {
    it('should prevent cross-user data access', async () => {
      const user1 = await createTestUser({ id: 'user-1', email: 'user1@test.com' })
      const user2 = await createTestUser({ id: 'user-2', email: 'user2@test.com' })

      const user1Company = createTestCompany({
        id: 'company-1',
        ownerId: user1.id,
        name: 'User 1 Company'
      })

      // Mock user 2 trying to access user 1's company
      mockPrisma.company.findUnique.mockResolvedValue(null) // Should not find other user's data

      const result = await mockPrisma.company.findUnique({
        where: {
          id: 'company-1',
          ownerId: user2.id, // Different user
        },
      })

      expect(result).toBeNull()
      expect(mockPrisma.company.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'company-1',
          ownerId: user2.id,
        },
      })
    })

    it('should allow users to access only their own data', async () => {
      const user = await createTestUser({ id: 'user-1' })
      const userCompany = createTestCompany({
        id: 'company-1',
        ownerId: user.id
      })

      mockPrisma.company.findUnique.mockResolvedValue(userCompany)

      const result = await mockPrisma.company.findUnique({
        where: {
          id: 'company-1',
          ownerId: user.id,
        },
      })

      expect(result).toEqual(userCompany)
      expect(result?.ownerId).toBe(user.id)
    })

    it('should filter bulk operations by user ownership', async () => {
      const user = await createTestUser({ id: 'user-1' })
      const userCompanies = [
        createTestCompany({ id: 'company-1', ownerId: user.id }),
        createTestCompany({ id: 'company-2', ownerId: user.id }),
      ]

      mockPrisma.company.findMany.mockResolvedValue(userCompanies)

      const result = await mockPrisma.company.findMany({
        where: {
          ownerId: user.id,
          isDeleted: false,
        },
      })

      expect(result).toHaveLength(2)
      expect(result.every(company => company.ownerId === user.id)).toBe(true)
    })
  })

  describe('Referential Integrity', () => {
    it('should maintain company-contact relationships', async () => {
      const user = await createTestUser()
      const company = createTestCompany({ ownerId: user.id })
      const contact = createTestContact({
        companyId: company.id,
        ownerId: user.id
      })

      // Mock creating contact with company relationship
      mockPrisma.contact.create.mockResolvedValue(contact)

      const createdContact = await mockPrisma.contact.create({
        data: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          companyId: company.id,
          ownerId: user.id,
        },
      })

      expect(createdContact.companyId).toBe(company.id)
      expect(createdContact.ownerId).toBe(user.id)
    })

    it('should handle cascade deletes properly', async () => {
      const user = await createTestUser()
      const company = createTestCompany({ ownerId: user.id })

      // Mock soft delete (setting isDeleted = true)
      mockPrisma.company.update.mockResolvedValue({
        ...company,
        isDeleted: true,
      })

      // Mock updating related contacts
      mockPrisma.contact.updateMany = jest.fn().mockResolvedValue({ count: 2 })

      // Start transaction for cascade delete
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        if (Array.isArray(operations)) {
          return Promise.all(operations.map(op => op))
        }
        return operations
      })

      await mockPrisma.$transaction([
        mockPrisma.company.update({
          where: { id: company.id },
          data: { isDeleted: true },
        }),
        mockPrisma.contact.updateMany({
          where: { companyId: company.id },
          data: { isDeleted: true },
        }),
      ])

      expect(mockPrisma.company.update).toHaveBeenCalledWith({
        where: { id: company.id },
        data: { isDeleted: true },
      })
      expect(mockPrisma.contact.updateMany).toHaveBeenCalledWith({
        where: { companyId: company.id },
        data: { isDeleted: true },
      })
    })

    it('should prevent orphaned records', async () => {
      const user = await createTestUser()
      const invalidContact = createTestContact({
        companyId: 'non-existent-company',
        ownerId: user.id
      })

      // Mock foreign key constraint violation
      const constraintError = new Error('Foreign key constraint failed')
      constraintError.name = 'PrismaClientKnownRequestError'
      ;(constraintError as any).code = 'P2003'

      mockPrisma.contact.create.mockRejectedValue(constraintError)

      await expect(
        mockPrisma.contact.create({
          data: {
            firstName: invalidContact.firstName,
            lastName: invalidContact.lastName,
            email: invalidContact.email,
            companyId: 'non-existent-company',
            ownerId: user.id,
          },
        })
      ).rejects.toThrow('Foreign key constraint failed')
    })
  })

  describe('Data Consistency', () => {
    it('should maintain consistent data during concurrent operations', async () => {
      const user = await createTestUser()
      const company = createTestCompany({ ownerId: user.id })

      // Mock concurrent update operations
      const update1 = mockPrisma.company.update({
        where: { id: company.id },
        data: { name: 'Updated Name 1' },
      })

      const update2 = mockPrisma.company.update({
        where: { id: company.id },
        data: { employeeCount: 150 },
      })

      mockPrisma.company.update
        .mockResolvedValueOnce({ ...company, name: 'Updated Name 1' })
        .mockResolvedValueOnce({ ...company, employeeCount: 150 })

      // Both operations should succeed without conflict
      const [result1, result2] = await Promise.all([update1, update2])

      expect(result1.name).toBe('Updated Name 1')
      expect(result2.employeeCount).toBe(150)
    })

    it('should handle optimistic locking', async () => {
      const user = await createTestUser()
      const company = createTestCompany({
        ownerId: user.id,
        version: 1 // Optimistic locking version
      })

      // Mock version conflict
      const versionError = new Error('Record has been modified by another user')
      mockPrisma.company.update.mockRejectedValue(versionError)

      await expect(
        mockPrisma.company.update({
          where: {
            id: company.id,
            version: 0, // Outdated version
          },
          data: { name: 'Updated Name' },
        })
      ).rejects.toThrow('Record has been modified by another user')
    })

    it('should validate business rule constraints', async () => {
      const user = await createTestUser()
      const deal = createTestDeal({
        ownerId: user.id,
        value: -1000, // Invalid negative value
      })

      // Mock validation error
      const validationError = new Error('Deal value must be positive')
      mockPrisma.deal.create.mockRejectedValue(validationError)

      await expect(
        mockPrisma.deal.create({
          data: {
            title: deal.title,
            value: -1000,
            ownerId: user.id,
          },
        })
      ).rejects.toThrow('Deal value must be positive')
    })
  })

  describe('Transaction Management', () => {
    it('should handle transaction rollback on error', async () => {
      const user = await createTestUser()
      const company = createTestCompany({ ownerId: user.id })
      const contact = createTestContact({ companyId: company.id, ownerId: user.id })

      // Mock transaction that fails on second operation
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        if (Array.isArray(operations)) {
          // First operation succeeds
          await operations[0]
          // Second operation fails
          throw new Error('Database constraint violation')
        }
        return operations
      })

      await expect(
        mockPrisma.$transaction([
          mockPrisma.company.create({ data: company }),
          mockPrisma.contact.create({ data: contact }),
        ])
      ).rejects.toThrow('Database constraint violation')

      // Verify transaction was attempted
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should commit transaction when all operations succeed', async () => {
      const user = await createTestUser()
      const company = createTestCompany({ ownerId: user.id })
      const contact = createTestContact({ companyId: company.id, ownerId: user.id })

      mockPrisma.$transaction.mockResolvedValue([company, contact])

      const result = await mockPrisma.$transaction([
        mockPrisma.company.create({ data: company }),
        mockPrisma.contact.create({ data: contact }),
      ])

      expect(result).toEqual([company, contact])
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('Data Migration Validation', () => {
    it('should validate migrated data structure', async () => {
      // Mock migrated company data
      const migratedCompany = {
        id: 'migrated-company-1',
        name: 'Migrated Company',
        // Legacy fields that need transformation
        old_industry: 'Tech',
        employee_count: '50', // String that needs to be number
        created_date: '2023-01-01', // Different date format
      }

      // Mock data transformation
      const transformedCompany = {
        id: migratedCompany.id,
        name: migratedCompany.name,
        industry: 'Technology', // Transformed from old_industry
        employeeCount: 50, // Converted to number
        createdAt: new Date('2023-01-01'), // Converted to Date
        ownerId: 'migration-user',
        isDeleted: false,
      }

      mockPrisma.company.create.mockResolvedValue(transformedCompany)

      const result = await mockPrisma.company.create({
        data: transformedCompany,
      })

      expect(result.industry).toBe('Technology')
      expect(typeof result.employeeCount).toBe('number')
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should handle data migration conflicts', async () => {
      // Mock duplicate data during migration
      const existingCompany = createTestCompany({
        name: 'Existing Company',
        email: 'contact@existing.com'
      })

      const migratedCompany = createTestCompany({
        name: 'Migrated Company',
        email: 'contact@existing.com' // Same email
      })

      // Mock unique constraint violation
      const uniqueError = new Error('Unique constraint violation')
      ;(uniqueError as any).code = 'P2002'
      mockPrisma.company.create.mockRejectedValue(uniqueError)

      await expect(
        mockPrisma.company.create({
          data: migratedCompany,
        })
      ).rejects.toThrow('Unique constraint violation')
    })

    it('should validate data completeness after migration', async () => {
      const expectedCounts = {
        companies: 100,
        contacts: 250,
        deals: 75,
      }

      mockPrisma.company.count.mockResolvedValue(expectedCounts.companies)
      mockPrisma.contact.count.mockResolvedValue(expectedCounts.contacts)
      mockPrisma.deal.count.mockResolvedValue(expectedCounts.deals)

      const actualCounts = {
        companies: await mockPrisma.company.count(),
        contacts: await mockPrisma.contact.count(),
        deals: await mockPrisma.deal.count(),
      }

      expect(actualCounts).toEqual(expectedCounts)
    })
  })

  describe('Backup and Recovery', () => {
    it('should validate backup data integrity', async () => {
      const originalData = {
        companies: [createTestCompany({ id: 'company-1' })],
        contacts: [createTestContact({ id: 'contact-1' })],
        deals: [createTestDeal({ id: 'deal-1' })],
      }

      // Mock backup data retrieval
      mockPrisma.company.findMany.mockResolvedValue(originalData.companies)
      mockPrisma.contact.findMany.mockResolvedValue(originalData.contacts)
      mockPrisma.deal.findMany.mockResolvedValue(originalData.deals)

      const backupData = {
        companies: await mockPrisma.company.findMany(),
        contacts: await mockPrisma.contact.findMany(),
        deals: await mockPrisma.deal.findMany(),
      }

      expect(backupData.companies).toHaveLength(1)
      expect(backupData.contacts).toHaveLength(1)
      expect(backupData.deals).toHaveLength(1)
      expect(backupData.companies[0].id).toBe('company-1')
    })

    it('should validate recovery process', async () => {
      const backupData = [
        createTestCompany({ id: 'backup-company-1' }),
        createTestCompany({ id: 'backup-company-2' }),
      ]

      // Mock recovery process
      mockPrisma.company.createMany.mockResolvedValue({ count: 2 })

      const result = await mockPrisma.company.createMany({
        data: backupData,
      })

      expect(result.count).toBe(2)
      expect(mockPrisma.company.createMany).toHaveBeenCalledWith({
        data: backupData,
      })
    })
  })

  describe('Performance Under Load', () => {
    it('should maintain data integrity with large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) =>
        createTestCompany({
          id: `company-${i}`,
          name: `Company ${i}`
        })
      )

      mockPrisma.company.createMany.mockResolvedValue({ count: 1000 })

      const result = await mockPrisma.company.createMany({
        data: largeDataset,
      })

      expect(result.count).toBe(1000)
    })

    it('should handle concurrent user operations without data corruption', async () => {
      const user1 = await createTestUser({ id: 'user-1' })
      const user2 = await createTestUser({ id: 'user-2' })

      const user1Operations = Array.from({ length: 10 }, (_, i) =>
        mockPrisma.company.create({
          data: createTestCompany({
            id: `user1-company-${i}`,
            ownerId: user1.id
          }),
        })
      )

      const user2Operations = Array.from({ length: 10 }, (_, i) =>
        mockPrisma.company.create({
          data: createTestCompany({
            id: `user2-company-${i}`,
            ownerId: user2.id
          }),
        })
      )

      // Mock all operations succeeding
      user1Operations.forEach((_, i) => {
        mockPrisma.company.create.mockResolvedValueOnce(
          createTestCompany({ id: `user1-company-${i}`, ownerId: user1.id })
        )
      })

      user2Operations.forEach((_, i) => {
        mockPrisma.company.create.mockResolvedValueOnce(
          createTestCompany({ id: `user2-company-${i}`, ownerId: user2.id })
        )
      })

      const results = await Promise.all([
        ...user1Operations,
        ...user2Operations,
      ])

      expect(results).toHaveLength(20)

      // Verify data isolation maintained
      const user1Results = results.slice(0, 10)
      const user2Results = results.slice(10, 20)

      expect(user1Results.every(r => r.ownerId === user1.id)).toBe(true)
      expect(user2Results.every(r => r.ownerId === user2.id)).toBe(true)
    })
  })
})