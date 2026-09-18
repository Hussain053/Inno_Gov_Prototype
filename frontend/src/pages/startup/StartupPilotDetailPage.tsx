import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  UploadCloud,
  FileText,
  Building,
  Target,
  Clock,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import submissionService from '../../services/submissionService';
import evaluationService from '../../services/evaluationService';
import contractService from '../../services/contractService';
import PilotTimeline from '../../components/timeline/PilotTimeline';
import StructuredDataViewer from '../../components/common/StructuredDataViewer';
import { useToast } from '../../context/ToastContext';

export const StartupPilotDetailPage: React.FC = () => {
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

  const { data: submissions } = useQuery({
    queryKey: ['pilot-submissions', pilotId],
    queryFn: () => submissionService.listSubmissions({ pilot_id: pilotId }),
    enabled: !!pilotId,
  });

  const existingSubmission = submissions?.[0];

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations-submission', existingSubmission?.id],
    queryFn: () => evaluationService.getEvaluationsBySubmission(existingSubmission!.id),
    enabled: !!existingSubmission?.id,
  });

  const { data: contracts } = useQuery({
    queryKey: ['contracts-pilot', pilotId],
    queryFn: () => contractService.listContracts({ pilot_id: pilotId }),
    enabled: !!pilotId,
  });

  const matchingContract = contracts?.find((c) => c.pilot_id === pilotId) || (contracts?.length === 1 && contracts[0].pilot_id === pilotId ? contracts[0] : undefined);

  const startMutation = useMutation({
    mutationFn: () => pilotService.startPilot(pilotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot', pilotId] });
      queryClient.invalidateQueries({ queryKey: ['my-pilots'] });
      success('Pilot started', 'Status transitioned to IN_PROGRESS.');
    },
    onError: (err: any) => {
      error('Failed to start pilot', err.response?.data?.detail || 'An error occurred');
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading pilot specifications...</p>
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Pilot Not Found</h3>
        <Link to="/startup/pilots" className="text-xs text-gov-blue hover:underline mt-2 inline-block">
          ← Back to Pilots
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/startup/pilots"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pilots List
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-gov-blue">
                PILOT #{pilot.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                STATUS: {pilot.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gov-navy">{pilot.title}</h1>
            <p className="text-xs text-slate-500">Associated Challenge: {challenge?.title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pilot.status === 'ASSIGNED' && (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" /> Start Pilot Deployment
              </button>
            )}

            {pilot.status === 'IN_PROGRESS' && (
              <Link
                to={`/startup/pilots/${pilot.id}/submit`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                {existingSubmission ? 'Update / View Submission' : 'Submit KPI Evidence'}
              </Link>
            )}
          </div>
        </div>

        {/* Timeline Dates */}
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
            <span className="text-slate-400 block text-[11px]">Sanction Date</span>
            <span className="font-semibold text-slate-800">{new Date(pilot.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Progress Timeline Synchronized With Verified Backend State */}
      <PilotTimeline
        applicationStatus="SHORTLISTED"
        pilotStatus={pilot.status}
        submissionStatus={existingSubmission?.status}
        hasEvaluations={evaluations && evaluations.length > 0}
        contractStatus={matchingContract?.status}
        isAwarded={matchingContract?.status === 'AWARDED' || matchingContract?.status === 'ACTIVE' || matchingContract?.status === 'COMPLETED'}
      />

      {/* Delivered Submission Evidence & KPI Artifacts (If submission exists) */}
      {existingSubmission && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider">
                Submitted Pilot Results &amp; Uploaded Evidence
              </h3>
              <p className="text-xs text-slate-500">
                Submission #{existingSubmission.id} • Status: <span className="font-bold text-emerald-700">{existingSubmission.status}</span>
              </p>
            </div>
            <Link
              to={`/startup/pilots/${pilot.id}/submit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-gov-blue hover:bg-blue-100 border border-blue-200"
            >
              Update / Edit Submission →
            </Link>
          </div>

          {existingSubmission.results && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-1">Results Narrative</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{existingSubmission.results}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Empirical KPI Results
              </h4>
              <StructuredDataViewer data={existingSubmission.kpi_results} type="kpi" emptyMessage="No structured KPI measurements recorded." />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                Uploaded Evidence &amp; Telemetry Files
              </h4>
              <StructuredDataViewer data={existingSubmission.evidence} type="evidence" emptyMessage="No external evidence documents attached." />
            </div>
          </div>
        </div>
      )}

      {/* Task Description & Success Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Target className="w-4 h-4 text-gov-blue" />
            Task Description &amp; Milestones
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {pilot.task_description}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Success Criteria
          </h3>
          <StructuredDataViewer data={pilot.success_criteria} type="criteria" emptyMessage="Demonstrate agreed baseline improvements under sandbox conditions." />
        </div>
      </div>

      {/* Requirements & Target KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
            Hardware / Operational Requirements
          </h3>
          <StructuredDataViewer data={pilot.requirements} type="requirements" emptyMessage="Follow standard government sandbox security guidelines." />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
            Mandatory Target KPIs
          </h3>
          <StructuredDataViewer data={pilot.kpis} type="kpi" emptyMessage="Benchmark telemetry to be recorded during field trial." />
        </div>
      </div>
    </div>
  );
};

export default StartupPilotDetailPage;
