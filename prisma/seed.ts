import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean up existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning up existing data...')
    await prisma.activity.deleteMany()
    await prisma.deal.deleteMany()
    await prisma.contact.deleteMany()
    await prisma.company.deleteMany()
    await prisma.pipelineStage.deleteMany()
    await prisma.user.deleteMany()
  }

  // Create default pipeline stages for CRM
  console.log('📊 Creating pipeline stages...')
  const stages = await Promise.all([
    prisma.pipelineStage.create({
      data: {
        name: 'Lead',
        description: 'Initial contact made, qualified interest',
        position: 0,
        probability: 0.10,
        color: '#EF4444',
        stageType: 'LEAD'
      }
    }),
    prisma.pipelineStage.create({
      data: {
        name: 'Qualified',
        description: 'Budget confirmed, decision maker identified',
        position: 1,
        probability: 0.25,
        color: '#F59E0B',
        stageType: 'OPPORTUNITY'
      }
    }),
    prisma.pipelineStage.create({
      data: {
        name: 'Proposal',
        description: 'Formal proposal submitted',
        position: 2,
        probability: 0.50,
        color: '#3B82F6',
        stageType: 'PROPOSAL'
      }
    }),
    prisma.pipelineStage.create({
      data: {
        name: 'Negotiation',
        description: 'Terms being negotiated',
        position: 3,
        probability: 0.75,
        color: '#8B5CF6',
        stageType: 'NEGOTIATION'
      }
    }),
    prisma.pipelineStage.create({
      data: {
        name: 'Closed Won',
        description: 'Deal successfully closed',
        position: 4,
        probability: 1.00,
        color: '#10B981',
        stageType: 'CLOSED_WON'
      }
    }),
    prisma.pipelineStage.create({
      data: {
        name: 'Closed Lost',
        description: 'Deal lost to competitor or no decision',
        position: 5,
        probability: 0.00,
        color: '#6B7280',
        stageType: 'CLOSED_LOST'
      }
    })
  ])

  // Create demo users
  console.log('👥 Creating demo users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@crm.local',
        name: 'Sarah Johnson',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'ADMIN',
        timezone: 'America/New_York',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'sales@crm.local',
        name: 'Mike Chen',
        firstName: 'Mike',
        lastName: 'Chen',
        role: 'USER',
        timezone: 'America/Los_Angeles',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'manager@crm.local',
        name: 'Alex Rodriguez',
        firstName: 'Alex',
        lastName: 'Rodriguez',
        role: 'MANAGER',
        timezone: 'America/Chicago',
        isActive: true
      }
    })
  ])

  // Create realistic companies
  console.log('🏢 Creating demo companies...')
  const companies = await Promise.all([
    // Technology Companies
    prisma.company.create({
      data: {
        name: 'TechFlow Solutions',
        industry: 'Technology',
        website: 'https://techflow.com',
        phone: '+1-555-0101',
        address: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States',
        companySize: 'MEDIUM',
        status: 'PROSPECT',
        annualRevenue: 2500000.00,
        employeeCount: 75,
        ownerId: users[0].id
      }
    }),
    prisma.company.create({
      data: {
        name: 'DataCorp Analytics',
        industry: 'Data Analytics',
        website: 'https://datacorp.io',
        phone: '+1-555-0102',
        address: '456 Analytics Blvd',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'United States',
        companySize: 'LARGE',
        status: 'CUSTOMER',
        annualRevenue: 15000000.00,
        employeeCount: 320,
        ownerId: users[1].id
      }
    }),
    // Manufacturing Companies
    prisma.company.create({
      data: {
        name: 'Precision Manufacturing Inc',
        industry: 'Manufacturing',
        website: 'https://precisionmfg.com',
        phone: '+1-555-0103',
        address: '789 Industrial Way',
        city: 'Detroit',
        state: 'MI',
        postalCode: '48201',
        country: 'United States',
        companySize: 'LARGE',
        status: 'ACTIVE',
        annualRevenue: 45000000.00,
        employeeCount: 850,
        ownerId: users[2].id
      }
    }),
    // Healthcare Companies
    prisma.company.create({
      data: {
        name: 'HealthTech Innovations',
        industry: 'Healthcare',
        website: 'https://healthtech.med',
        phone: '+1-555-0104',
        address: '321 Medical Plaza',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'United States',
        companySize: 'MEDIUM',
        status: 'PROSPECT',
        annualRevenue: 8500000.00,
        employeeCount: 145,
        ownerId: users[0].id
      }
    }),
    // Small Business / Startups
    prisma.company.create({
      data: {
        name: 'GreenLeaf Consulting',
        industry: 'Consulting',
        website: 'https://greenleaf.biz',
        phone: '+1-555-0105',
        address: '654 Sustainability St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'United States',
        companySize: 'SMALL',
        status: 'ACTIVE',
        annualRevenue: 750000.00,
        employeeCount: 25,
        ownerId: users[1].id
      }
    }),
    prisma.company.create({
      data: {
        name: 'Startup Velocity',
        industry: 'Technology',
        website: 'https://startupvelocity.co',
        phone: '+1-555-0106',
        address: '987 Founder Lane',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'United States',
        companySize: 'STARTUP',
        status: 'PROSPECT',
        annualRevenue: 180000.00,
        employeeCount: 8,
        ownerId: users[2].id
      }
    }),
    // Retail Companies
    prisma.company.create({
      data: {
        name: 'Urban Retail Group',
        industry: 'Retail',
        website: 'https://urbanretail.com',
        phone: '+1-555-0107',
        address: '147 Commerce Center',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'United States',
        companySize: 'LARGE',
        status: 'CUSTOMER',
        annualRevenue: 95000000.00,
        employeeCount: 1200,
        ownerId: users[0].id
      }
    }),
    // Financial Services
    prisma.company.create({
      data: {
        name: 'NextGen Financial',
        industry: 'Financial Services',
        website: 'https://nextgenfinancial.com',
        phone: '+1-555-0108',
        address: '258 Wall Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10005',
        country: 'United States',
        companySize: 'MEDIUM',
        status: 'PROSPECT',
        annualRevenue: 12000000.00,
        employeeCount: 180,
        ownerId: users[1].id
      }
    })
  ])

  // Create realistic contacts for each company
  console.log('👤 Creating demo contacts...')
  const contacts = []

  // TechFlow Solutions contacts
  contacts.push(await prisma.contact.create({
    data: {
      firstName: 'Jennifer',
      lastName: 'Wilson',
      email: 'jennifer.wilson@techflow.com',
      phone: '+1-555-0201',
      jobTitle: 'Chief Technology Officer',
      department: 'Technology',
      isPrimary: true,
      preferredContact: 'EMAIL',
      status: 'ACTIVE',
      linkedinUrl: 'https://linkedin.com/in/jenniferwilson',
      companyId: companies[0].id,
      ownerId: users[0].id
    }
  }))

  contacts.push(await prisma.contact.create({
    data: {
      firstName: 'Robert',
      lastName: 'Davis',
      email: 'robert.davis@techflow.com',
      phone: '+1-555-0202',
      mobilePhone: '+1-555-0203',
      jobTitle: 'VP of Engineering',
      department: 'Engineering',
      isPrimary: false,
      preferredContact: 'PHONE',
      status: 'ACTIVE',
      companyId: companies[0].id,
      ownerId: users[0].id
    }
  }))

  // DataCorp Analytics contacts
  contacts.push(await prisma.contact.create({
    data: {
      firstName: 'Maria',
      lastName: 'Gonzalez',
      email: 'maria.gonzalez@datacorp.io',
      phone: '+1-555-0204',
      jobTitle: 'Director of Analytics',
      department: 'Data Science',
      isPrimary: true,
      preferredContact: 'EMAIL',
      status: 'ACTIVE',
      linkedinUrl: 'https://linkedin.com/in/mariagonzalez',
      companyId: companies[1].id,
      ownerId: users[1].id
    }
  }))

  // Precision Manufacturing contacts
  contacts.push(await prisma.contact.create({
    data: {
      firstName: 'David',
      lastName: 'Thompson',
      email: 'david.thompson@precisionmfg.com',
      phone: '+1-555-0205',
      jobTitle: 'Operations Manager',
      department: 'Operations',
      isPrimary: true,
      preferredContact: 'PHONE',
      status: 'ACTIVE',
      companyId: companies[2].id,
      ownerId: users[2].id
    }
  }))

  // HealthTech Innovations contacts
  contacts.push(await prisma.contact.create({
    data: {
      firstName: 'Dr. Lisa',
      lastName: 'Park',
      email: 'lisa.park@healthtech.med',
      phone: '+1-555-0206',
      jobTitle: 'Chief Medical Officer',
      department: 'Medical',
      isPrimary: true,
      preferredContact: 'EMAIL',
      status: 'ACTIVE',
      linkedinUrl: 'https://linkedin.com/in/drpark',
      companyId: companies[3].id,
      ownerId: users[0].id
    }
  }))

  // GreenLeaf Consulting contacts
  contacts.push(await prisma.contact.create({
    data: {
      firstName: 'James',
      lastName: 'Miller',
      email: 'james.miller@greenleaf.biz',
      phone: '+1-555-0207',
      jobTitle: 'Founder & CEO',
      department: 'Executive',
      isPrimary: true,
      preferredContact: 'MOBILE',
      status: 'ACTIVE',
      mobilePhone: '+1-555-0208',
      companyId: companies[4].id,
      ownerId: users[1].id
    }
  }))

  // Startup Velocity contacts
  contacts.push(await prisma.contact.create({
    data: {
      firstName: 'Emma',
      lastName: 'Taylor',
      email: 'emma.taylor@startupvelocity.co',
      phone: '+1-555-0209',
      jobTitle: 'Co-Founder',
      department: 'Executive',
      isPrimary: true,
      preferredContact: 'EMAIL',
      status: 'ACTIVE',
      linkedinUrl: 'https://linkedin.com/in/emmataylor',
      twitterUrl: 'https://twitter.com/emmataylor',
      companyId: companies[5].id,
      ownerId: users[2].id
    }
  }))

  // Create realistic deals across different stages
  console.log('💼 Creating demo deals...')
  const deals = await Promise.all([
    // Lead stage deals
    prisma.deal.create({
      data: {
        title: 'CRM Implementation - TechFlow Solutions',
        description: 'Full CRM implementation for engineering team workflow optimization',
        value: 85000.00,
        currency: 'USD',
        expectedCloseDate: new Date('2025-03-15'),
        probability: 0.10,
        status: 'OPEN',
        priority: 'HIGH',
        source: 'Website Inquiry',
        companyId: companies[0].id,
        contactId: contacts[0].id,
        stageId: stages[0].id,
        ownerId: users[0].id
      }
    }),
    // Qualified stage deals
    prisma.deal.create({
      data: {
        title: 'Data Analytics Platform - DataCorp',
        description: 'Advanced analytics platform integration with existing systems',
        value: 150000.00,
        currency: 'USD',
        expectedCloseDate: new Date('2025-02-28'),
        probability: 0.25,
        status: 'OPEN',
        priority: 'HIGH',
        source: 'Referral',
        companyId: companies[1].id,
        contactId: contacts[2].id,
        stageId: stages[1].id,
        ownerId: users[1].id
      }
    }),
    // Proposal stage deals
    prisma.deal.create({
      data: {
        title: 'Manufacturing Process Optimization',
        description: 'Digital transformation of manufacturing processes with IoT integration',
        value: 275000.00,
        currency: 'USD',
        expectedCloseDate: new Date('2025-04-10'),
        probability: 0.50,
        status: 'OPEN',
        priority: 'URGENT',
        source: 'Cold Outreach',
        companyId: companies[2].id,
        contactId: contacts[3].id,
        stageId: stages[2].id,
        ownerId: users[2].id
      }
    }),
    // Negotiation stage deals
    prisma.deal.create({
      data: {
        title: 'Healthcare System Integration',
        description: 'Electronic health record system integration and training',
        value: 120000.00,
        currency: 'USD',
        expectedCloseDate: new Date('2025-02-15'),
        probability: 0.75,
        status: 'OPEN',
        priority: 'HIGH',
        source: 'Trade Show',
        companyId: companies[3].id,
        contactId: contacts[4].id,
        stageId: stages[3].id,
        ownerId: users[0].id
      }
    }),
    // Closed Won deals
    prisma.deal.create({
      data: {
        title: 'Sustainability Consulting Package',
        description: 'Comprehensive sustainability audit and implementation plan',
        value: 35000.00,
        currency: 'USD',
        expectedCloseDate: new Date('2025-01-30'),
        actualCloseDate: new Date('2025-01-28'),
        probability: 1.00,
        status: 'WON',
        priority: 'MEDIUM',
        source: 'LinkedIn',
        companyId: companies[4].id,
        contactId: contacts[5].id,
        stageId: stages[4].id,
        ownerId: users[1].id
      }
    }),
    // Smaller deals for variety
    prisma.deal.create({
      data: {
        title: 'Startup Growth Platform',
        description: 'Growth hacking tools and methodology implementation',
        value: 18000.00,
        currency: 'USD',
        expectedCloseDate: new Date('2025-03-01'),
        probability: 0.10,
        status: 'OPEN',
        priority: 'MEDIUM',
        source: 'Social Media',
        companyId: companies[5].id,
        contactId: contacts[6].id,
        stageId: stages[0].id,
        ownerId: users[2].id
      }
    }),
    // Large enterprise deal
    prisma.deal.create({
      data: {
        title: 'Enterprise Retail Platform',
        description: 'Multi-location retail management system with inventory tracking',
        value: 450000.00,
        currency: 'USD',
        expectedCloseDate: new Date('2025-05-20'),
        probability: 0.50,
        status: 'OPEN',
        priority: 'URGENT',
        source: 'Existing Customer',
        companyId: companies[6].id,
        contactId: contacts[0].id, // Reusing contact for demo
        stageId: stages[2].id,
        ownerId: users[0].id
      }
    })
  ])

  // Create realistic activities
  console.log('📅 Creating demo activities...')
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  await Promise.all([
    // Completed activities
    prisma.activity.create({
      data: {
        type: 'CALL',
        subject: 'Discovery call with TechFlow CTO',
        description: 'Discussed current pain points and CRM requirements. Positive response, scheduling follow-up demo.',
        status: 'COMPLETED',
        priority: 'HIGH',
        duration: 45,
        completedAt: oneWeekAgo,
        companyId: companies[0].id,
        contactId: contacts[0].id,
        dealId: deals[0].id,
        ownerId: users[0].id,
        assignedToId: users[0].id
      }
    }),
    prisma.activity.create({
      data: {
        type: 'EMAIL',
        subject: 'Proposal sent to DataCorp',
        description: 'Sent detailed proposal with pricing options and implementation timeline.',
        status: 'COMPLETED',
        priority: 'HIGH',
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        companyId: companies[1].id,
        contactId: contacts[2].id,
        dealId: deals[1].id,
        ownerId: users[1].id,
        assignedToId: users[1].id
      }
    }),
    // Pending activities
    prisma.activity.create({
      data: {
        type: 'MEETING',
        subject: 'Technical demo for HealthTech team',
        description: 'Product demonstration focusing on healthcare compliance features',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: oneWeekFromNow,
        duration: 60,
        location: 'Boston Office',
        companyId: companies[3].id,
        contactId: contacts[4].id,
        dealId: deals[3].id,
        ownerId: users[0].id,
        assignedToId: users[0].id
      }
    }),
    prisma.activity.create({
      data: {
        type: 'FOLLOW_UP',
        subject: 'Follow up on Precision Manufacturing proposal',
        description: 'Check on proposal review status and answer any questions',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        companyId: companies[2].id,
        contactId: contacts[3].id,
        dealId: deals[2].id,
        ownerId: users[2].id,
        assignedToId: users[2].id
      }
    }),
    // Tasks and notes
    prisma.activity.create({
      data: {
        type: 'TASK',
        subject: 'Prepare custom demo for Urban Retail',
        description: 'Create industry-specific demo showing multi-location features',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: twoWeeksFromNow,
        companyId: companies[6].id,
        dealId: deals[6].id,
        ownerId: users[0].id,
        assignedToId: users[0].id
      }
    }),
    prisma.activity.create({
      data: {
        type: 'NOTE',
        subject: 'Startup Velocity meeting notes',
        description: 'Company is bootstrapped, price-sensitive. Focus on ROI and quick wins. Decision timeline: 2-3 weeks.',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        companyId: companies[5].id,
        contactId: contacts[6].id,
        dealId: deals[5].id,
        ownerId: users[2].id,
        assignedToId: users[2].id
      }
    })
  ])

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Summary of seeded data:')
  console.log(`   👥 Users: ${users.length}`)
  console.log(`   🏢 Companies: ${companies.length}`)
  console.log(`   👤 Contacts: ${contacts.length}`)
  console.log(`   📊 Pipeline Stages: ${stages.length}`)
  console.log(`   💼 Deals: ${deals.length}`)
  console.log(`   📅 Activities: 6`)
  console.log('\n🔗 Demo credentials:')
  console.log('   Admin: admin@crm.local')
  console.log('   Sales Rep: sales@crm.local')
  console.log('   Manager: manager@crm.local')
  console.log('\n🌐 Access points:')
  console.log('   App: http://localhost:3000')
  console.log('   DB Admin: http://localhost:8080 (admin@crm.local / admin_password)')
  console.log('   Mail Testing: http://localhost:8025')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })