import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Send,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import challengeService from '../../services/challengeService';
import { Application, ApplicationStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

export const StartupApplicationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationService.listApplications(),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges-all'],
    queryFn: () => challengeService.listChallenges(),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => applicationService.submitApplication(id),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      success('Application submitted', `Application #${app.id} is now SUBMITTED to Government for review.`);
    },
    onError: (err: any) => {
      error('Submission failed', err.response?.data?.detail || 'Could not submit application');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: number) => applicationService.withdrawApplication(id),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      success('Application withdrawn', `Application #${app.id} has been withdrawn.`);
    },
    onError: (err: any) => {
      error('Withdrawal failed', err.response?.data?.detail || 'Could not withdraw application');
    },
  });

  const respondInviteMutation = useMutation({
    mutationFn: ({ appId, action }: { appId: number; action: 'ACCEPT' | 'REJECT' }) =>
      applicationService.respondToInvite(appId, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      if (variables.action === 'ACCEPT') {
        success('Invitation Accepted', 'Application submitted to government for pilot consideration.');
      } else {
        success('Invitation Declined', 'Tender invitation declined.');
      }
    },
    onError: (err: any) => {
      error('Action failed', err.response?.data?.detail || 'Could not update invitation response');
    },
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'INVITED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" /> INVITATION RECEIVED
          </span>
        );
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-200">SUBMITTED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">UNDER REVIEW</span>;
      case 'SHORTLISTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">SHORTLISTED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">NOT SELECTED</span>;
      case 'WITHDRAWN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">WITHDRAWN</span>;
    }
  };

  const getChallengeTitle = (challengeId: number) => {
    const ch = challenges?.find((c) => c.id === challengeId);
    return ch?.title || `Challenge Reference #${challengeId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-gov-blue" />
            My Tender Applications &amp; Invitations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track submission status, government invitations, review stages, and pilot shortlisting decisions.
          </p>
        </div>
        <Link
          to="/startup/challenges"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <span>Find New Challenges</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading your applications...</p>
        </div>
      ) : applications?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Applications Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            You haven't submitted any applications or received any challenge invitations.
          </p>
          <div className="mt-4">
            <Link
              to="/startup/challenges"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:underline"
            >
              Browse Open Challenges <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications?.map((app) => (
            <div
              key={app.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                app.status === 'INVITED'
                  ? 'border-purple-300 ring-2 ring-purple-100 bg-purple-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">App #{app.id}</span>
                  {getStatusBadge(app.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {getChallengeTitle(app.challenge_id)}
                </h3>
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                  {app.submitted_at && (
                    <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Action buttons based on state */}
              <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                {app.status === 'INVITED' && (
                  <>
                    <button
                      onClick={() => respondInviteMutation.mutate({ appId: app.id, action: 'ACCEPT' })}
                      disabled={respondInviteMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept Invitation
                    </button>
                    <button
                      onClick={() => respondInviteMutation.mutate({ appId: app.id, action: 'REJECT' })}
                      disabled={respondInviteMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Decline
                    </button>
                  </>
                )}

                {app.status === 'DRAFT' && (
                  <button
                    onClick={() => submitMutation.mutate(app.id)}
                    disabled={submitMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit to Government
                  </button>
                )}

                {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(app.status) && (
                  <button
                    onClick={() => withdrawMutation.mutate(app.id)}
                    disabled={withdrawMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Withdraw
                  </button>
                )}

                {app.status === 'SHORTLISTED' && (
                  <Link
                    to="/startup/pilots"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> View Active Pilot Track
                  </Link>
                )}

                <Link
                  to={`/startup/challenges/${app.challenge_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  View Challenge Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StartupApplicationsPage;
