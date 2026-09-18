import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building,
  Info,
  ExternalLink,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import { MilestonePayment } from '../../types';

export const StartupPaymentsPage: React.FC = () => {
  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestone-payments'],
    queryFn: () => paymentService.getMilestones(),
  });

  const totalSanctioned = milestones?.reduce((acc, m) => acc + m.amount, 0) || 0;
  const totalDisbursed =
    milestones?.filter((m) => m.status === 'PAID').reduce((acc, m) => acc + m.amount, 0) || 0;
  const totalApproved =
    milestones?.filter((m) => m.status === 'APPROVED').reduce((acc, m) => acc + m.amount, 0) || 0;

  const getStatusBadge = (status: MilestonePayment['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DISBURSED (PAID)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> APPROVED FOR DISBURSAL
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> UNDER AUDIT
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
            UPCOMING MILESTONE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gov-blue" />
              Procurement Milestone Payments
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Public sector milestone payment disbursements tied directly to verified pilot deliverables.
            </p>
          </div>

          {/* Prototype Demo Banner */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Prototype Layer • Demo Transactions</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Grant Sanctioned</span>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalSanctioned.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">4 Structured Pilot Milestones</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disbursed (Paid)</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            {((totalDisbursed / (totalSanctioned || 1)) * 100).toFixed(0)}% Funds Released
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Pending Release</span>
          <p className="text-2xl font-black text-gov-blue mt-2">
            ₹{totalApproved.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Cleared Technical Audit</span>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider">
          Milestone Breakdown & Payment Releases
        </h3>

        {milestones?.map((milestone, idx) => (
          <div
            key={milestone.id}
            className={`bg-white rounded-2xl border p-6 shadow-card transition-all ${
              milestone.status === 'PAID'
                ? 'border-emerald-200 bg-emerald-50/20'
                : milestone.status === 'APPROVED'
                ? 'border-blue-200 bg-blue-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-slate-400">Step 0{idx + 1}</span>
                  {getStatusBadge(milestone.status)}
                </div>
                <h4 className="text-base font-bold text-slate-900">{milestone.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{milestone.deliverables}</p>
              </div>

              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 block">Milestone Amount</span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  ₹{milestone.amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>Target Date: {milestone.target_date}</span>
                {milestone.transaction_ref && (
                  <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Ref: {milestone.transaction_ref} (Demo)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 italic">
                  * Tied to verified telemetry benchmarks
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StartupPaymentsPage;
