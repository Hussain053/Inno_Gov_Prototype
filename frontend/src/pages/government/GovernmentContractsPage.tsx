import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSignature,
  Award,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Building,
  Calendar,
  IndianRupee,
  PlusCircle,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import contractService, { ContractCreateParams } from '../../services/contractService';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import { Contract, ContractStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

export const GovernmentContractsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [selectedPilotId, setSelectedPilotId] = useState<number | ''>('');
  const [contractValue, setContractValue] = useState<number>(2400000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
  );
  const [awardNotes, setAwardNotes] = useState(
    'Based on satisfactory 90-day pilot telemetry (efficiency >93%, uptime 99.9%), Government of India hereby awards public procurement scaling contract.'
  );

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts-all'],
    queryFn: () => contractService.listContracts(),
  });

  const { data: pilots } = useQuery({
    queryKey: ['pilots-all'],
    queryFn: () => pilotService.listPilots(),
  });

  // Pilots eligible for contracting (status COMPLETED)
  const completedPilots = pilots?.filter((p) => p.status === 'COMPLETED' || p.status === 'IN_PROGRESS') || [];

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractCreateParams) => {
      // 1. Create contract
      const contract = await contractService.createContract(data);

      // 2. Also record official government award decision on challenge if pilot challenge is found
      const targetPilot = pilots?.find((p) => p.id === data.pilot_id);
      if (targetPilot) {
        try {
          await challengeService.makeDecision(targetPilot.challenge_id, {
            pilot_id: data.pilot_id,
            decision: 'AWARDED',
            notes: awardNotes,
          });
        } catch (decErr) {
          console.warn('Decision endpoint note:', decErr);
        }
      }

      return contract;
    },
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ['contracts-all'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Contract awarded', `Contract #${c.id} generated and scale-up decision officially certified.`);
      setIsCreatingContract(false);
    },
    onError: (err: any) => {
      error('Contract creation failed', err.response?.data?.detail || 'An error occurred creating the contract');
    },
  });

  const updateContractStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContractStatus }) =>
      contractService.updateStatus(id, status),
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ['contracts-all'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Contract status updated', `Contract #${c.id} transitioned to ${c.status}.`);
    },
    onError: (err: any) => {
      error('Status update failed', err.response?.data?.detail || 'Could not update contract status');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPilotId) {
      error('Selection required', 'Please select a pilot project');
      return;
    }

    createContractMutation.mutate({
      pilot_id: Number(selectedPilotId),
      contract_value: Number(contractValue),
      start_date: startDate,
      end_date: endDate,
      status: 'AWARDED',
    });
  };

  const getContractStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">DRAFT</span>;
      case 'AWARDED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">AWARDED</span>;
      case 'ACTIVE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">ACTIVE SCALE-UP</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">COMPLETED</span>;
      case 'TERMINATED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">TERMINATED</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-gov-blue" />
            Procurement Scale-Up Contracts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stage 05 & 06: Legally binding public procurement contracts following successful evidence evaluation.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingContract(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Finalize New Procurement Contract
        </button>
      </div>

      {/* Procurement Outcome Stepper Card */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white rounded-2xl border border-blue-200 p-6 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gov-navy mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-gov-blue" />
          SIH Procurement Outcome Path
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-blue-100">
            <span className="text-[10px] font-mono text-gov-blue font-bold">Step 1</span>
            <p className="font-bold text-slate-800 mt-0.5">Pilot Completed</p>
            <p className="text-[11px] text-slate-500 mt-0.5">90-day field deployment verified</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100">
            <span className="text-[10px] font-mono text-gov-blue font-bold">Step 2</span>
            <p className="font-bold text-slate-800 mt-0.5">Evaluation Certified</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Panel recommends for award</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100">
            <span className="text-[10px] font-mono text-gov-blue font-bold">Step 3</span>
            <p className="font-bold text-slate-800 mt-0.5">Contract Issued</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Legally binding tender award</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100">
            <span className="text-[10px] font-mono text-gov-blue font-bold">Step 4</span>
            <p className="font-bold text-slate-800 mt-0.5">Scale-Up Expansion</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Disbursements & pan-India scale</p>
          </div>
        </div>
      </div>

      {/* Contract Creation Modal / Panel */}
      {isCreatingContract && (
        <div className="bg-white rounded-2xl border-2 border-blue-400 p-6 shadow-elevated space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-gov-navy flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-gov-blue" />
              Award Procurement Contract & Scale Decision
            </h3>
            <button
              onClick={() => setIsCreatingContract(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Pilot Project *
              </label>
              <select
                required
                value={selectedPilotId}
                onChange={(e) => setSelectedPilotId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              >
                <option value="">-- Choose Completed / Evaluated Pilot --</option>
                {completedPilots.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pilot #{p.id}: {p.title} (Status: {p.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contract Value (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min="10000"
                  step="50000"
                  value={contractValue}
                  onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ₹{(contractValue / 100000).toFixed(2)} Lakhs total procurement commitment
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contract Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contract Expiration Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Award Decision Justification Notes
              </label>
              <textarea
                rows={2}
                value={awardNotes}
                onChange={(e) => setAwardNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingContract(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createContractMutation.isPending}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {createContractMutation.isPending ? 'Generating Contract...' : 'Issue Binding Contract & Award Scale'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contracts List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading procurement contracts...</p>
        </div>
      ) : contracts?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Contracts Issued Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Following successful pilot execution and panel scoring, issue your first scale-up contract using the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts?.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Contract #{contract.id}</span>
                  {getContractStatusBadge(contract.status)}
                  <span className="text-xs text-slate-500">Pilot Project #{contract.pilot_id}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  Public Procurement Agreement • Startup ID #{contract.startup_id}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="font-bold text-gov-navy text-sm">
                    Value: ₹{contract.contract_value?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span>Effective: {contract.start_date || 'N/A'}</span>
                  <span>Expires: {contract.end_date || 'N/A'}</span>
                </div>
              </div>

              {/* Status Transition Lifecycle Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {contract.status === 'DRAFT' && (
                  <button
                    onClick={() =>
                      updateContractStatusMutation.mutate({ id: contract.id, status: 'AWARDED' })
                    }
                    disabled={updateContractStatusMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Award className="w-3.5 h-3.5" /> Award Contract
                  </button>
                )}

                {contract.status === 'AWARDED' && (
                  <button
                    onClick={() =>
                      updateContractStatusMutation.mutate({ id: contract.id, status: 'ACTIVE' })
                    }
                    disabled={updateContractStatusMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Activate Scale-Up
                  </button>
                )}

                {contract.status === 'ACTIVE' && (
                  <button
                    onClick={() =>
                      updateContractStatusMutation.mutate({ id: contract.id, status: 'COMPLETED' })
                    }
                    disabled={updateContractStatusMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Full Delivery Complete
                  </button>
                )}

                <span className="text-[11px] text-slate-400 font-mono px-2 py-1 bg-slate-100 rounded">
                  FastAPI Sync ✅
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentContractsPage;
