import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  PlayCircle,
  Building,
  ArrowRight,
  Filter,
  UserCheck,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import challengeService from '../../services/challengeService';
import startupService from '../../services/startupService';
import { Application, ApplicationStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

export const GovernmentApplicationsReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();

  const challengeId = id ? parseInt(id || '0') : undefined;
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['government-applications'],
    queryFn: () => applicationService.listApplications(),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges-all'],
    queryFn: () => challengeService.listChallenges(),
  });

  const { data: selectedChallenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeService.getChallenge(challengeId!),
    enabled: !!challengeId,
  });

  const markUnderReviewMutation = useMutation({
    mutationFn: (appId: number) => applicationService.updateStatus(appId, 'UNDER_REVIEW'),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ['government-applications'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Application status updated', `Application #${app.id} moved to UNDER REVIEW.`);
    },
    onError: (err: any) => {
      error('Update failed', err.response?.data?.detail || 'Could not update status');
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: async ({ appId, currentStatus }: { appId: number; currentStatus: ApplicationStatus }) => {
      return await applicationService.shortlistApplication(appId, currentStatus);
    },
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ['government-applications'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Startup shortlisted', `Application #${app.id} has been shortlisted. Ready to assign pilot project.`);
    },
    onError: (err: any) => {
      error('Shortlisting failed', err.response?.data?.detail || 'Could not shortlist application');
    },
  });

  const getChallengeTitle = (challengeId: number) => {
    const ch = challenges?.find((c) => c.id === challengeId);
    return ch?.title || `Challenge #${challengeId}`;
  };

  const filteredApps = applications?.filter((app) => {
    if (challengeId && app.challenge_id !== challengeId) return false;
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-gov-blue" />
            {selectedChallenge ? `Tender Applications Review — ${selectedChallenge.title}` : 'Tender Applications Review'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {selectedChallenge
              ? `Review applications received for ${selectedChallenge.title}.`
              : 'Review startup proposals, conduct due diligence, and shortlist qualified candidates for pilot trials.'}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none"
          >
            <option value="ALL">All Applications</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading received applications...</p>
        </div>
      ) : filteredApps?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Applications Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no applications matching the selected status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps?.map((app) => (
            <div
              key={app.id}
              className={`bg-white rounded-2xl border p-6 shadow-card transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                app.status === 'SHORTLISTED'
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : app.status === 'UNDER_REVIEW'
                  ? 'border-amber-200 bg-amber-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">App #{app.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === 'SHORTLISTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : app.status === 'SUBMITTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {app.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {app.startup_name || `Startup ID #${app.startup_id}`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {app.challenge_title || getChallengeTitle(app.challenge_id)}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                  {app.submitted_at && (
                    <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                {app.status === 'SUBMITTED' && (
                  <button
                    onClick={() => markUnderReviewMutation.mutate(app.id)}
                    disabled={markUnderReviewMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" /> Move to Under Review
                  </button>
                )}

                {['SUBMITTED', 'UNDER_REVIEW'].includes(app.status) && (
                  <button
                    onClick={() =>
                      shortlistMutation.mutate({ appId: app.id, currentStatus: app.status })
                    }
                    disabled={shortlistMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Shortlist Startup
                  </button>
                )}

                {app.status === 'SHORTLISTED' && (
                  <Link
                    to={`/government/pilots/create?application_id=${app.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Create Pilot Project
                  </Link>
                )}

                <Link
                  to={`/government/matching/${app.challenge_id}`}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Match
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentApplicationsReviewPage;
