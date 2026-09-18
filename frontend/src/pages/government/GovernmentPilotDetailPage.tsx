import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Award,
  FileText,
  Building,
  Target,
  Sparkles,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import submissionService from '../../services/submissionService';
import evaluationService from '../../services/evaluationService';
import startupService from '../../services/startupService';
import PilotTimeline from '../../components/timeline/PilotTimeline';
import StructuredDataViewer from '../../components/common/StructuredDataViewer';
import { useToast } from '../../context/ToastContext';

export const GovernmentPilotDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pilotId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: pilot, isLoading } = useQuery({
    queryKey: ['pilot', pilotId],
    queryFn: () => pilotService.getPilot(pilotId),
    enabled: !!pilotId,
  });

  const { data: challenge } = useQuery({
    queryKey: ['challenge', pilot?.challenge_id],
    queryFn: () => challengeService.getChallenge(pilot!.challenge_id),
    enabled: !!pilot?.challenge_id,
  });

  const { data: startupProfile } = useQuery({
    queryKey: ['startup-profile', pilot?.startup_id],
    queryFn: () => startupService.getStartupProfile(pilot!.startup_id),
    enabled: !!pilot?.startup_id,
  });

  const { data: submissions } = useQuery({
    queryKey: ['pilot-submissions', pilotId],
    queryFn: () => submissionService.listSubmissions({ pilot_id: pilotId }),
    enabled: !!pilotId,
  });

  const submission = submissions?.[0];

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations-submission', submission?.id],
    queryFn: () => evaluationService.getEvaluationsBySubmission(submission!.id),
    enabled: !!submission?.id,
  });

  const { data: evalSummary } = useQuery({
    queryKey: ['evaluation-summary', submission?.id],
    queryFn: () => evaluationService.getEvaluationSummary(submission!.id),
    enabled: !!submission?.id,
  });

  const completeMutation = useMutation({
    mutationFn: () => pilotService.completePilot(pilotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot', pilotId] });
      queryClient.invalidateQueries({ queryKey: ['pilots-all'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Pilot marked completed', 'Ready to finalize contract and scale-up award.');
    },
    onError: (err: any) => {
      error('Failed to complete pilot', err.response?.data?.detail || 'An error occurred');
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading pilot...</p>
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Pilot Not Found</h3>
        <Link to="/government/pilots" className="text-xs text-gov-blue hover:underline mt-2 inline-block">
          ← Back to Pilots
        </Link>
      </div>
    );
  }

  const hasCompletedEvaluations = (evaluations && evaluations.length > 0) || false;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/government/pilots"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pilots
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-gov-blue">
                PILOT #{pilot.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  pilot.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-gov-blue border border-blue-200'
                }`}
              >
                STATUS: {pilot.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">Startup ID #{pilot.startup_id}</span>
            </div>

            <h1 className="text-2xl font-black text-gov-navy">{pilot.title}</h1>
            <p className="text-xs text-slate-500">Associated Challenge: {challenge?.title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pilot.status === 'IN_PROGRESS' && (
              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Mark Completed
              </button>
            )}

            <Link
              to="/government/evaluations"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
            >
              <Award className="w-4 h-4 text-purple-600" /> Evaluations Workspace
            </Link>

            {pilot.status === 'COMPLETED' && (
              <Link
                to="/government/contracts"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> Issue Scale-Up Contract
              </Link>
            )}
          </div>
        </div>

        {/* Associated Startup Details */}
        {startupProfile && (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gov-blue" />
                  <span className="text-sm font-bold text-slate-900">{startupProfile.company_name}</span>
                  {startupProfile.industry && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-gov-blue">
                      {startupProfile.industry}
                    </span>
                  )}
                </div>
                {startupProfile.description && (
                  <p className="text-xs text-slate-600 mt-1">{startupProfile.description}</p>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-3">
                {startupProfile.location && <span>📍 {startupProfile.location}</span>}
                {startupProfile.team_size && <span>👥 Team: {startupProfile.team_size}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Start Date</span>
            <span className="font-semibold text-slate-800">{pilot.start_date || 'Immediate'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Target End Date</span>
            <span className="font-semibold text-slate-800">{pilot.end_date || '90-day sandbox'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Submission State</span>
            <span className="font-semibold text-slate-800">{submission?.status || 'Pending Delivery'}</span>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <PilotTimeline
        applicationStatus="SHORTLISTED"
        pilotStatus={pilot.status}
        submissionStatus={submission?.status}
        hasEvaluations={hasCompletedEvaluations}
        isAwarded={pilot.status === 'COMPLETED'}
      />

      {/* Evaluator Scorecard Summary (If evaluations exist) */}
      {evalSummary && evalSummary.completed_evaluations_count > 0 && (
        <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-100">
            <div>
              <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Certified Independent Evaluator Results
              </h3>
              <p className="text-xs text-purple-700">
                {evalSummary.completed_evaluations_count} Evaluator(s) recorded scoring for this pilot project
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-purple-600 block">Overall Mean Score</span>
              <span className="text-2xl font-black text-purple-900">
                {evalSummary.avg_overall_score?.toFixed(1) || '—'} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-purple-50 rounded-xl">
              <span className="text-[10px] text-purple-700 font-semibold block">Technical</span>
              <span className="text-base font-bold text-purple-900">
                {evalSummary.avg_technical_score?.toFixed(1) || '—'}
              </span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <span className="text-[10px] text-purple-700 font-semibold block">KPI Benchmarks</span>
              <span className="text-base font-bold text-purple-900">
                {evalSummary.avg_kpi_score?.toFixed(1) || '—'}
              </span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <span className="text-[10px] text-purple-700 font-semibold block">Innovation</span>
              <span className="text-base font-bold text-purple-900">
                {evalSummary.avg_innovation_score?.toFixed(1) || '—'}
              </span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <span className="text-[10px] text-purple-700 font-semibold block">Feasibility</span>
              <span className="text-base font-bold text-purple-900">
                {evalSummary.avg_feasibility_score?.toFixed(1) || '—'}
              </span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <span className="text-[10px] text-purple-700 font-semibold block">Impact</span>
              <span className="text-base font-bold text-purple-900">
                {evalSummary.avg_impact_score?.toFixed(1) || '—'}
              </span>
            </div>
          </div>

          {evaluations && evaluations.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Evaluator Scorecards & Notes</h4>
              {evaluations.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Evaluator #{ev.evaluator_id} • Score: {ev.overall_score?.toFixed(1)} / 100
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.recommendation === 'RECOMMEND'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {ev.recommendation}
                    </span>
                  </div>
                  {ev.comments && <p className="text-slate-600 italic">"{ev.comments}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submission Evidence Review (If startup has submitted) */}
      {submission && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider">
                Startup Delivered Pilot Results & Telemetry
              </h3>
              <p className="text-xs text-slate-500">Submission ID #{submission.id} • Status: {submission.status}</p>
            </div>
            <Link
              to="/government/evaluations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            >
              Assign Evaluator →
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-1">Results Narrative</h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{submission.results}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Empirical KPI Results
              </h4>
              <StructuredDataViewer data={submission.kpi_results} type="kpi" emptyMessage="No structured KPI measurements reported." />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                Evidence & Telemetry Artifacts
              </h4>
              <StructuredDataViewer data={submission.evidence} type="evidence" emptyMessage="No external evidence documents attached." />
            </div>
          </div>
        </div>
      )}

      {/* Task & Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-gov-blue" /> Pilot Scope & Tasks
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{pilot.task_description}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Success Criteria
          </h3>
          <StructuredDataViewer data={pilot.success_criteria} type="criteria" emptyMessage="Demonstrate baseline improvements under sandbox conditions." />
        </div>
      </div>
    </div>
  );
};

export default GovernmentPilotDetailPage;
