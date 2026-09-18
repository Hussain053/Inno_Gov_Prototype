import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  Eye,
  FileCheck2,
  Building,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import { Pilot, PilotStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import PilotTimeline from '../../components/timeline/PilotTimeline';

export const GovernmentPilotsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: pilots, isLoading } = useQuery({
    queryKey: ['pilots-all'],
    queryFn: () => pilotService.listPilots(),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges-all'],
    queryFn: () => challengeService.listChallenges(),
  });

  const completePilotMutation = useMutation({
    mutationFn: (pilotId: number) => pilotService.completePilot(pilotId),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['pilots-all'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Pilot completed', `Pilot #${p.id} status transitioned to COMPLETED. Ready for procurement contracting.`);
    },
    onError: (err: any) => {
      error('Failed to complete pilot', err.response?.data?.detail || 'An error occurred');
    },
  });

  const getChallengeTitle = (challengeId: number) => {
    const ch = challenges?.find((c) => c.id === challengeId);
    return ch?.title || `Challenge Reference #${challengeId}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-gov-blue" />
            Sanctioned Pilots Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervise field trials, track telemetry deliverables, and approve pilot completion.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading pilot projects...</p>
        </div>
      ) : pilots?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <PlayCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Active Pilots</h3>
          <p className="text-xs text-slate-500 mt-1">
            Shortlist applications from the Applications Review screen to sanction pilots.
          </p>
          <Link
            to="/government/applications"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:underline"
          >
            Go to Applications Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
                    <span className="text-xs font-mono text-slate-400">{pilot.startup?.name || `Startup ID #${pilot.startup_id}`}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{pilot.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pilot.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => completePilotMutation.mutate(pilot.id)}
                      disabled={completePilotMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Pilot Completed
                    </button>
                  )}

                  <Link
                    to="/government/evaluations"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
                  >
                    <Award className="w-4 h-4 text-purple-600" /> Evaluations Panel
                  </Link>

                  <Link
                    to={`/government/pilots/${pilot.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Details
                  </Link>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{pilot.task_description}</p>

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

export default GovernmentPilotsPage;
