# InnoGov Frontend — National Innovation Procurement Portal
**Smart India Hackathon (SIH) Problem Statement 26136**
> *"Startup friendly public procurement mechanism that enables government departments to identify, pilot, procure, and scale innovative solutions from eligible startups."*

---

## 🏛 Platform Overview
InnoGov is an end-to-end, multi-role digital public infrastructure platform that connects Indian government departments with DPIIT-recognized startups. It enforces statutory compliance under **GFR 2017 Rule 149/161(iv)**, providing:

1. **Problem Statement Publishing & Discovery**: Government departments post challenges with quantifiable KPIs, sector categorization, and budget caps.
2. **AI Startup Match Engine**: Automated semantic & capability matching scoring startups (0–100%) against challenge requirements with transparent dimension breakdowns.
3. **Sandbox Pilot Lifecycle**: Shortlisted startups enter isolated, controlled pilot contracts with structured milestones and telemetry verification.
4. **Independent Domain Evaluation**: Double-blind accredited evaluator scorecards assessing Technical Rigor, KPI Adherence, Innovation, Feasibility, and Public Impact.
5. **Contract Award & Scaling Decision**: Formal transition to scale-up procurement contracts with milestone disbursement tracking.
6. **Central Administrative Control Tower**: DPIIT verification queue, RBAC role management, and tamper-evident audit logs.

---

## 🛠 Technology Stack
- **Framework**: React 18.3 with TypeScript (strict mode)
- **Bundler & Tooling**: Vite 5.4 with Rollup manual chunking
- **Styling**: Tailwind CSS with custom Indian Civic Tech color palette (`#0B192C` Gov Navy, `#1D4ED8` Gov Blue, emerald, amber)
- **State & Data Fetching**: TanStack React Query v5 & Axios with request/response Bearer interceptors
- **Icons**: Lucide React
- **Charts & Visualizations**: Recharts
- **Routing**: React Router v6 with `RoleGate` RBAC guards and deep linking

---

## 🔌 Backend Integration Contract
- **Base URL**: Configured via `VITE_API_BASE_URL` (default `http://localhost:8000`).
- **No `/api` Prefix**: The frontend strictly interfaces with the existing FastAPI backend routes:
  - `/auth/login`, `/auth/me`, `/auth/register*`
  - `/challenges`, `/challenges/{id}`, `/challenges/{id}/decision`
  - `/applications`, `/applications/{id}/submit`, `/applications/{id}/withdraw`
  - `/matching/challenges/{id}/startups`, `/matching/challenges/{id}`
  - `/pilots`, `/pilots/{id}/status`
  - `/pilot-submissions`, `/pilot-submissions/{id}/submit`
  - `/evaluator-assignments`, `/evaluations`, `/evaluations/summary/{id}`
  - `/contracts`
  - `/notifications`, `/notifications/unread-count`
  - `/dashboard/startup`, `/dashboard/government`, `/dashboard/evaluator`, `/dashboard/admin`
  - `/admin/users`, `/admin/users/{id}/status`, `/admin/users/{id}/role`
  - `/activity`

---

## 👥 Demo Personas & Quick Switcher
The platform features an instant **Role Quick Switcher** in the top navigation bar. You can test any role immediately:

| Role | Demo Email | Password | Persona & Organization |
|---|---|---|---|
| **STARTUP** | `startup_a@solartech.io` | `Password123!` | SolarTech Innovations (DPIIT Registered) |
| **GOVERNMENT** | `gov_a@energy.gov` | `Password123!` | Ministry of Power & Energy (Verified Official) |
| **EVALUATOR** | `evaluator_a@cleanenergy.org` | `Password123!` | CleanTech Evaluation Board (Accredited Panelist) |
| **ADMIN** | `admin@innogov.gov.in` | `Password123!` | InnoGov Mission Director (System Administrator) |

*Offline Demo Mode*: If the FastAPI backend is not active, the frontend seamlessly engages offline simulation mode for these credentials, allowing complete UI inspection.

---

## 🚀 Getting Started

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file (or copy `.env.example`):
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## 🧭 End-to-End 12-Step Judging Flow
1. **Public Discovery**: Visit `/` to review the InnoGov mission, 6-stage procurement stepper, and SIH 26136 problem statement details.
2. **Government Problem Formulation**: Log in as `GOVERNMENT` → Go to `/government/challenges/create` → Fill in problem scope, eligibility criteria, budget cap, and target KPIs → Publish challenge.
3. **AI Startup Match Engine**: Open `/government/challenges/:id/matching` → View AI compatibility ranking (0–100%), matching KPI tags, and explainability reasoning.
4. **Startup Discovery & Matching**: Switch to `STARTUP` → Browse `/startup/challenges` → View AI match compatibility score directly on `/startup/challenges/:id`.
5. **One-Click Application**: Click **Apply** → Go to `/startup/applications` → Review submitted application.
6. **Government Application Review**: Switch to `GOVERNMENT` → Navigate to `/government/challenges/:id/applications` → Transition application from `SUBMITTED` → `UNDER_REVIEW` → `SHORTLISTED`.
7. **Sandbox Pilot Creation**: On shortlisted application, click **Create Pilot** (`/government/pilots/create`) → Define milestone duration, testbed site, and success criteria.
8. **Startup Pilot Activation**: Switch to `STARTUP` → Go to `/startup/pilots` → Click **Start Pilot** (`IN_PROGRESS`).
9. **Pilot Evidence Submission**: In `/startup/pilots/:id/submit` → Input results narrative, achieved KPI metrics (JSON), and document proof URLs → Submit.
10. **Evaluator Assignment**: Switch to `GOVERNMENT` → Go to `/government/evaluations` → Assign domain expert (`POST /evaluator-assignments`).
11. **Technical Evaluation Workspace**: Switch to `EVALUATOR` → Open `/evaluator/workspace/:id` → Score 5 dimensions (Technical, KPI, Innovation, Feasibility, Impact) → Select `RECOMMEND` → Submit evaluation.
12. **Procurement Award & Scaling**: Switch to `GOVERNMENT` → View aggregated scorecard on `/government/evaluations` → Go to `/government/contracts` → Click **Award Scale Contract** → View Milestone payment schedule on `/startup/payments`.
