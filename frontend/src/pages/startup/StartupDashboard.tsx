import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  PlayCircle,
  Award,
  CreditCard,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import startupService from '../../services/startupService';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import { useAuth } from '../../context/AuthContext';
import PilotTimeline from '../../components/timeline/PilotTimeline';

export const StartupDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['startup-dashboard'],
    queryFn: dashboardService.getStartupDashboard,
  });

  const { data: profile } = useQuery({
    queryKey: ['my-startup-profile'],
    queryFn: startupService.getMyProfile,
  });

  const { data: pilots } = useQuery({
    queryKey: ['my-pilots'],
    queryFn: () => pilotService.listPilots(),
  });

  const { data: challenges } = useQuery({
    queryKey: ['recommended-challenges'],
    queryFn: () => challengeService.listChallenges({ status: 'OPEN', limit: 3 }),
  });

  const activePilot = pilots?.find((p) => p.status === 'IN_PROGRESS' || p.status === 'ASSIGNED');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Verification Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gov-navy">
              Welcome, {profile?.company_name || user?.organization || user?.name}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user?.is_active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {user?.is_active ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DPIIT Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Verification Pending
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Startup Procurement Console • Real-time synchronization with FastAPI engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!profile && (
            <Link
              to="/startup/profile"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
            >
              <Building2 className="w-4 h-4 text-amber-700" /> Complete Startup Profile
            </Link>
          )}
          <Link
            to="/startup/challenges"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span>Explore Challenges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-gov-blue flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.total_applications ?? 0}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{metrics?.shortlisted_applications ?? 0} Shortlisted</span>
            <span>•</span>
            <span>{metrics?.submitted_applications ?? 0} Active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Pilots</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.active_pilots ?? 0}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span className="text-slate-600">{metrics?.completed_pilots ?? 0} Completed</span>
            <span>•</span>
            <span>{metrics?.total_submissions ?? 0} Submissions</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awarded Contracts</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.total_contracts ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Legally binding procurement</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contract Value</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{(metrics?.total_contract_value ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Multi-milestone disbursed</p>
        </div>
      </div>

      {/* Active Pilot Spotlight & Timeline */}
      {activePilot ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-gov-blue uppercase">
                  ACTIVE PILOT PROJECT #{activePilot.id}
                </span>
                <span className="text-xs font-bold text-slate-700">Status: {activePilot.status}</span>
              </div>
              <h3 className="text-lg font-bold text-gov-navy mt-1">{activePilot.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/startup/pilots/${activePilot.id}`}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                View Details
              </Link>
              {activePilot.status === 'IN_PROGRESS' && (
                <Link
                  to={`/startup/pilots/${activePilot.id}/submit`}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors"
                >
                  Submit KPI Evidence
                </Link>
              )}
            </div>
          </div>

          <PilotTimeline
            applicationStatus="SHORTLISTED"
            pilotStatus={activePilot.status}
            submissionStatus={activePilot.submission?.status}
            hasEvaluations={false}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center">
          <PlayCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No Active Pilot Right Now</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once government reviews and shortlists your application, an active pilot project with milestone KPIs will appear here.
          </p>
          <div className="mt-4">
            <Link
              to="/startup/challenges"
              className="inline-flex items-center gap-2 text-xs font-bold text-gov-blue hover:underline"
            >
              Browse Open Government Challenges <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Recommended Challenges */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gov-navy">Open Government Challenges</h3>
            <p className="text-xs text-slate-500">Tenders open for innovative startup applications</p>
          </div>
          <Link
            to="/startup/challenges"
            className="text-xs font-semibold text-gov-blue hover:underline flex items-center gap-1"
          >
            View all challenges <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges?.map((ch) => (
            <div
              key={ch.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-gov-blue hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-gov-blue">
                    {ch.category || 'General Innovation'}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    ₹{ch.budget ? (ch.budget / 100000).toFixed(1) + ' Lakhs' : 'Grant'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{ch.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{ch.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {ch.application_deadline ? `Deadline: ${ch.application_deadline}` : 'Open Application'}
                </span>
                <Link
                  to={`/startup/challenges/${ch.id}`}
                  className="text-xs font-bold text-gov-blue hover:underline flex items-center gap-1"
                >
                  Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartupDashboard;
