#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * Tests all CRM API endpoints with various scenarios
 *
 * Usage: node scripts/test-api-endpoints.js
 */

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000'

// Test configurations
const testCases = {
  companies: {
    create: {
      name: 'Test Company Ltd',
      industry: 'Technology',
      website: 'https://testcompany.com',
      phone: '+1234567890',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      companySize: 'MEDIUM',
      status: 'PROSPECT',
      annualRevenue: 1000000,
      employeeCount: 50
    },
    filters: {
      search: 'Test',
      industry: 'Technology',
      status: 'PROSPECT',
      companySize: 'MEDIUM'
    }
  },
  contacts: {
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@testcompany.com',
      phone: '+1234567890',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      isPrimary: true,
      status: 'ACTIVE'
    },
    filters: {
      search: 'John',
      status: 'ACTIVE',
      isPrimary: true
    }
  },
  deals: {
    filters: {
      search: 'Test',
      status: 'OPEN',
      priority: 'MEDIUM',
      minValue: 1000,
      maxValue: 100000
    }
  },
  activities: {
    create: {
      type: 'CALL',
      subject: 'Follow-up call',
      description: 'Discuss project requirements',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    filters: {
      search: 'Follow-up',
      type: 'CALL',
      status: 'PENDING',
      priority: 'MEDIUM'
    }
  }
}

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  errors: []
}

// Helper functions
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${baseUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const data = await response.json()
    return { response, data }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`)
  }
}

function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} ${testName}`)

  if (!success) {
    console.log(`   Details: ${details}`)
    results.errors.push({ test: testName, details })
    results.failed++
  } else {
    results.passed++
  }

  if (details && success) {
    console.log(`   ${details}`)
  }
}

async function testEndpoint(entity, method, endpoint, data = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      ...(data && { body: JSON.stringify(data) })
    }

    const { response, data: responseData } = await makeRequest(endpoint, options)

    const success = response.status === expectedStatus
    const details = success
      ? `Status: ${response.status}, Response: ${responseData.success ? 'Success' : 'Error'}`
      : `Expected ${expectedStatus}, got ${response.status}: ${responseData.error?.message || 'Unknown error'}`

    logTest(`${method} ${endpoint}`, success, details)

    return { success, response, data: responseData }
  } catch (error) {
    logTest(`${method} ${endpoint}`, false, error.message)
    return { success: false, error }
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests\n')
  console.log(`Testing against: ${baseUrl}\n`)

  let createdCompanyId = null
  let createdContactId = null
  let createdDealId = null
  let createdActivityId = null

  // 1. Test Companies Endpoints
  console.log('📊 Testing Companies Endpoints')

  // Create company
  const companyResult = await testEndpoint(
    'companies',
    'POST',
    '/api/companies',
    testCases.companies.create,
    200
  )

  if (companyResult.success && companyResult.data.data) {
    createdCompanyId = companyResult.data.data.id
    console.log(`   Created company ID: ${createdCompanyId}`)
  }

  // List companies
  await testEndpoint('companies', 'GET', '/api/companies')

  // List companies with filters
  const companyFilters = new URLSearchParams(testCases.companies.filters).toString()
  await testEndpoint('companies', 'GET', `/api/companies?${companyFilters}`)

  // Get company count
  await testEndpoint('companies', 'GET', `/api/companies/count?${companyFilters}`)

  // Get specific company (if created)
  if (createdCompanyId) {
    await testEndpoint('companies', 'GET', `/api/companies/${createdCompanyId}`)

    // Update company
    await testEndpoint(
      'companies',
      'PUT',
      `/api/companies/${createdCompanyId}`,
      { name: 'Updated Test Company Ltd' }
    )
  }

  console.log('')

  // 2. Test Contacts Endpoints
  console.log('👥 Testing Contacts Endpoints')

  // Create contact
  const contactData = {
    ...testCases.contacts.create,
    ...(createdCompanyId && { companyId: createdCompanyId })
  }

  const contactResult = await testEndpoint(
    'contacts',
    'POST',
    '/api/contacts',
    contactData,
    200
  )

  if (contactResult.success && contactResult.data.data) {
    createdContactId = contactResult.data.data.id
    console.log(`   Created contact ID: ${createdContactId}`)
  }

  // List contacts
  await testEndpoint('contacts', 'GET', '/api/contacts')

  // List contacts with filters
  const contactFilters = new URLSearchParams(testCases.contacts.filters).toString()
  await testEndpoint('contacts', 'GET', `/api/contacts?${contactFilters}`)

  // Get contact count
  await testEndpoint('contacts', 'GET', `/api/contacts/count?${contactFilters}`)

  // Get specific contact (if created)
  if (createdContactId) {
    await testEndpoint('contacts', 'GET', `/api/contacts/${createdContactId}`)

    // Update contact
    await testEndpoint(
      'contacts',
      'PUT',
      `/api/contacts/${createdContactId}`,
      { jobTitle: 'Senior Software Engineer' }
    )
  }

  console.log('')

  // 3. Test Pipeline Stages
  console.log('📈 Testing Pipeline Stages Endpoints')

  // List pipeline stages
  await testEndpoint('pipeline-stages', 'GET', '/api/pipeline-stages')

  console.log('')

  // 4. Test Deals Endpoints
  console.log('💰 Testing Deals Endpoints')

  // List deals
  await testEndpoint('deals', 'GET', '/api/deals')

  // List deals with filters
  const dealFilters = new URLSearchParams(testCases.deals.filters).toString()
  await testEndpoint('deals', 'GET', `/api/deals?${dealFilters}`)

  // Get deal count
  await testEndpoint('deals', 'GET', `/api/deals/count?${dealFilters}`)

  console.log('')

  // 5. Test Activities Endpoints
  console.log('📅 Testing Activities Endpoints')

  // Create activity
  const activityData = {
    ...testCases.activities.create,
    ...(createdCompanyId && { companyId: createdCompanyId }),
    ...(createdContactId && { contactId: createdContactId })
  }

  const activityResult = await testEndpoint(
    'activities',
    'POST',
    '/api/activities',
    activityData,
    200
  )

  if (activityResult.success && activityResult.data.data) {
    createdActivityId = activityResult.data.data.id
    console.log(`   Created activity ID: ${createdActivityId}`)
  }

  // List activities
  await testEndpoint('activities', 'GET', '/api/activities')

  // List activities with filters
  const activityFilters = new URLSearchParams(testCases.activities.filters).toString()
  await testEndpoint('activities', 'GET', `/api/activities?${activityFilters}`)

  console.log('')

  // 6. Test Advanced Filtering
  console.log('🔍 Testing Advanced Filtering')

  const advancedFilter = {
    entity: 'companies',
    filters: {
      operator: 'AND',
      conditions: [
        {
          field: 'name',
          operator: 'contains',
          value: 'Test'
        },
        {
          field: 'status',
          operator: 'equals',
          value: 'PROSPECT'
        }
      ]
    },
    pagination: {
      page: 1,
      limit: 10
    }
  }

  await testEndpoint('filter', 'POST', '/api/filter', advancedFilter)

  // Get filter configuration
  await testEndpoint('filter-config', 'GET', '/api/filter/config')
  await testEndpoint('filter-config-companies', 'GET', '/api/filter/config?entity=companies')

  console.log('')

  // 7. Test Global Search
  console.log('🔎 Testing Global Search')

  await testEndpoint('search', 'GET', '/api/search?q=Test&entities=companies,contacts')
  await testEndpoint('search-detailed', 'GET', '/api/search?q=Test&includeRelated=true')

  console.log('')

  // 8. Test Export Functionality
  console.log('📤 Testing Export Functionality')

  const exportConfig = {
    entity: 'companies',
    filters: {
      operator: 'AND',
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'PROSPECT'
        }
      ]
    },
    format: 'csv'
  }

  await testEndpoint('export', 'POST', '/api/export', exportConfig)

  console.log('')

  // 9. Test Health Endpoint
  console.log('🏥 Testing Health Endpoint')
  await testEndpoint('health', 'GET', '/api/health')

  console.log('')

  // 10. Clean up (optional - delete created records)
  console.log('🧹 Cleanup (deleting test records)')

  if (createdActivityId) {
    await testEndpoint('activities', 'DELETE', `/api/activities/${createdActivityId}`, null, 200)
  }

  if (createdContactId) {
    await testEndpoint('contacts', 'DELETE', `/api/contacts/${createdContactId}`, null, 200)
  }

  if (createdCompanyId) {
    await testEndpoint('companies', 'DELETE', `/api/companies/${createdCompanyId}`, null, 200)
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`)

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.errors.forEach(error => {
      console.log(`   - ${error.test}: ${error.details}`)
    })
  }

  console.log('\n🎉 API Testing Complete!')

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0)
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })
}

module.exports = { runTests }