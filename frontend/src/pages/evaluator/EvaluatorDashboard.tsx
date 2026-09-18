import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Award,
  Clock,
  CheckCircle2,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import { useAuth } from '../../context/AuthContext';

export const EvaluatorDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['evaluator-dashboard'],
    queryFn: dashboardService.getEvaluatorDashboard,
  });

  const { data: assignments } = useQuery({
    queryKey: ['my-evaluator-assignments'],
    queryFn: () => evaluatorAssignmentService.listAssignments(),
  });

  const pendingAssignments = assignments?.filter((a) => a.status !== 'COMPLETED') || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gov-navy">
              Evaluator Panel: {user?.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Accredited Panelist
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Independent Technical Evaluation Workspace • Evidence-based scoring and procurement recommendations
          </p>
        </div>

        <Link
          to="/evaluator/assignments"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
        >
          <span>View Assigned Submissions</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Evaluations</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.evaluations_pending ?? pendingAssignments.length}
          </p>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Awaiting scoring</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.evaluations_completed ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Certified evaluations</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score Awarded</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.average_overall_score ? `${metrics.average_overall_score.toFixed(1)}/100` : '—'}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Multi-dimension mean</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-gov-blue flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.submissions_available_for_evaluation ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">In system backlog</span>
        </div>
      </div>

      {/* Pending Evaluations Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gov-navy">Pending KPI Reviews & Scoring</h3>
            <p className="text-xs text-slate-500">Government has assigned these pilot submissions for independent scoring</p>
          </div>
          <Link
            to="/evaluator/assignments"
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
          >
            All assignments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingAssignments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">All Assigned Evaluations Completed!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              New submissions will appear here when government assigns them to your profile.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Assignment #{assignment.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                      {assignment.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      Submission Ref #{assignment.pilot_submission_id}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    Pilot Submission #{assignment.pilot_submission_id}
                  </h4>
                  <span className="text-[11px] text-slate-400 block">
                    Assigned on: {new Date(assignment.assigned_at).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  to={`/evaluator/evaluate/${assignment.pilot_submission_id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <span>Evaluate Submission</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluatorDashboard;
