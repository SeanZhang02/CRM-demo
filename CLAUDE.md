### 🔄 Project Awareness & Context
- **Always read `CRM_Research_Findings.md`** at the start of a new conversation to understand the project's market research, competitive analysis, and business requirements.
- **Always read `REALISTIC_SOLUTION.md`** to understand the 6-week MVP approach and core architecture decisions.
- **Check `TASK.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date.
- **Follow the simple, achievable approach** - prioritize immediate value over complex features.
- **Focus on desktop-first design** - optimized for business users on 1024px+ screens with mouse/keyboard interaction.
- **Agent Orchestration**: Follow `AGENT_ORCHESTRATION_LAWS.md` for automatic agent coordination during development.

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
  For this CRM project structure:
    - Frontend: `pages/`, `components/`, `hooks/`, `lib/`, `types/`
    - API Routes: `pages/api/` (Next.js API routes)
    - Database: `prisma/schema.prisma`, `prisma/migrations/`
    - Shared: `types/`, `utils/`
- **Use TypeScript throughout** for type safety and better developer experience.
- **Keep it simple**: Single repository (frontend + backend in Next.js), no microservices.

### 🧪 Testing & Reliability
- **Create tests for core business logic** using Jest for components and API routes.
- **After updating any logic**, check whether existing tests need to be updated. If so, do it.
- **Frontend tests**: Use React Testing Library for component tests.
- **API tests**: Test API routes with supertest or similar.
- **Test structure**:
  - `__tests__/` folders alongside source files
  - Include at least: 1 happy path, 1 edge case, 1 error case
  - Focus on core workflows: CRUD operations, filtering, data relationships

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks discovered during development to `TASK.md` under a "Discovered During Work" section.
- **Follow the 6-week milestone approach** outlined in REALISTIC_SOLUTION.md.

### 📎 Style & Conventions
- **Frontend**: TypeScript + Next.js 14+ with App Router, Tailwind CSS + shadcn/ui components
- **Backend**: Next.js API routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM for type-safe database access
- **Authentication**: NextAuth.js for simple authentication setup
- **Deployment**: Vercel for hosting, Supabase for managed PostgreSQL
- Write **clear component documentation**:
  ```typescript
  /**
   * Visual data table with Airtable-style filtering
   * Replaces complex SQL queries with simple UI interactions
   *
   * @param data - Array of records to display
   * @param columns - Table column definitions
   * @param onFilter - Callback when filters are applied
   */
  interface DataTableProps {
    data: Record<string, any>[]
    columns: ColumnDefinition[]
    onFilter: (filters: Filter[]) => void
  }
  ```

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added or setup steps change.
- **Comment the "why" not the "what"** - focus on business logic and user experience decisions.
- **Document visual filtering patterns** - how we replace SQL with UI interactions.
- When writing complex filtering logic, **add inline comments** explaining the business requirement.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or frameworks** – only use verified npm packages (React, Next.js, Prisma, etc.).
- **Always confirm file paths exist** before referencing them in code.
- **Never delete or overwrite existing code** unless explicitly instructed or part of a task.
- **Focus on simplicity over sophistication** - remember users abandon complex CRMs.
- **Prioritize working functionality over perfect architecture** - follow the MVP approach.

### 🖥️ Desktop-First Development Standards
- **PRIMARY: Design for desktop browsers** with 1024px+ viewports and mouse/keyboard interaction
- **Mouse Interaction Optimization**: Hover states, right-click context menus, precise drag-and-drop
- **Performance Budget**: Page loads <2s on standard broadband, API responses <200ms
- **Visual Filtering Excellence**: Replace SQL complexity with Airtable-style filter overlays
- **Accessibility**: WCAG 2.1 AA compliance with full keyboard navigation support
- **Power User Features**: Keyboard shortcuts (Ctrl+K, Ctrl+F), bulk operations, quick actions

### 🎯 CRM-Specific Guidelines
- **Visual-First Design**: Every data operation should be drag-and-drop, click, or visual filter - no SQL required
- **Desktop Business Focus**: Optimize for office workers managing customer data efficiently
- **Simple Relationships**: Companies → Contacts → Deals hierarchy with clear navigation
- **Airtable-Style Filtering**: Use overlay filters with real-time previews, not complex query builders
- **Immediate Value**: Users should see benefit within 15 minutes of first use
- **Progressive Disclosure**: Start simple, reveal advanced features as needed
- **Data Export**: Always provide CSV/Excel export as SQL replacement for reporting

### 🏥 Healthcare Provider Workflow Guidelines
- **Clinical Mental Model**: Design for healthcare professionals who think in service categories, not business metrics
- **Button-Based Navigation**: Replace complex filters with progressive disclosure through service-category buttons
- **99% Use Case Optimization**: Prioritize "find patient" workflow above all other features
- **Provider Command Center**: Main dashboard integrates schedule, alerts, recent patients, and quick actions
- **Service-First Organization**: Structure data by healthcare services (Mental Health, Case Management, etc.)
- **Zero Training Interface**: Medical staff should understand navigation without business/data knowledge
- **Integrated Workflow**: Seamlessly combine patient search → view → schedule → notes → next patient

### 🔐 Healthcare Compliance & Security
- **HIPAA Compliance**: Implement proper PHI (Protected Health Information) safeguards and access controls
- **Audit Trail Requirements**: Log all patient data access, modifications, and user activities
- **Role-Based Access Control**: Restrict data access based on healthcare roles and need-to-know basis
- **Data Encryption**: Encrypt patient data both at rest and in transit
- **Session Management**: Implement secure session timeouts and automatic logout for abandoned sessions
- **Multi-Site Data Isolation**: Ensure proper data separation across different healthcare locations
- **Consent Management**: Track and manage patient consent for treatment and data sharing

### 🏢 Multi-Site Healthcare Operations
- **Location-Aware Features**: All patient interactions must be aware of which APCTC center they belong to
- **Cross-Site Referrals**: Enable patient transfers between locations with proper documentation
- **Site-Specific Scheduling**: Appointment availability varies by location and provider
- **Centralized Patient Records**: Single patient view across all locations with location history
- **Provider Mobility**: Support staff who work across multiple APCTC centers
- **Location-Based Reporting**: Generate reports filtered by specific centers or system-wide

### 📋 Service Category Architecture
Based on APCTC's actual service offerings:
- **Assessment & Intake**: Initial patient evaluation and onboarding processes
- **Mental Health Counseling**: Individual, group, and family therapy services
- **Medication Management**: Psychiatric medication monitoring and adjustments
- **Case Management**: Housing, benefits, vocational rehabilitation, healthcare coordination
- **Community Education**: Workshops, outreach programs, and prevention services
- **Crisis Intervention**: Emergency mental health support and safety planning
- **Specialized Programs**: Age-specific (children, youth, adults, seniors) and population-specific services

### 🎮 Provider Interface Principles
- **Two-Click Maximum**: Any patient should be findable within two button clicks
- **Context Preservation**: Remember provider's current location, recent patients, and preferences
- **Quick Actions Always Visible**: Schedule appointment, add notes, set reminders available from patient view
- **Real-Time Updates**: Schedule changes, new alerts, and patient updates appear immediately
- **Workflow Continuity**: Minimize interruptions to provider's daily patient management flow
- **Visual Hierarchy**: Most important information (today's schedule, urgent alerts) prominently displayed

### 🏗️ Technical Architecture Guidelines
- **Next.js 14+ App Router**: Use Server Components for data fetching, Client Components for interactivity
- **Database Design**: Healthcare-adapted schema (Patients → Family Members → Treatment Plans → Service Episodes)
- **API Design**: RESTful endpoints with consistent response format and error handling
- **State Management**: React state + TanStack Query for server state, avoid complex state management
- **UI Components**: shadcn/ui components with Tailwind CSS for consistent design system
- **Real-time Updates**: Simple polling or manual refresh - avoid WebSocket complexity in MVP

### 🏥 Healthcare Database Schema Guidelines
- **Patient-Centric Design**: Replace Companies with Patients as primary entities
- **Service Episodes**: Track individual treatment sessions and interactions
- **Treatment Plans**: Long-term care coordination (replaces Deals concept)
- **Family/Emergency Contacts**: Related individuals for each patient
- **Provider Assignments**: Track which staff members work with which patients
- **Location Tracking**: All records must be associated with specific APCTC centers
- **Audit Logging**: Comprehensive logging for HIPAA compliance and quality assurance
- **Consent Management**: Track patient permissions for treatment and data sharing

### 📊 Success Criteria
- **Development Speed**: Working features every week, 6-week total timeline
- **User Experience**: No training required, immediate productivity gain over spreadsheets
- **Performance**: Fast page loads, responsive interactions, handles 1000+ records smoothly
- **Maintainability**: Simple codebase that can be easily extended and modified
- **Business Value**: Clear ROI for small businesses switching from spreadsheets/complex CRMs

### 🎯 Healthcare Success Criteria
- **Provider Adoption**: Medical staff can find patients within 2 clicks, 100% adoption within 2 weeks
- **Workflow Efficiency**: 50% reduction in time spent on patient data management tasks
- **Compliance Validation**: 100% HIPAA compliance, successful audit trail generation
- **Multi-Site Coordination**: Seamless patient data access across all 8 APCTC locations
- **Clinical Workflow Integration**: Scheduling, notes, and patient management unified in single interface
- **Zero Training Requirement**: Medical professionals productive within 15 minutes of first use

## 🤖 KINETIC AGENT ORCHESTRATION PROTOCOL

### Agent Activation Rules (MANDATORY)

#### 🟢 Automatic Agent Triggers (Use Task Tool Immediately When These Conditions Occur)

**Database-Architect Agent**:
- **TRIGGER**: Any schema changes needed, new entities, or database performance issues
- **COMMAND**: Use Task tool with `subagent_type: "database-architect"`
- **BEFORE**: All other agents must wait for database schema completion
- **VALIDATION**: Schema + migrations + seed data complete
```typescript
// Example activation:
if (needsSchemaChanges || newEntityRequired || queryTimeOver100ms) {
  activateAgent("database-architect", "Schema design and optimization for [specific requirement]")
}
```

**Backend-API-Developer Agent**:
- **TRIGGER**: API endpoints needed, authentication flows, business logic implementation
- **COMMAND**: Use Task tool with `subagent_type: "backend-api-developer"`
- **AFTER**: Database schema must be finalized
- **VALIDATION**: API contracts + documentation + tests complete
```typescript
// Example activation:
if (apiEndpointsNeeded || authenticationRequired || businessLogicComplex) {
  activateAgent("backend-api-developer", "API development for [specific endpoints]")
}
```

**Frontend-Specialist Agent**:
- **TRIGGER**: UI components needed, responsive design, user interactions
- **COMMAND**: Use Task tool with `subagent_type: "frontend-specialist"`
- **AFTER**: API contracts must be defined
- **VALIDATION**: Components + responsive design + accessibility complete
```typescript
// Example activation:
if (uiComponentsNeeded || responsiveDesignRequired || userInteractionComplex) {
  activateAgent("frontend-specialist", "UI development for [specific components]")
}
```

**Integration-Specialist Agent**:
- **TRIGGER**: External APIs, OAuth flows, webhook processing
- **COMMAND**: Use Task tool with `subagent_type: "integration-specialist"`
- **COORDINATION**: Works with backend-api-developer
- **VALIDATION**: OAuth flows + external integrations + error handling complete
```typescript
// Example activation:
if (externalApiNeeded || oauthRequired || webhookProcessing) {
  activateAgent("integration-specialist", "External integration for [specific service]")
}
```

**Testing-QA Agent**:
- **TRIGGER**: ANY agent reports completion OR code coverage <80% OR performance issues
- **COMMAND**: Use Task tool with `subagent_type: "testing-qa"`
- **AUTHORITY**: Can block deployment if quality gates fail
- **VALIDATION**: Test coverage >80% + performance targets met
```typescript
// Example activation (AUTOMATIC after any completion):
whenAgentCompletes(() => {
  activateAgent("testing-qa", "Quality validation for [completed work]")
})
```

**DevOps-Infrastructure Agent**:
- **TRIGGER**: Deployment needed, security issues, performance monitoring
- **COMMAND**: Use Task tool with `subagent_type: "devops-infrastructure"`
- **AUTHORITY**: ABSOLUTE veto on security vulnerabilities
- **VALIDATION**: Deployment + monitoring + security scan complete
```typescript
// Example activation:
if (deploymentNeeded || securityIssue || performanceMonitoringRequired) {
  activateAgent("devops-infrastructure", "Infrastructure management for [specific requirement]")
}
```

### 🚨 Emergency Response Protocols (IMMEDIATE ACTION REQUIRED)

#### CRITICAL Security Override (Priority Level: EMERGENCY)
```yaml
IF: Critical/High security vulnerability detected
ACTION:
  1. IMMEDIATELY activate devops-infrastructure agent
  2. HALT all other development
  3. Activate backend-api-developer for security patches
  4. Activate testing-qa for security validation
TIMELINE: 30 minutes maximum response
AUTHORITY: ABSOLUTE - overrides all other priorities
```

#### Performance Crisis (Priority Level: HIGH)
```yaml
IF: API response >500ms OR page load >5s OR database query >200ms
ACTION:
  1. Activate backend-api-developer for optimization
  2. Activate database-architect for query optimization
  3. Activate devops-infrastructure for infrastructure review
TIMELINE: 2 hours maximum response
AUTHORITY: HIGH - can delay feature development
```

#### Quality Gate Failure (Priority Level: MEDIUM)
```yaml
IF: Test coverage <80% OR accessibility violations OR mobile responsiveness failing
ACTION:
  1. Activate testing-qa for comprehensive audit
  2. Activate frontend-specialist if UI issues
  3. Block deployment until resolved
TIMELINE: 4 hours maximum response
AUTHORITY: MEDIUM - can block specific features
```

### ⚡ Quality Gate Enforcement (NON-NEGOTIABLE STANDARDS)

#### Before ANY Deployment or Feature Completion:
```typescript
const MANDATORY_QUALITY_GATES = {
  // Code Quality
  testCoverage: { minimum: 80, current: 0, status: 'BLOCKING' },
  typeScriptErrors: { maximum: 0, current: 0, status: 'BLOCKING' },
  securityVulnerabilities: { maximum: 0, current: 0, status: 'BLOCKING' },

  // Performance Standards
  apiResponseTime: { maximum: 200, current: 0, status: 'BLOCKING' }, // milliseconds
  pageLoadTime: { maximum: 2000, current: 0, status: 'BLOCKING' }, // milliseconds
  databaseQueryTime: { maximum: 100, current: 0, status: 'BLOCKING' }, // milliseconds

  // User Experience
  mobileResponsiveness: { required: true, status: 'BLOCKING' },
  accessibilityCompliance: { required: true, status: 'BLOCKING' },
  keyboardNavigation: { required: true, status: 'BLOCKING' }
}

// AUTOMATIC ENFORCEMENT: If any gate fails, immediately activate relevant agent
if (qualityGate.failed) {
  activateAgent(getResponsibleAgent(qualityGate.category), `Fix ${qualityGate.issue}`)
  BLOCK_DEPLOYMENT = true
}
```

### 🔄 Agent Coordination Workflow

#### Week-by-Week Agent Activation Schedule:

**Week 1: Foundation Setup**
1. Activate `database-architect` → Schema design
2. Activate `devops-infrastructure` → Environment setup
3. Activate `testing-qa` → Test framework setup

**Week 2: Core Development**
1. Activate `backend-api-developer` → API endpoints
2. Activate `frontend-specialist` → Basic components
3. Activate `testing-qa` → Unit tests

**Week 3: Feature Implementation**
1. Activate `frontend-specialist` → Visual filtering UI
2. Activate `backend-api-developer` → Complex queries
3. Activate `testing-qa` → Integration tests

**Week 4: Integration & Polish**
1. Activate `integration-specialist` → External APIs
2. Activate `frontend-specialist` → UX polish
3. Activate `testing-qa` → E2E tests

**Week 5: Deployment Preparation**
1. Activate `devops-infrastructure` → Production setup
2. Activate `testing-qa` → Performance testing
3. Activate `backend-api-developer` → Performance optimization

**Week 6: Launch & Validation**
1. Activate `testing-qa` → User acceptance testing
2. Activate `devops-infrastructure` → Monitoring setup
3. Activate all agents → Final validation

### 📊 Real-Time Monitoring Requirements

#### Performance Monitoring (Check Every Task Completion):
```typescript
const PERFORMANCE_THRESHOLDS = {
  // Immediate action required if exceeded
  critical: {
    apiResponse: 500,      // ms - activate backend-api-developer immediately
    pageLoad: 5000,        // ms - activate frontend-specialist immediately
    dbQuery: 200,          // ms - activate database-architect immediately
    errorRate: 10          // % - activate testing-qa immediately
  },

  // Optimization needed if exceeded
  warning: {
    apiResponse: 200,      // ms - schedule optimization
    pageLoad: 2000,        // ms - schedule optimization
    dbQuery: 100,          // ms - schedule optimization
    errorRate: 5           // % - schedule review
  }
}

// AUTO-TRIGGER: Check after every significant change
after_every_completion(() => {
  if (performance.exceeds(CRITICAL_THRESHOLDS)) {
    EMERGENCY_RESPONSE(getPerformanceAgents())
  }
})
```

### 🎯 Agent Success Validation

#### Each Agent Must Meet These Criteria Before Handoff:

**Database Agent Completion Checklist**:
- [ ] Schema supports all business requirements
- [ ] Migrations are reversible and tested
- [ ] Query performance <100ms for standard operations
- [ ] Backup procedures tested

**Backend Agent Completion Checklist**:
- [ ] All API endpoints documented and tested
- [ ] Authentication/authorization implemented
- [ ] Error handling covers all scenarios
- [ ] Performance targets met (<200ms)

**Frontend Agent Completion Checklist**:
- [ ] Mobile-responsive (320px to 1920px+)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Touch targets minimum 44px
- [ ] Lighthouse score >90

**Integration Agent Completion Checklist**:
- [ ] OAuth flows tested end-to-end
- [ ] Error recovery and fallback tested
- [ ] Rate limiting properly handled
- [ ] Webhook security verified

**Testing Agent Completion Checklist**:
- [ ] >80% test coverage achieved
- [ ] E2E tests cover critical user journeys
- [ ] Performance tests validate targets
- [ ] Security tests pass vulnerability scans

**DevOps Agent Completion Checklist**:
- [ ] CI/CD pipeline fully automated
- [ ] Security scans integrated
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery tested

### 🎮 Practical Implementation Rules

1. **ALWAYS** use the Task tool when any trigger condition is met
2. **NEVER** proceed with dependent work until prerequisite agents complete
3. **IMMEDIATELY** activate testing-qa agent after any significant code change
4. **HALT** all development if security vulnerabilities are detected
5. **MONITOR** performance after every deployment or major change
6. **COORDINATE** parallel work streams to maximize development velocity
7. **VALIDATE** all quality gates before considering any work complete

This orchestration system ensures zero-error development with maximum efficiency through intelligent agent coordination.