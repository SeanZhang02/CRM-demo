const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  try {
    // Create default pipeline stages if they don't exist
    const existingStages = await prisma.pipelineStage.count();

    if (existingStages === 0) {
      console.log('📋 Creating default pipeline stages...');

      const defaultStages = [
        {
          name: 'Lead',
          description: 'New potential customers',
          position: 0,
          probability: 0.1,
          color: '#94A3B8',
          stageType: 'LEAD'
        },
        {
          name: 'Qualified',
          description: 'Qualified opportunities',
          position: 1,
          probability: 0.25,
          color: '#3B82F6',
          stageType: 'OPPORTUNITY'
        },
        {
          name: 'Proposal',
          description: 'Proposal sent to client',
          position: 2,
          probability: 0.5,
          color: '#F59E0B',
          stageType: 'PROPOSAL'
        },
        {
          name: 'Negotiation',
          description: 'In active negotiation',
          position: 3,
          probability: 0.75,
          color: '#EF4444',
          stageType: 'NEGOTIATION'
        },
        {
          name: 'Closed Won',
          description: 'Successfully closed deal',
          position: 4,
          probability: 1.0,
          color: '#10B981',
          stageType: 'CLOSED_WON'
        },
        {
          name: 'Closed Lost',
          description: 'Deal was lost',
          position: 5,
          probability: 0.0,
          color: '#6B7280',
          stageType: 'CLOSED_LOST'
        }
      ];

      for (const stage of defaultStages) {
        await prisma.pipelineStage.create({
          data: stage
        });
      }

      console.log('✅ Default pipeline stages created');
    } else {
      console.log('📋 Pipeline stages already exist, skipping...');
    }

    // Add any other production seed data here
    console.log('✅ Production database seeding completed');

  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();