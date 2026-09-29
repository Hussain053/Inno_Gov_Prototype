# InnoGov — National Innovation Procurement Portal

### Smart India Hackathon 2026 — Problem Statement 26136

> **Startup-friendly public procurement mechanism that enables government departments to identify, pilot, procure, and scale innovative solutions from eligible startups.**

---

## 🏛️ Overview

**InnoGov** is a digital public procurement platform designed to connect government departments with eligible and innovative startups.

The platform provides an end-to-end workflow for government innovation procurement — from identifying and publishing a problem statement to startup discovery, application evaluation, controlled pilot execution, expert evaluation, procurement decisions, and scale-up.

### Core Procurement Lifecycle

```text
Problem Identification
        ↓
Challenge Publishing
        ↓
Startup Discovery & AI Matching
        ↓
Startup Application
        ↓
Application Review & Shortlisting
        ↓
Controlled Pilot / Sandbox
        ↓
Pilot Evidence Submission
        ↓
Independent Expert Evaluation
        ↓
Procurement Decision
        ↓
Contract Award & Scale-Up
```

---

## 🚀 Key Features

### 1. Government Challenge Management

Government departments can:

- Create and publish innovation challenges
- Define problem statements and requirements
- Specify eligibility criteria
- Define budgets and deadlines
- Define measurable KPIs
- Review startup applications

### 2. AI-Assisted Startup Matching

The platform provides an AI-assisted matching mechanism to identify startups that are compatible with government challenges.

The matching system supports:

- Compatibility scoring
- Capability matching
- KPI matching
- Matching explanations
- Ranked startup discovery

### 3. Startup Applications

Eligible startups can:

- Discover government challenges
- Review challenge requirements
- Apply to suitable challenges
- Track application status
- Withdraw applications where permitted

### 4. Controlled Pilot & Sandbox

Shortlisted startups can participate in controlled pilot programs.

The pilot workflow supports:

- Pilot creation
- Testbed and site definition
- Milestone planning
- Success criteria
- Pilot status tracking
- Evidence submission

### 5. Independent Evaluation

Evaluators can assess pilot outcomes using structured evaluation criteria:

- Technical Rigor
- KPI Adherence
- Innovation
- Feasibility
- Public Impact

Evaluation results can then be aggregated to support government procurement decisions.

### 6. Procurement & Scale-Up

Government users can review evaluation outcomes and proceed with procurement decisions.

The platform supports:

- Contract creation
- Scale-up decisions
- Milestone-based payment tracking
- Procurement lifecycle tracking

### 7. Role-Based Access Control

The platform provides dedicated workflows for:

- **Startup**
- **Government**
- **Evaluator**
- **Administrator**

Each role receives access to the functionality relevant to its responsibilities.

### 8. Notifications & Activity Tracking

The platform includes:

- User notifications
- Unread notification tracking
- Activity and audit information
- Role-specific dashboard information

---

# 🛠️ Technology Stack

## Frontend

- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **TanStack React Query**
- **Axios**
- **React Router**
- **Lucide React**
- **Recharts**

The frontend uses role-based route protection and communicates with the FastAPI backend through REST APIs.

## Backend

- **Python**
- **FastAPI**
- **SQLAlchemy**
- **Alembic**
- **Pydantic**
- **JWT-based Authentication**
- **Pytest**

The backend exposes REST APIs for authentication, challenges, applications, startup matching, pilots, evaluations, contracts, notifications, dashboards, and administration.

## Database

The backend uses a relational database with SQLAlchemy-based database access and Alembic migrations.

The development environment uses SQLite, while the application can be configured for a suitable production database through environment configuration.

---

# 📁 Project Structure

```text
InnoGovF/
│
├── backend/
│   ├── app/
│   ├── tests/
│   ├── alembic/
│   ├── uploads/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── ...
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── ...
│
├── BACKEND_API_GUIDE.md
├── BACKEND_DETAILED_HANDOFF_REPORT.md
├── README.md
└── .gitignore
```

---

# 🔌 Backend Integration

The frontend communicates directly with the FastAPI backend through REST APIs.

The backend URL is configured using the following environment variable:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The frontend communicates directly with the backend routes and does not add an additional `/api` prefix.

### Main API Groups

```text
/auth
/challenges
/applications
/matching
/pilots
/pilot-submissions
/evaluator-assignments
/evaluations
/contracts
/notifications
/dashboard
/admin
/activity
```

For complete endpoint details, request/response formats, roles, and error information, refer to:

**`BACKEND_API_GUIDE.md`**

---

# ⚙️ Getting Started

## Prerequisites

Make sure the following software is installed:

- Node.js
- npm
- Python 3.x
- pip
- Git

---

## 🔹 Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

### Create a Virtual Environment

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Configure the backend environment variables according to the backend configuration.

Do not commit secrets, passwords, API keys, or tokens to the repository.

### Start the Backend

```bash
uvicorn app.main:app --reload
```

The backend will normally be available at:

```text
http://localhost:8000
```

FastAPI automatically provides interactive API documentation at:

```text
http://localhost:8000/docs
```

---

# 🔹 Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file using `.env.example` as a reference.

Example:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Start the Development Server

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

Environment variables should be configured separately for the frontend and backend.

## Frontend

The primary frontend variable is:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Refer to:

```text
frontend/.env.example
```

for the available frontend configuration.

## Backend

Backend environment variables should be configured according to the backend configuration and deployment environment.

### Security

Never commit the following to GitHub:

- Passwords
- API keys
- JWT secrets
- Database credentials
- Access tokens
- Private keys
- Other sensitive configuration values

Use `.env` files locally and keep them excluded through `.gitignore`.

---

# 🧭 End-to-End Platform Workflow

The InnoGov platform follows an end-to-end public procurement workflow.

### 1. Government Challenge Creation

A government department defines:

- Problem statement
- Requirements
- Eligibility criteria
- Budget
- Timeline
- Target KPIs

The challenge is then published on the platform.

### 2. Startup Discovery

Startups can browse available government challenges.

The AI-assisted matching system helps identify startups whose capabilities align with the requirements of a challenge.

### 3. Startup Application

A startup reviews the challenge requirements and submits an application.

The startup can subsequently track the application status.

### 4. Government Review

Government users review submitted applications and can progress suitable applications through the review and shortlisting process.

### 5. Pilot Creation

A shortlisted startup can enter a controlled pilot or sandbox environment.

The government defines:

- Pilot duration
- Testbed/site
- Milestones
- Success criteria

### 6. Pilot Execution

The startup executes the pilot and submits evidence, results, and KPI information.

### 7. Independent Evaluation

An assigned evaluator reviews the pilot submission and evaluates the solution across the defined evaluation dimensions.

### 8. Evaluation & Procurement Decision

Government users review the evaluation results and aggregated assessment before making the procurement decision.

### 9. Contract & Scale-Up

Selected solutions can proceed toward contract award and scale-up, with milestone-based tracking and payment management.

---

# 👥 User Roles

## Startup

Startups can:

- Discover challenges
- View challenge details
- Submit applications
- Track applications
- Participate in pilots
- Submit pilot evidence
- Track contracts and payments

## Government

Government users can:

- Create challenges
- Manage challenges
- Review applications
- Shortlist startups
- Create pilots
- Assign evaluators
- Review evaluations
- Manage procurement decisions
- Manage contracts

## Evaluator

Evaluators can:

- View assigned evaluations
- Review pilot information
- Evaluate pilot submissions
- Submit structured evaluation scores

## Administrator

Administrators can:

- Manage users
- Manage roles
- Manage account status
- Monitor platform activity
- Perform administrative operations

---

# 📊 Evaluation Framework

The evaluation workflow supports structured assessment across multiple dimensions.

| Dimension | Purpose |
|---|---|
| **Technical Rigor** | Assess technical quality and implementation |
| **KPI Adherence** | Assess achievement of defined KPIs |
| **Innovation** | Assess the innovative value of the solution |
| **Feasibility** | Assess practical implementation feasibility |
| **Public Impact** | Assess potential public-sector impact |

---

# 🧪 Testing

Backend tests can be executed using:

```bash
pytest
```

Make sure the backend dependencies and test environment are configured before running the test suite.

---

# 📚 Documentation

Additional project documentation is available in the repository.

### Backend API Guide

`BACKEND_API_GUIDE.md`

Contains detailed information about:

- API endpoints
- HTTP methods
- Authentication requirements
- Request formats
- Response formats
- Error handling
- Role requirements

### Backend Handoff Documentation

`BACKEND_DETAILED_HANDOFF_REPORT.md`

Contains additional backend implementation and integration information.

---

# 🚀 Production Build

## Frontend

Create a production build using:

```bash
npm run build
```

The production build is generated in:

```text
frontend/dist/
```

To preview the production build locally:

```bash
npm run preview
```

## Backend

The FastAPI backend can be deployed using a production ASGI server such as Uvicorn or Gunicorn, depending on the target deployment environment.

Production environment variables should be configured securely through the deployment platform.

---

# 🎯 Smart India Hackathon 2026

### Problem Statement

**26136**

### Problem Statement Theme

**Startup-friendly public procurement mechanism**

### Project

**InnoGov — National Innovation Procurement Portal**

InnoGov demonstrates an end-to-end mechanism through which government departments can identify, evaluate, pilot, procure, and scale innovative solutions from eligible startups.

---

# 🔒 Security & Privacy

InnoGov follows basic security practices for a prototype application, including:

- Role-based access control
- Authenticated API access
- Token-based authentication
- Protected frontend routes
- Environment-based configuration
- Separation of sensitive credentials from source code

Sensitive credentials should never be committed to the repository.

---

# 📌 Project Status

**Status:** Hackathon Prototype

The current version demonstrates the core workflow and technical architecture required for the Smart India Hackathon problem statement.

The system is designed to be extensible for future improvements such as:

- Enhanced AI matching
- Additional procurement workflows
- Advanced analytics
- Improved pilot monitoring
- Production-grade infrastructure
- Integration with external government systems

---

# 👨‍💻 Project

**InnoGov**

Developed as a prototype for:

**Smart India Hackathon 2026**

**Problem Statement 26136**

---

## 📄 License

This project is developed as an academic and hackathon prototype.