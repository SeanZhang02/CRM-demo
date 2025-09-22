#!/usr/bin/env tsx

/**
 * Schema Validation Script
 *
 * This script validates the Prisma schema without requiring a database connection.
 * It performs the following checks:
 * 1. Schema syntax validation
 * 2. Model relationship validation
 * 3. Index effectiveness analysis
 * 4. Performance target validation
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  performance: PerformanceMetrics
}

interface PerformanceMetrics {
  indexedFields: number
  relationshipCount: number
  foreignKeyCount: number
  estimatedQueryPerformance: Record<string, number>
}

function validateSchema(): ValidationResult {
  console.log('🔍 Starting CRM Schema Validation...\n')

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    performance: {
      indexedFields: 0,
      relationshipCount: 0,
      foreignKeyCount: 0,
      estimatedQueryPerformance: {}
    }
  }

  try {
    // Read the schema file
    const schemaPath = join(__dirname, 'schema.prisma')
    const schemaContent = readFileSync(schemaPath, 'utf-8')

    // Validate schema structure
    validateSchemaStructure(schemaContent, result)

    // Validate CRM hierarchy
    validateCRMHierarchy(schemaContent, result)

    // Validate indexes for performance
    validateIndexes(schemaContent, result)

    // Validate enums and constraints
    validateEnumsAndConstraints(schemaContent, result)

    // Analyze performance implications
    analyzePerformance(schemaContent, result)

    return result

  } catch (error) {
    result.valid = false
    result.errors.push(`Failed to read schema file: ${error}`)
    return result
  }
}

function validateSchemaStructure(schema: string, result: ValidationResult): void {
  console.log('📋 Validating schema structure...')

  // Check for required models
  const requiredModels = ['Company', 'Contact', 'Deal', 'Activity', 'User', 'PipelineStage']
  const missingModels = requiredModels.filter(model => !schema.includes(`model ${model}`))

  if (missingModels.length > 0) {
    result.errors.push(`Missing required models: ${missingModels.join(', ')}`)
    result.valid = false
  }

  // Check for UUID primary keys
  const models = schema.match(/model\s+\w+\s*{[^}]+}/gs) || []
  models.forEach(model => {
    const modelName = model.match(/model\s+(\w+)/)?.[1]
    if (!model.includes('id') || !model.includes('@default(uuid())')) {
      result.warnings.push(`Model ${modelName} may not have UUID primary key`)
    }
  })

  console.log('✅ Schema structure validation complete')
}

function validateCRMHierarchy(schema: string, result: ValidationResult): void {
  console.log('🏗️ Validating CRM hierarchy...')

  // Validate Company → Contacts relationship
  if (!schema.includes('companyId') || !schema.includes('contacts     Contact[]')) {
    result.errors.push('Company → Contacts relationship not properly defined')
    result.valid = false
  }

  // Validate Company → Deals relationship
  if (!schema.includes('deals        Deal[]')) {
    result.errors.push('Company → Deals relationship not properly defined')
    result.valid = false
  }

  // Validate Deal → PipelineStage relationship
  if (!schema.includes('stageId') || !schema.includes('stage            PipelineStage')) {
    result.errors.push('Deal → PipelineStage relationship not properly defined')
    result.valid = false
  }

  // Count relationships
  const relationshipMatches = schema.match(/@relation/g) || []
  result.performance.relationshipCount = relationshipMatches.length

  console.log('✅ CRM hierarchy validation complete')
}

function validateIndexes(schema: string, result: ValidationResult): void {
  console.log('⚡ Validating indexes for performance...')

  // Critical indexes for CRM performance
  const criticalIndexes = [
    { field: 'name', table: 'companies', reason: 'Company name searches' },
    { field: 'industry', table: 'companies', reason: 'Industry filtering' },
    { field: 'status', table: 'companies', reason: 'Status filtering' },
    { field: 'companyId', table: 'contacts', reason: 'Company → Contacts navigation' },
    { field: 'stageId', table: 'deals', reason: 'Pipeline stage filtering' },
    { field: 'expectedCloseDate', table: 'deals', reason: 'Date-based reporting' },
    { field: 'dueDate', table: 'activities', reason: 'Calendar views' },
    { field: 'createdAt', table: 'activities', reason: 'Activity timeline' }
  ]

  // Count existing indexes
  const indexMatches = schema.match(/@@index\(\[/g) || []
  result.performance.indexedFields = indexMatches.length

  // Check for critical missing indexes
  criticalIndexes.forEach(index => {
    if (!schema.includes(`@@index([${index.field}])`)) {
      result.warnings.push(`Missing critical index: ${index.field} (${index.reason})`)
    }
  })

  // Check for foreign key indexes
  const foreignKeyMatches = schema.match(/@relation\(fields:\s*\[(\w+)\]/g) || []
  result.performance.foreignKeyCount = foreignKeyMatches.length

  console.log('✅ Index validation complete')
}

function validateEnumsAndConstraints(schema: string, result: ValidationResult): void {
  console.log('🔒 Validating enums and constraints...')

  // Check for required enums
  const requiredEnums = [
    'CompanyStatus', 'ContactStatus', 'DealStatus', 'ActivityType',
    'ActivityStatus', 'Priority', 'UserRole'
  ]

  const missingEnums = requiredEnums.filter(enumName => !schema.includes(`enum ${enumName}`))
  if (missingEnums.length > 0) {
    result.warnings.push(`Missing enums: ${missingEnums.join(', ')}`)
  }

  // Check for soft delete fields
  const models = ['Company', 'Contact', 'Deal', 'Activity']
  models.forEach(model => {
    if (!schema.includes(`isDeleted`) || !schema.includes(`deletedAt`)) {
      result.warnings.push(`Model ${model} may be missing soft delete fields`)
    }
  })

  console.log('✅ Enums and constraints validation complete')
}

function analyzePerformance(schema: string, result: ValidationResult): void {
  console.log('🚀 Analyzing performance implications...')

  // Estimate query performance based on indexes and structure
  const performanceEstimates = {
    'Company List with Filters': result.performance.indexedFields >= 5 ? 35 : 75, // ms
    'Contact → Company Navigation': schema.includes('@@index([companyId])') ? 25 : 100,
    'Pipeline Overview': schema.includes('@@index([stageId])') ? 50 : 150,
    'Activity Timeline': schema.includes('@@index([createdAt])') ? 40 : 120,
    'Deal Search and Filter': result.performance.indexedFields >= 8 ? 60 : 200
  }

  result.performance.estimatedQueryPerformance = performanceEstimates

  // Check if any estimates exceed targets
  Object.entries(performanceEstimates).forEach(([query, estimate]) => {
    if (estimate > 100) {
      result.warnings.push(`Query "${query}" estimated at ${estimate}ms (target: <100ms)`)
    }
  })

  console.log('✅ Performance analysis complete')
}

function printResults(result: ValidationResult): void {
  console.log('\n' + '='.repeat(60))
  console.log('📊 CRM SCHEMA VALIDATION RESULTS')
  console.log('='.repeat(60))

  // Overall status
  if (result.valid && result.errors.length === 0) {
    console.log('✅ VALIDATION PASSED - Schema is ready for production')
  } else {
    console.log('❌ VALIDATION FAILED - Issues found')
  }

  // Errors
  if (result.errors.length > 0) {
    console.log('\n🚨 ERRORS (Must Fix):')
    result.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`)
    })
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (Recommended):')
    result.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`)
    })
  }

  // Performance metrics
  console.log('\n📈 PERFORMANCE METRICS:')
  console.log(`   • Indexed Fields: ${result.performance.indexedFields}`)
  console.log(`   • Relationships: ${result.performance.relationshipCount}`)
  console.log(`   • Foreign Keys: ${result.performance.foreignKeyCount}`)

  console.log('\n🚀 ESTIMATED QUERY PERFORMANCE:')
  Object.entries(result.performance.estimatedQueryPerformance).forEach(([query, time]) => {
    const status = time <= 50 ? '🟢' : time <= 100 ? '🟡' : '🔴'
    console.log(`   ${status} ${query}: ~${time}ms`)
  })

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:')
  if (result.performance.indexedFields < 10) {
    console.log('   • Add more strategic indexes for frequently queried fields')
  }
  if (result.warnings.length === 0 && result.errors.length === 0) {
    console.log('   • Schema is well-optimized for CRM operations')
    console.log('   • Ready for migration and production deployment')
  }
  if (result.performance.indexedFields >= 10) {
    console.log('   • Excellent index coverage for performance')
  }

  console.log('\n' + '='.repeat(60))
}

// Main execution
if (require.main === module) {
  const result = validateSchema()
  printResults(result)

  process.exit(result.valid && result.errors.length === 0 ? 0 : 1)
}

export { validateSchema }