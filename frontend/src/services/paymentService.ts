import { MilestonePayment } from '../types';

/**
 * Isolated milestone payment service.
 * 
 * IMPORTANT: InnoGov backend currently does not include a real banking/payment gateway.
 * This service provides structured milestone tracking,
 * designed so a real payment gateway (e.g. GeM PFMS or RazorpayX) can replace this interface seamlessly.
 */

const DEFAULT_MILESTONES: MilestonePayment[] = [
  {
    id: 'm-01',
    title: 'Milestone 1: Pilot Kickoff & Hardware Procurement',
    amount: 200000,
    status: 'PAID',
    target_date: '2026-03-15',
    deliverables: 'Initial setup, procurement of smart IoT sensor grid units, baseline survey',
    transaction_ref: 'TXN-INNO-849201',
    is_demo: true,
  },
  {
    id: 'm-02',
    title: 'Milestone 2: Field Installation & Telemetry Integration',
    amount: 200000,
    status: 'PAID',
    target_date: '2026-05-30',
    deliverables: 'Deploying edge telemetry in Municipal Facility #4, validating communication with SCADA',
    transaction_ref: 'TXN-INNO-991204',
    is_demo: true,
  },
  {
    id: 'm-03',
    title: 'Milestone 3: KPI Benchmark Evaluation & Evidence Submission',
    amount: 225000,
    status: 'APPROVED',
    target_date: '2026-08-15',
    deliverables: 'Submission of 90-day reliability data, >=90% efficiency and 99.9% uptime verification',
    transaction_ref: 'TXN-INNO-330192',
    is_demo: true,
  },
  {
    id: 'm-04',
    title: 'Milestone 4: Pilot Completion & Final Handover to Scale',
    amount: 225000,
    status: 'UPCOMING',
    target_date: '2026-10-31',
    deliverables: 'Final technical report, handover documentation, government procurement scale-up roadmap',
    is_demo: true,
  },
];

export const paymentService = {
  getMilestones: async (pilotId?: number): Promise<MilestonePayment[]> => {
    // Read from localStorage to allow interactive demo testing if modified
    const stored = localStorage.getItem(`innogov_milestones_${pilotId || 'default'}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_MILESTONES;
  },

  updateMilestoneStatus: async (
    pilotId: number | undefined,
    milestoneId: string,
    newStatus: 'PAID' | 'APPROVED' | 'IN_REVIEW' | 'UPCOMING'
  ): Promise<MilestonePayment[]> => {
    const current = await paymentService.getMilestones(pilotId);
    const updated = current.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            status: newStatus,
            transaction_ref:
              newStatus === 'PAID' && !m.transaction_ref
                ? `DEMO-TXN-INNO-${Math.floor(100000 + Math.random() * 900000)}`
                : m.transaction_ref,
          }
        : m
    );
    localStorage.setItem(`innogov_milestones_${pilotId || 'default'}`, JSON.stringify(updated));
    return updated;
  },

  resetDemoMilestones: (pilotId?: number) => {
    localStorage.removeItem(`innogov_milestones_${pilotId || 'default'}`);
  },
};

export default paymentService;
