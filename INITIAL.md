## FEATURE:

**Desktop-First Visual CRM System - SQL Replacement for Small Businesses**

A 6-week MVP that eliminates SQL complexity through visual interfaces, specifically designed for small business desktop users who need powerful data management without technical complexity.

**Core Mission**: Replace every SQL operation (filtering, searching, reporting) with intuitive visual interactions, enabling small businesses to manage customer data as easily as using a spreadsheet but with the power of a database.

**Target Users**: Small business owners and staff (5-50 employees) who currently use spreadsheets or find existing CRMs too complex.

## EXAMPLES:

### Visual Filtering (Replaces SQL WHERE clauses)
Instead of: `SELECT * FROM companies WHERE industry = 'Tech' AND contacts_count > 3`
Users get: Visual filter overlay with dropdowns and real-time result previews

### Data Relationships (Replaces SQL JOINs)
Instead of: `SELECT c.name, co.email FROM companies c JOIN contacts co ON c.id = co.company_id`
Users get: Company detail page showing all related contacts with click navigation

### Reporting (Replaces SQL GROUP BY/aggregation)
Instead of: `SELECT stage, COUNT(*), SUM(value) FROM deals GROUP BY stage`
Users get: One-click export to Excel with pre-built summaries

### Core User Workflows:
1. **Import/Create Data**: Upload CSV or manually add companies, contacts, deals
2. **Visual Search**: Use Airtable-style filters to find specific records without SQL
3. **Relationship Navigation**: Click between related companies → contacts → deals
4. **Data Export**: Download filtered results as CSV/Excel for external analysis
5. **Team Access**: Share data with team members with simple permissions

## DOCUMENTATION:

### Research Foundation Documents:
- `CRM_Research_Findings.md` - Market analysis, competitor research, small business pain points
- `REALISTIC_SOLUTION.md` - 6-week MVP architecture and implementation plan
- `DESKTOP_CRM_REQUIREMENTS.md` - Original comprehensive requirements (reference only)

### Technical Reference:
- **Next.js 14+ Documentation**: https://nextjs.org/docs/app (App Router patterns, Server Components)
- **Prisma Documentation**: https://prisma.io/docs (Database ORM, migrations, type safety)
- **Tailwind CSS + shadcn/ui**: https://ui.shadcn.com/ (Component library, styling patterns)
- **TanStack Table**: https://tanstack.com/table/latest (Data table implementation)
- **Airtable UI Patterns**: Visual filtering and data organization patterns to emulate

### Key Implementation Guides:
- Visual filtering patterns from research (Airtable overlay approach)
- Simple CRUD operations with Next.js API routes
- PostgreSQL schema design for companies → contacts → deals relationship
- CSV import/export functionality for spreadsheet replacement

## OTHER CONSIDERATIONS:

### Critical Success Factors:
1. **Simplicity Over Features**: Users abandon CRMs that "require a degree to work it" - every feature must be immediately intuitive
2. **Desktop-First Design**: Optimize for 1024px+ screens, mouse precision, keyboard shortcuts
3. **No Training Required**: System must be self-explanatory within 15 minutes of first use
4. **Spreadsheet Replacement**: Must feel as easy as Excel but with database benefits

### Common AI Assistant Pitfalls to Avoid:
1. **Over-engineering**: Don't build complex real-time features, advanced workflows, or microservices
2. **Feature Creep**: Stick to the 4 core features (tables, CRUD, filtering, export) for MVP
3. **Complex State Management**: Use simple React state + TanStack Query, avoid Redux/Zustand complexity
4. **Perfect Architecture**: Prioritize working functionality over clean architecture patterns
5. **Advanced Integrations**: No email/calendar sync in MVP - focus on core data management only

### Technical Gotchas:
1. **Next.js App Router**: Use Server Components for data fetching, Client Components for interactions
2. **Prisma Relations**: Keep database relationships simple - avoid complex many-to-many for MVP
3. **CSV Import**: Handle encoding issues, validate data formats, provide clear error messages
4. **Performance**: Implement pagination early - don't try to load 1000+ records at once
5. **TypeScript**: Maintain type safety across API boundaries but don't over-complicate with advanced types

### User Experience Priorities:
1. **Visual Feedback**: Users must see immediate results when filtering or searching
2. **Error Prevention**: Validate data entry and provide helpful error messages
3. **Data Confidence**: Always show record counts, export confirmations, save confirmations
4. **Progressive Disclosure**: Start with simple views, allow drill-down to details
5. **Escape Hatches**: Provide CSV export when visual tools aren't sufficient

### Business Requirements:
- Must deliver immediate value over spreadsheets (better search, relationships, data integrity)
- Must be maintainable by small team (simple architecture, good documentation)
- Must be extensible for future features (clean API design, modular components)
- Must have low hosting costs (efficient database queries, simple infrastructure)

### Development Timeline Constraints:
- Week 1: Basic data tables with companies
- Week 2: CRUD operations for all entities
- Week 3: Visual filtering system
- Week 4: CSV import/export + polish
- Week 5: Authentication and deployment
- Week 6: User testing and refinement

**Success Metric**: Small business user can replace their customer spreadsheet with our CRM within one hour of first use, without any training or documentation.