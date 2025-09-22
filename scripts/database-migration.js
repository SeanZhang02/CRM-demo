const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Production Database Migration Script
 * Handles PostgreSQL-specific optimizations and production data migration
 */

async function optimizeDatabase() {
  console.log('🔧 Applying PostgreSQL production optimizations...');

  try {
    // Create additional indexes for production performance
    const optimizationQueries = [
      // Composite indexes for complex queries
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_company_stage
       ON deals(company_id, stage_id) WHERE is_deleted = false;`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_date_type
       ON activities(due_date, type) WHERE is_deleted = false;`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_company_status
       ON contacts(company_id, status) WHERE is_deleted = false;`,

      // Full text search indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search
       ON companies USING gin(to_tsvector('english', name || ' ' || COALESCE(industry, '')));`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_search
       ON contacts USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '')));`,

      // Partial indexes for active records
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_active_value
       ON deals(value DESC) WHERE status = 'OPEN' AND is_deleted = false;`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_pending
       ON activities(due_date ASC) WHERE status = 'PENDING' AND is_deleted = false;`,
    ];

    for (const query of optimizationQueries) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log('✅ Applied optimization:', query.split('\n')[0].trim());
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⏭️ Index already exists, skipping...');
        } else {
          console.error('❌ Error applying optimization:', error.message);
        }
      }
    }

    // Update database statistics for query planner
    console.log('📊 Updating database statistics...');
    await prisma.$executeRaw`ANALYZE;`;

    console.log('✅ Database optimization completed');

  } catch (error) {
    console.error('❌ Error optimizing database:', error);
    throw error;
  }
}

async function validateMigration() {
  console.log('🔍 Validating database migration...');

  try {
    // Check all tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `;

    const expectedTables = [
      'companies', 'contacts', 'deals', 'activities', 'users',
      'accounts', 'sessions', 'verification_tokens',
      'pipeline_stages', 'saved_filters', 'saved_filter_usage',
      'company_custom_fields', 'contact_custom_fields', 'deal_custom_fields'
    ];

    const existingTables = tables.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    // Verify indexes exist
    const indexes = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public';
    `;

    console.log(`✅ Database validation passed: ${existingTables.length} tables, ${indexes.length} indexes`);

  } catch (error) {
    console.error('❌ Database validation failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🗃️ Production Database Migration Starting...');

  try {
    await optimizeDatabase();
    await validateMigration();

    console.log('✅ Production database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { optimizeDatabase, validateMigration };