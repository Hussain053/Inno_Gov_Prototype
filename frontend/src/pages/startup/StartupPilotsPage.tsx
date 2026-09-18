import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import { Pilot, PilotStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import PilotTimeline from '../../components/timeline/PilotTimeline';

export const StartupPilotsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: pilots, isLoading } = useQuery({
    queryKey: ['my-pilots'],
    queryFn: () => pilotService.listPilots(),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges-all'],
    queryFn: () => challengeService.listChallenges(),
  });

  const startPilotMutation = useMutation({
    mutationFn: (id: number) => pilotService.startPilot(id),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['my-pilots'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      success('Pilot started', `Pilot #${p.id} status transitioned to IN_PROGRESS. Telemetry recording initiated.`);
    },
    onError: (err: any) => {
      error('Failed to start pilot', err.response?.data?.detail || 'Could not start pilot');
    },
  });

  const getChallengeTitle = (challengeId: number) => {
    const ch = challenges?.find((c) => c.id === challengeId);
    return ch?.title || `Challenge #${challengeId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-gov-blue" />
          Sanctioned Pilot Deployments
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized sandbox pilots with government departments under SIH milestone agreements.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading pilots...</p>
        </div>
      ) : pilots?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <PlayCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Pilot Projects Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once a government department shortlists your application, a pilot agreement will be assigned here for execution.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pilots?.map((pilot) => (
            <div key={pilot.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-gov-blue">
                      PILOT #{pilot.id} • {pilot.status}
                    </span>
                    <span className="text-xs text-slate-500">{getChallengeTitle(pilot.challenge_id)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{pilot.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pilot.status === 'ASSIGNED' && (
                    <button
                      onClick={() => startPilotMutation.mutate(pilot.id)}
                      disabled={startPilotMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <PlayCircle className="w-4 h-4" /> Start Pilot Deployment
                    </button>
                  )}

                  {pilot.status === 'IN_PROGRESS' && (
                    <Link
                      to={`/startup/pilots/${pilot.id}/submit`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <UploadCloud className="w-4 h-4" /> Submit KPI Evidence
                    </Link>
                  )}

                  <Link
                    to={`/startup/pilots/${pilot.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pilot Description */}
              <p className="text-xs text-slate-600 leading-relaxed">{pilot.task_description}</p>

              {/* Timeline Stepper */}
              <PilotTimeline
                applicationStatus="SHORTLISTED"
                pilotStatus={pilot.status}
                submissionStatus={pilot.submission?.status}
                hasEvaluations={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StartupPilotsPage;
