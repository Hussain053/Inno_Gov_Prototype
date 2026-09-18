import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Award,
  Sparkles,
} from 'lucide-react';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import submissionService from '../../services/submissionService';
import { EvaluatorAssignment } from '../../types';

export const EvaluatorAssignmentsPage: React.FC = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-evaluator-assignments'],
    queryFn: () => evaluatorAssignmentService.listAssignments(),
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-purple-600" />
          Assigned Pilot Submissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submissions assigned by government departments for empirical KPI evaluation and procurement recommendation.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading assigned submissions...</p>
        </div>
      ) : assignments?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Assignments Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            When government tender departments assign pilot submissions to your evaluator profile, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments?.map((assignment) => {
            const challengeTitle =
              assignment.pilot_submission?.pilot?.challenge?.title ||
              assignment.pilot_submission?.pilot?.title ||
              `Tender Challenge #${assignment.pilot_submission_id}`;
            const startupName =
              assignment.pilot_submission?.startup?.organization ||
              assignment.pilot_submission?.startup?.name ||
              `Startup #${assignment.pilot_submission?.startup_id || ''}`;
            const pilotTitle = assignment.pilot_submission?.pilot?.title;
            const subStatus = assignment.pilot_submission?.status || 'SUBMITTED';

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:border-purple-300 hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                      Assignment #{assignment.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        assignment.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Evaluation: {assignment.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      Status: {subStatus}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-purple-700 transition-colors">
                      {challengeTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-emerald-700">
                        Startup: <span className="font-bold text-slate-800">{startupName}</span>
                      </span>
                      {pilotTitle && pilotTitle !== challengeTitle && (
                        <span className="text-slate-500">
                          Pilot: <span className="text-slate-700 font-medium">{pilotTitle}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                    {assignment.completed_at && (
                      <span> • Completed: {new Date(assignment.completed_at).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/evaluator/evaluate/${assignment.pilot_submission_id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <span>
                      {assignment.status === 'COMPLETED' ? 'View Evaluation' : 'Perform Technical Evaluation'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvaluatorAssignmentsPage;
