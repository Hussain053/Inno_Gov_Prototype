import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck2,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import pilotService from '../../services/pilotService';
import { PilotSubmissionStatus } from '../../types';

export const StartupSubmissionsPage: React.FC = () => {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => submissionService.listSubmissions(),
  });

  const { data: pilots } = useQuery({
    queryKey: ['my-pilots'],
    queryFn: () => pilotService.listPilots(),
  });

  const getStatusBadge = (status: PilotSubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">DRAFT</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue">SUBMITTED</span>;
      case 'UNDER_EVALUATION':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 font-bold">UNDER EVALUATION</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 font-bold">ACCEPTED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">REVISE / REJECTED</span>;
    }
  };

  const getPilotTitle = (pilotId: number) => {
    const p = pilots?.find((item) => item.id === pilotId);
    return p?.title || `Pilot Project #${pilotId}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-gov-blue" />
          Pilot Submissions & Evidence Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review delivered milestone results, telemetry uploads, and technical panel evaluations.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading submissions...</p>
        </div>
      ) : submissions?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Submissions Recorded</h3>
          <p className="text-xs text-slate-500 mt-1">
            When you run an active pilot, submit your KPI results and evidence to see them tracked here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions?.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Submission #{sub.id}</span>
                  {getStatusBadge(sub.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {getPilotTitle(sub.pilot_id)}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {sub.results || 'Pilot evidence and metrics submitted.'}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Created: {new Date(sub.created_at).toLocaleDateString()}</span>
                  {sub.submitted_at && (
                    <span>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/startup/pilots/${sub.pilot_id}/submit`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-gov-blue bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <span>View Details & Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StartupSubmissionsPage;
