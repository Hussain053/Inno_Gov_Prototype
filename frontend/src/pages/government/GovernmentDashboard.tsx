import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Layers,
  FileCheck2,
  PlayCircle,
  Award,
  CreditCard,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import challengeService from '../../services/challengeService';
import applicationService from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';

export const GovernmentDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['government-dashboard'],
    queryFn: dashboardService.getGovernmentDashboard,
  });

  const { data: challenges } = useQuery({
    queryKey: ['my-challenges-list'],
    queryFn: () => challengeService.listChallenges({ government_user_id: user?.id, limit: 5 }),
  });

  const pipelineStages = [
    { label: 'Applications', count: metrics?.total_applications_received ?? 0, color: 'bg-blue-600' },
    { label: 'Under Review', count: metrics?.applications_under_review ?? 0, color: 'bg-indigo-600' },
    { label: 'Shortlisted', count: metrics?.shortlisted_applications ?? 0, color: 'bg-emerald-600' },
    { label: 'Active Pilots', count: metrics?.active_pilots ?? 0, color: 'bg-teal-600' },
    { label: 'Completed Pilots', count: metrics?.completed_pilots ?? 0, color: 'bg-purple-600' },
    { label: 'Contracts Awarded', count: metrics?.contracts_awarded ?? 0, color: 'bg-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gov-navy">
              {user?.organization || 'Ministry Department Dashboard'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-gov-blue border border-blue-200">
              Procuring Department
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Official Public Procurement Dashboard • Fast-track startup pilots to procurement scale
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/government/challenges/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Challenge</span>
          </Link>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Challenges</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-gov-blue flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.open_challenges ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {metrics?.total_challenges ?? 0} total tenders
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Applications</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.total_applications_received ?? 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            {metrics?.shortlisted_applications ?? 0} Shortlisted
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Pilots</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.active_pilots ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {metrics?.completed_pilots ?? 0} Completed
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contracts Awarded</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.contracts_awarded ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Scale-up contracts</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contract Value</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 truncate">
            ₹{(metrics?.total_contract_value ?? 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Tender commitment</span>
        </div>
      </div>

      {/* Challenge Pipeline Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gov-blue" />
              Procurement Funnel & Pipeline Flow
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizing conversion from problem formulation to procurement contract award
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.label}
              className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400">0{idx + 1}</span>
                <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{stage.count}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1 leading-tight">{stage.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Department Challenges & Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gov-navy">My Challenges & AI Matching</h3>
            <p className="text-xs text-slate-500">Run deterministic AI matching against registered startups</p>
          </div>
          <Link
            to="/government/challenges"
            className="text-xs font-semibold text-gov-blue hover:underline flex items-center gap-1"
          >
            Manage all challenges <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {challenges?.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs">No challenges created yet. Launch your first innovation challenge!</p>
            <Link
              to="/government/challenges/create"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Create Challenge
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {challenges?.map((ch) => (
              <div
                key={ch.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{ch.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-gov-blue">
                      {ch.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{ch.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{ch.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{ch.problem_statement}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/government/challenges/${ch.id}/matching`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Startup Match
                  </Link>
                  <Link
                    to={`/government/challenges/${ch.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernmentDashboard;
