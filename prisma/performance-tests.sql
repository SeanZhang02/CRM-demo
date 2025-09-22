-- ============================================================================
-- CRM DATABASE PERFORMANCE VALIDATION QUERIES
-- Target: <100ms response time for standard operations
-- ============================================================================

-- ============================================================================
-- 1. COMPANY QUERIES (Most frequent operations)
-- ============================================================================

-- Q1: Company list with filtering (Airtable-style)
-- Expected: <50ms for 10k companies
-- Index: companies(industry), companies(status), companies(name)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    c.id, c.name, c.industry, c.status, c.city, c.state,
    COUNT(DISTINCT contacts.id) as contact_count,
    COUNT(DISTINCT deals.id) as deal_count,
    COALESCE(SUM(deals.value), 0) as total_deal_value
FROM companies c
LEFT JOIN contacts ON c.id = contacts.company_id AND contacts.is_deleted = false
LEFT JOIN deals ON c.id = deals.company_id AND deals.is_deleted = false
WHERE
    c.is_deleted = false
    AND c.industry = 'Technology'
    AND c.status = 'PROSPECT'
GROUP BY c.id, c.name, c.industry, c.status, c.city, c.state
ORDER BY c.name
LIMIT 50;

-- Q2: Company search across all text fields
-- Expected: <75ms with full-text search
-- Index: Full-text search index on name, industry, city
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.id, c.name, c.industry, c.city, c.status
FROM companies c
WHERE
    c.is_deleted = false
    AND (
        c.name ILIKE '%tech%'
        OR c.industry ILIKE '%tech%'
        OR c.city ILIKE '%tech%'
    )
ORDER BY c.name
LIMIT 25;

-- ============================================================================
-- 2. CONTACT QUERIES
-- ============================================================================

-- Q3: Contact list with company information
-- Expected: <50ms for contact browsing
-- Index: contacts(company_id), contacts(first_name, last_name)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    ct.id, ct.first_name, ct.last_name, ct.email, ct.job_title,
    c.name as company_name, c.industry,
    COUNT(DISTINCT deals.id) as deal_count
FROM contacts ct
LEFT JOIN companies c ON ct.company_id = c.id
LEFT JOIN deals ON ct.id = deals.contact_id AND deals.is_deleted = false
WHERE
    ct.is_deleted = false
    AND c.is_deleted = false
GROUP BY ct.id, ct.first_name, ct.last_name, ct.email, ct.job_title, c.name, c.industry
ORDER BY ct.first_name, ct.last_name
LIMIT 50;

-- Q4: Primary contacts by company
-- Expected: <25ms for hierarchy navigation
-- Index: contacts(is_primary), contacts(company_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    ct.id, ct.first_name, ct.last_name, ct.email,
    c.name as company_name
FROM contacts ct
JOIN companies c ON ct.company_id = c.id
WHERE
    ct.is_deleted = false
    AND c.is_deleted = false
    AND ct.is_primary = true
ORDER BY c.name;

-- ============================================================================
-- 3. DEAL PIPELINE QUERIES (Critical for performance)
-- ============================================================================

-- Q5: Pipeline overview with deal counts and values
-- Expected: <75ms for dashboard loading
-- Index: deals(stage_id), deals(status), pipeline_stages(position)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    ps.id, ps.name, ps.position, ps.probability,
    COUNT(d.id) as deal_count,
    COALESCE(SUM(d.value), 0) as total_value,
    AVG(d.value) as avg_deal_value
FROM pipeline_stages ps
LEFT JOIN deals d ON ps.id = d.stage_id
    AND d.is_deleted = false
    AND d.status = 'OPEN'
WHERE ps.is_active = true
GROUP BY ps.id, ps.name, ps.position, ps.probability
ORDER BY ps.position;

-- Q6: Deal details with company and contact (Most common view)
-- Expected: <50ms for deal list loading
-- Index: deals(stage_id), deals(company_id), deals(contact_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    d.id, d.title, d.value, d.expected_close_date, d.probability,
    c.name as company_name, c.industry,
    ct.first_name, ct.last_name, ct.email,
    ps.name as stage_name, ps.color as stage_color
FROM deals d
LEFT JOIN companies c ON d.company_id = c.id
LEFT JOIN contacts ct ON d.contact_id = ct.id
JOIN pipeline_stages ps ON d.stage_id = ps.id
WHERE
    d.is_deleted = false
    AND d.status = 'OPEN'
ORDER BY d.expected_close_date ASC
LIMIT 50;

-- Q7: Deals by date range (Reporting query)
-- Expected: <100ms for monthly/quarterly reports
-- Index: deals(expected_close_date), deals(created_at)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    DATE_TRUNC('month', d.expected_close_date) as month,
    COUNT(*) as deal_count,
    SUM(d.value) as total_value,
    AVG(d.probability) as avg_probability
FROM deals d
WHERE
    d.is_deleted = false
    AND d.expected_close_date >= '2025-01-01'
    AND d.expected_close_date <= '2025-12-31'
GROUP BY DATE_TRUNC('month', d.expected_close_date)
ORDER BY month;

-- ============================================================================
-- 4. ACTIVITY TIMELINE QUERIES
-- ============================================================================

-- Q8: Recent activity feed (Dashboard component)
-- Expected: <50ms for activity timeline
-- Index: activities(created_at), activities(owner_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    a.id, a.type, a.subject, a.status, a.created_at,
    c.name as company_name,
    ct.first_name, ct.last_name,
    d.title as deal_title,
    u.name as owner_name
FROM activities a
LEFT JOIN companies c ON a.company_id = c.id
LEFT JOIN contacts ct ON a.contact_id = ct.id
LEFT JOIN deals d ON a.deal_id = d.id
LEFT JOIN users u ON a.owner_id = u.id
WHERE
    a.is_deleted = false
    AND a.created_at >= NOW() - INTERVAL '30 days'
ORDER BY a.created_at DESC
LIMIT 50;

-- Q9: Upcoming activities (Task management)
-- Expected: <25ms for calendar views
-- Index: activities(due_date), activities(status), activities(assigned_to_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    a.id, a.type, a.subject, a.due_date, a.priority,
    c.name as company_name,
    u.name as assigned_to
FROM activities a
LEFT JOIN companies c ON a.company_id = c.id
LEFT JOIN users u ON a.assigned_to_id = u.id
WHERE
    a.is_deleted = false
    AND a.status IN ('PENDING', 'IN_PROGRESS')
    AND a.due_date >= CURRENT_DATE
    AND a.due_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY a.due_date ASC, a.priority DESC;

-- ============================================================================
-- 5. COMPLEX ANALYTICAL QUERIES
-- ============================================================================

-- Q10: Sales funnel analysis
-- Expected: <150ms for management dashboards
-- Index: Multiple indexes on deals table
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    ps.name as stage_name,
    ps.position,
    COUNT(d.id) as deal_count,
    SUM(d.value) as stage_value,
    AVG(d.value) as avg_deal_value,
    AVG(ps.probability) as avg_probability,
    -- Conversion rate calculation
    ROUND(
        COUNT(d.id)::decimal /
        NULLIF(LAG(COUNT(d.id)) OVER (ORDER BY ps.position), 0) * 100, 2
    ) as conversion_rate
FROM pipeline_stages ps
LEFT JOIN deals d ON ps.id = d.stage_id
    AND d.is_deleted = false
    AND d.status = 'OPEN'
    AND d.created_at >= '2025-01-01'
WHERE ps.is_active = true
GROUP BY ps.id, ps.name, ps.position, ps.probability
ORDER BY ps.position;

-- Q11: User performance metrics
-- Expected: <100ms for team dashboards
-- Index: deals(owner_id), activities(owner_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    u.name as sales_rep,
    COUNT(DISTINCT d.id) as total_deals,
    COUNT(DISTINCT CASE WHEN d.status = 'WON' THEN d.id END) as won_deals,
    SUM(CASE WHEN d.status = 'WON' THEN d.value ELSE 0 END) as won_value,
    COUNT(DISTINCT a.id) as total_activities,
    COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completed_activities
FROM users u
LEFT JOIN deals d ON u.id = d.owner_id
    AND d.is_deleted = false
    AND d.created_at >= '2025-01-01'
LEFT JOIN activities a ON u.id = a.owner_id
    AND a.is_deleted = false
    AND a.created_at >= '2025-01-01'
WHERE u.is_active = true
GROUP BY u.id, u.name
ORDER BY won_value DESC;

-- ============================================================================
-- 6. SEARCH AND FILTERING TESTS
-- ============================================================================

-- Q12: Global search across all entities
-- Expected: <200ms for comprehensive search
-- Index: Multiple text search indexes
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    'company' as entity_type, c.id, c.name as title,
    c.industry as subtitle, c.created_at
FROM companies c
WHERE c.is_deleted = false
    AND (c.name ILIKE '%tech%' OR c.industry ILIKE '%tech%')

UNION ALL

SELECT
    'contact' as entity_type, ct.id,
    ct.first_name || ' ' || ct.last_name as title,
    ct.job_title as subtitle, ct.created_at
FROM contacts ct
WHERE ct.is_deleted = false
    AND (ct.first_name ILIKE '%tech%'
         OR ct.last_name ILIKE '%tech%'
         OR ct.job_title ILIKE '%tech%')

UNION ALL

SELECT
    'deal' as entity_type, d.id, d.title,
    'Value: $' || d.value as subtitle, d.created_at
FROM deals d
WHERE d.is_deleted = false
    AND d.title ILIKE '%tech%'

ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- 7. PERFORMANCE BENCHMARKS AND TARGETS
-- ============================================================================

/*
PERFORMANCE TARGETS:
- Simple queries (Q2, Q4, Q9): <25ms
- Standard queries (Q1, Q3, Q6, Q8): <50ms
- Complex queries (Q5, Q7): <75ms
- Analytical queries (Q10, Q11): <150ms
- Search queries (Q12): <200ms

INDEX EFFECTIVENESS:
- All queries should use index scans, not sequential scans
- Join operations should use nested loop or hash joins
- Large result sets should use efficient sorting methods

MONITORING QUERIES:
*/

-- Check index usage across all tables
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Monitor slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms
ORDER BY mean_time DESC;

-- Check table sizes and row counts
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;