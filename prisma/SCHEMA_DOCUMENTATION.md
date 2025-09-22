# CRM Database Schema Documentation

## Overview

This document provides comprehensive documentation for the CRM database schema designed for desktop-first visual filtering and sub-100ms query performance. The architecture follows the Companies → Contacts → Deals → Activities hierarchy optimized for small business workflows.

## Core Architecture Decisions

### 1. **UUID Primary Keys**
- **Decision**: Use UUID instead of auto-incrementing integers
- **Rationale**:
  - Enables distributed system scaling
  - Prevents ID enumeration attacks
  - Facilitates future microservices architecture
  - Supports data migration between environments
- **Performance Impact**: Minimal with proper indexing

### 2. **PostgreSQL Database Choice**
- **Decision**: PostgreSQL as primary database
- **Rationale**:
  - Superior indexing capabilities (B-tree, GIN, partial indexes)
  - Full-text search support
  - JSON field support for custom fields
  - ACID compliance for data integrity
  - Excellent Prisma ORM integration

### 3. **Soft Delete Pattern**
- **Decision**: Implement soft deletes with `isDeleted` and `deletedAt` fields
- **Rationale**:
  - Maintains data integrity and audit trails
  - Enables data recovery
  - Preserves relationships for historical reporting
- **Implementation**: All queries filter `WHERE isDeleted = false`

## Entity Relationship Design

### Core Hierarchy

```
Users (Multi-tenant ownership)
├── Companies (Root entity)
│   ├── Contacts (1:N)
│   ├── Deals (1:N)
│   └── Activities (1:N)
├── Contacts
│   ├── Deals (1:N)
│   └── Activities (1:N)
├── Deals
│   ├── PipelineStages (N:1)
│   └── Activities (1:N)
└── Activities (Cross-entity associations)
```

### 1. **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role UserRole DEFAULT 'USER',
  -- NextAuth.js compatibility fields
  -- Audit and preference fields
);
```

**Design Decisions**:
- NextAuth.js compatible for rapid authentication setup
- Role-based access control for future team features
- Timezone and locale support for international users

### 2. **Companies Table (Root Entity)**
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  company_size CompanySize,
  status CompanyStatus DEFAULT 'ACTIVE',
  -- Business metadata
  -- Geographic information
  -- Soft delete and audit fields
  owner_id UUID REFERENCES users(id)
);
```

**Design Decisions**:
- Industry categorization for filtering and reporting
- Company size enum for segmentation
- Revenue and employee count for qualification
- Geographic fields for territory management
- Owner-based multi-tenancy

**Key Indexes**:
```sql
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_deleted ON companies(is_deleted);
```

### 3. **Contacts Table**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  preferred_contact ContactMethod DEFAULT 'EMAIL',
  -- Job and social information
  -- Soft delete and audit fields
);
```

**Design Decisions**:
- `company_id` allows NULL for individual contacts
- `is_primary` flag for company hierarchy
- Contact method preferences for automation
- Social media fields for relationship building

**Key Indexes**:
```sql
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_name ON contacts(first_name, last_name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_primary ON contacts(is_primary);
```

### 4. **Pipeline Stages Table**
```sql
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL,
  probability DECIMAL(3,2) DEFAULT 0.0,
  color VARCHAR(7), -- Hex color for UI
  stage_type StageType DEFAULT 'OPPORTUNITY',
  is_active BOOLEAN DEFAULT true
);
```

**Design Decisions**:
- Configurable pipeline stages for flexibility
- Position field for drag-and-drop ordering
- Probability for forecasting calculations
- Color coding for visual pipeline management
- Stage types for different deal classifications

### 5. **Deals Table (Core Business Entity)**
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(12,2),
  expected_close_date DATE,
  probability DECIMAL(3,2),
  status DealStatus DEFAULT 'OPEN',
  priority Priority DEFAULT 'MEDIUM',
  -- Audit and ownership fields
);
```

**Design Decisions**:
- Flexible entity relationships (deals can exist without company/contact)
- `ON DELETE RESTRICT` for stages to prevent data loss
- Manual probability override for stage probability
- Currency field for international business
- Priority levels for task management

**Performance-Critical Indexes**:
```sql
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);
CREATE INDEX idx_deals_value ON deals(value);
CREATE INDEX idx_deals_status ON deals(status);
```

### 6. **Activities Table (Cross-Entity Tracking)**
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  type ActivityType NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  status ActivityStatus DEFAULT 'PENDING',
  -- Additional activity fields
);
```

**Design Decisions**:
- Flexible entity associations (activities can relate to multiple entities)
- Separate owner and assignee for team collaboration
- Rich activity types for comprehensive tracking
- Due date and completion tracking for task management

## Performance Optimization Strategy

### 1. **Index Strategy**

#### Primary Performance Indexes
- **Entity Lookups**: All foreign key relationships indexed
- **Filtering**: Status, type, and category fields indexed
- **Sorting**: Date fields and name fields indexed
- **Search**: Composite indexes for common query patterns

#### Query Pattern Optimization
```sql
-- Optimized for: Company list with related counts
CREATE INDEX idx_companies_active ON companies(is_deleted, status)
WHERE is_deleted = false;

-- Optimized for: Pipeline stage filtering
CREATE INDEX idx_deals_open_stage ON deals(stage_id, is_deleted, status)
WHERE is_deleted = false AND status = 'OPEN';

-- Optimized for: Activity timeline
CREATE INDEX idx_activities_timeline ON activities(created_at, is_deleted)
WHERE is_deleted = false;
```

### 2. **Query Performance Targets**

| Query Type | Target Time | Examples |
|------------|-------------|-----------|
| Simple Lookups | <25ms | Find company by ID, primary contacts |
| List Views | <50ms | Company list, contact list, deal list |
| Dashboard | <75ms | Pipeline overview, activity feed |
| Reports | <150ms | Sales funnel, user performance |
| Search | <200ms | Global search across entities |

### 3. **Airtable-Style Filtering Optimization**

The schema is optimized for visual filtering operations:

```sql
-- Multi-condition filtering with real-time counts
SELECT COUNT(*) FROM companies
WHERE industry = 'Technology'
AND company_size = 'MEDIUM'
AND status = 'PROSPECT'
AND is_deleted = false;
-- Target: <25ms with proper indexes
```

## Data Integrity and Constraints

### 1. **Foreign Key Relationships**

```sql
-- Preserve data integrity while allowing flexibility
ALTER TABLE contacts
ADD CONSTRAINT fk_contacts_company
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE deals
ADD CONSTRAINT fk_deals_stage
FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id) ON DELETE RESTRICT;
```

### 2. **Business Rule Constraints**

```sql
-- Ensure probability values are valid
ALTER TABLE deals
ADD CONSTRAINT chk_probability
CHECK (probability >= 0.0 AND probability <= 1.0);

-- Ensure valid email formats
ALTER TABLE contacts
ADD CONSTRAINT chk_email_format
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

## Custom Fields Architecture

### Future-Proof Extensibility

```sql
-- Flexible custom field system
CREATE TABLE company_custom_fields (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  field_name VARCHAR(100),
  field_value TEXT,
  field_type CustomFieldType DEFAULT 'TEXT'
);
```

**Design Benefits**:
- Type-safe custom field values
- Efficient storage for sparse data
- Easy to query and index
- Supports future field type expansion

## Migration Strategy

### 1. **Rollback Safety**
- All migrations are reversible
- Schema changes use transactions
- Data migrations preserve original values
- Foreign key constraints protect data integrity

### 2. **Performance During Migration**
```sql
-- Create indexes concurrently to avoid locks
CREATE INDEX CONCURRENTLY idx_new_feature ON table_name(column_name);

-- Use partial indexes for large tables
CREATE INDEX idx_active_companies ON companies(status)
WHERE is_deleted = false;
```

## Monitoring and Maintenance

### 1. **Performance Monitoring Queries**

```sql
-- Index usage statistics
SELECT indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Slow query identification
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;
```

### 2. **Maintenance Tasks**

```sql
-- Regular maintenance for optimal performance
VACUUM ANALYZE companies;
VACUUM ANALYZE contacts;
VACUUM ANALYZE deals;
VACUUM ANALYZE activities;

-- Reindex for fragmented indexes
REINDEX INDEX CONCURRENTLY idx_companies_name;
```

## Security Considerations

### 1. **Data Isolation**
- User-based ownership on all entities
- Row-level security policies (future enhancement)
- Soft deletes prevent accidental data loss

### 2. **Access Control**
```sql
-- Example row-level security policy
CREATE POLICY user_data_isolation ON companies
FOR ALL TO authenticated_users
USING (owner_id = current_user_id());
```

## Backup and Recovery

### 1. **Backup Strategy**
- Daily full backups
- Point-in-time recovery capability
- Transaction log backups every 15 minutes
- Offsite backup storage

### 2. **Recovery Procedures**
```sql
-- Point-in-time recovery example
pg_basebackup -D /backup/crm_backup -Ft -z -P
pg_wal_replay_resume('/backup/crm_backup');
```

## Future Enhancements

### 1. **Planned Schema Improvements**
- Full-text search indexes with PostgreSQL's built-in search
- JSON custom fields for complex data types
- Time-series tables for analytics
- Partitioning for large datasets

### 2. **Scalability Considerations**
- Read replicas for reporting queries
- Connection pooling optimization
- Query caching strategies
- Horizontal partitioning by tenant

## Development Guidelines

### 1. **Query Best Practices**
- Always filter by `is_deleted = false`
- Use appropriate indexes for WHERE clauses
- Limit result sets with LIMIT clauses
- Use EXPLAIN ANALYZE for performance validation

### 2. **Schema Evolution**
- Never drop columns in production migrations
- Add new columns as nullable initially
- Use feature flags for schema-dependent features
- Test migrations on production-sized datasets

This schema design provides a solid foundation for the CRM system with excellent performance characteristics and future scalability options.