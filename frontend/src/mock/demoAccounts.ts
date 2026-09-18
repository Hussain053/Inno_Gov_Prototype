import { UserRole } from '../types';

export interface DemoAccount {
  role: UserRole;
  label: string;
  roleName: string;
  email: string;
  password: string;
  organization: string;
  department?: string;
  serviceId?: string;
  badge: string;
  description: string;
}

export const DEMO_ACCOUNTS: Record<UserRole, DemoAccount> = {
  STARTUP: {
    role: 'STARTUP',
    label: '🚀 Startup Innovator',
    roleName: 'SolarTech Innovations',
    email: 'startup_a@solartech.io',
    password: 'Password123!',
    organization: 'SolarTech Inc',
    badge: 'DPIIT Registered',
    description: 'Next-gen solar microgrid provider with high IoT reliability capabilities',
  },
  GOVERNMENT: {
    role: 'GOVERNMENT',
    label: '🏛 Government Department',
    roleName: 'Department of Energy',
    email: 'gov_a@energy.gov',
    password: 'Password123!',
    organization: 'Ministry of Power & Energy',
    department: 'Renewable Energy Division',
    serviceId: 'GOV-VERIFIED-001',
    badge: 'Verified Official',
    description: 'Publish challenges, discover startups with AI, run pilots & award contracts',
  },
  EVALUATOR: {
    role: 'EVALUATOR',
    label: '✓ Technical Evaluator',
    roleName: 'CleanTech Evaluation Board',
    email: 'evaluator_a@cleanenergy.org',
    password: 'Password123!',
    organization: 'National Clean Energy Council',
    serviceId: 'EVAL-VERIFIED-001',
    badge: 'Accredited Panelist',
    description: 'Perform rigorous multi-criteria evaluations on pilot telemetry & KPI evidence',
  },
  ADMIN: {
    role: 'ADMIN',
    label: '⚙ System Administrator',
    roleName: 'InnoGov Mission Director',
    email: 'admin@innogov.gov.in',
    password: 'Password123!',
    organization: 'InnoGov Public Procurement Cell',
    badge: 'System Admin',
    description: 'Control tower, startup verification, user role governance, and procurement audit',
  },
};
