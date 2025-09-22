# APCTC Healthcare Provider Portal

A modern healthcare provider portal built for Asian Pacific Counseling & Treatment Centers (APCTC). This prototype demonstrates patient management, service category organization, and healthcare workflow optimization.

## 🏥 Features

### Patient Management
- **Find Patient by Service Type** - Progressive disclosure navigation by healthcare service categories
- **Patient Registration** - Complete HIPAA-compliant new patient onboarding
- **Service Categories**: Assessment & Intake, Mental Health Counseling, Medication Management, Case Management, Community Education, Crisis Intervention

### Healthcare Workflow
- **Multi-Location Support** - 8 APCTC centers across LA County
- **Provider Dashboard** - Centralized view of schedule, alerts, and recent patients
- **Appointment Scheduling** - Integrated scheduling with room assignments
- **Session Notes** - Treatment documentation and progress tracking

### Technical Features
- **Desktop-First Design** - Optimized for healthcare professionals
- **HIPAA Compliance Ready** - Security-focused architecture
- **Progressive Disclosure** - Simplified navigation for medical staff
- **Mobile Responsive** - Works across devices

## 🚀 Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Deployment**: Vercel/Railway ready

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3005](http://localhost:3005) with your browser.

## 🏗️ Project Structure

```
app/
├── dashboard/
│   ├── patients/
│   │   ├── search/          # Service category selection & results
│   │   ├── new/             # New patient registration
│   │   └── [id]/            # Patient profile views
│   ├── schedule/
│   │   └── new/             # Appointment scheduling
│   └── sessions/
│       └── new/             # Session notes
components/
├── navigation/              # Service category buttons
├── patients/               # Patient results & forms
├── layout/                 # Sidebar & main layout
└── ui/                     # Reusable UI components
```

## 🎯 Design Philosophy

**Healthcare-First Approach**:
- Medical professionals think in service categories, not business metrics
- Two-click maximum to find any patient
- Zero training required - intuitive for healthcare staff
- Progressive disclosure prevents information overload

## 📱 Demo Credentials

This prototype uses mock data for demonstration purposes. All patient information is fictional and HIPAA-compliant.

**Provider**: Dr. Sarah Lee
**Location**: Alhambra Center
**Demo Data**: 542 mock patients across 6 service categories

## 📋 Key Pages

- `/dashboard` - Provider command center
- `/dashboard/patients/search` - Find patients by service type
- `/dashboard/patients/new` - Register new patient
- `/dashboard/schedule/new` - Schedule appointments
- `/dashboard/sessions/new` - Add session notes

## 🔐 Security & Compliance

- HTTPS enforced
- Mock data only (no real PHI)
- Security headers configured
- Ready for HIPAA compliance implementation

## 🎨 UI/UX Highlights

- **Service Category Navigation** - Large, clear buttons for each healthcare service
- **Patient Results** - Comprehensive patient information with quick actions
- **Registration Form** - Complete healthcare intake with HIPAA consent
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Accessibility** - WCAG 2.1 AA compliant

---

**Built for APCTC Healthcare Providers** | **Prototype Version 1.0** | **January 2025**
