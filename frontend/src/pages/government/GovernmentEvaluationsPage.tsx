import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  UserCheck,
  FileCheck2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileSignature,
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import evaluationService from '../../services/evaluationService';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import adminService from '../../services/adminService';
import pilotService from '../../services/pilotService';
import StructuredDataViewer from '../../components/common/StructuredDataViewer';
import { useToast } from '../../context/ToastContext';
import { PilotSubmission, User } from '../../types';

export const GovernmentEvaluationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [assigningSubmissionId, setAssigningSubmissionId] = useState<number | null>(null);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<number | ''>('');

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['government-submissions'],
    queryFn: () => submissionService.listSubmissions(),
  });

  const { data: pilots } = useQuery({
    queryKey: ['government-pilots-list'],
    queryFn: () => pilotService.listPilots(),
  });

  const { data: evaluators } = useQuery({
    queryKey: ['evaluators-list'],
    queryFn: () => evaluatorAssignmentService.listEvaluators(),
  });

  const { data: assignments } = useQuery({
    queryKey: ['evaluator-assignments'],
    queryFn: () => evaluatorAssignmentService.listAssignments(),
  });

  const { data: evalSummary } = useQuery({
    queryKey: ['evaluation-summary', selectedSubmissionId],
    queryFn: () => evaluationService.getEvaluationSummary(selectedSubmissionId!),
    enabled: !!selectedSubmissionId,
  });

  const { data: evaluationsList } = useQuery({
    queryKey: ['evaluations-submission', selectedSubmissionId],
    queryFn: () => evaluationService.getEvaluationsBySubmission(selectedSubmissionId!),
    enabled: !!selectedSubmissionId,
  });

  const assignMutation = useMutation({
    mutationFn: (data: { pilot_submission_id: number; evaluator_id: number }) =>
      evaluatorAssignmentService.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluator-assignments'] });
      success('Evaluator assigned', 'The independent evaluator has been notified to score this submission.');
      setAssigningSubmissionId(null);
      setSelectedEvaluatorId('');
    },
    onError: (err: any) => {
      error('Assignment failed', err.response?.data?.detail || 'Could not assign evaluator');
    },
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSubmissionId || !selectedEvaluatorId) {
      error('Selection required', 'Please select an evaluator');
      return;
    }
    assignMutation.mutate({
      pilot_submission_id: assigningSubmissionId,
      evaluator_id: Number(selectedEvaluatorId),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Independent Technical Evaluations & Scoring Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign accredited domain evaluators to pilot submissions and review empirical scoring summaries.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading submissions...</p>
        </div>
      ) : submissions?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Submissions Available for Evaluation</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once startups submit their pilot results and telemetry evidence, they will appear here for panel evaluation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List Column */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pilot Deliverables ({submissions?.length})
            </h3>

            {submissions?.map((sub) => {
              const isSelected = selectedSubmissionId === sub.id;
              const subAssignments = assignments?.filter((a) => a.pilot_submission_id === sub.id) || [];
              const pilot = pilots?.find((p) => p.id === sub.pilot_id);
              const challengeTitle = pilot?.challenge?.title || pilot?.title || `Pilot Deliverable #${sub.pilot_id}`;
              const startupName = pilot?.startup?.organization || pilot?.startup?.name || sub.startup?.name || `Startup #${sub.startup_id}`;

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmissionId(sub.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">SUBMISSION #{sub.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'UNDER_EVALUATION'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {challengeTitle}
                  </h4>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Startup: <span className="text-slate-700 font-medium">{startupName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{sub.results}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Evaluators: {subAssignments.length}</span>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/government/pilots/${sub.pilot_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-gov-blue font-bold hover:underline"
                      >
                        Open Pilot →
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssigningSubmissionId(sub.id);
                        }}
                        className="text-xs text-purple-700 font-bold hover:underline"
                      >
                        + Assign
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evaluation Details & Summary Workspace */}
          <div className="lg:col-span-2 space-y-4">
            {/* Modal / In-line assign box */}
            {assigningSubmissionId && (
              <div className="bg-white rounded-2xl border-2 border-purple-300 p-5 shadow-elevated">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gov-navy flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    Assign Domain Evaluator to Submission #{assigningSubmissionId}
                  </h4>
                  <button
                    onClick={() => setAssigningSubmissionId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕ Cancel
                  </button>
                </div>

                <form onSubmit={handleAssignSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Accredited Evaluator Panelist
                    </label>
                    <select
                      required
                      value={selectedEvaluatorId}
                      onChange={(e) => setSelectedEvaluatorId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                    >
                      <option value="">-- Choose Evaluator --</option>
                      {evaluators?.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} ({ev.organization || ev.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={assignMutation.isPending}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {selectedSubmissionId ? (
              <div className="space-y-4">
                {/* Aggregated Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 uppercase">
                        AGGREGATED EVALUATION SUMMARY
                      </span>
                      <h3 className="text-lg font-bold text-gov-navy mt-1">
                        Evaluation Results for Submission #{selectedSubmissionId}
                      </h3>
                    </div>

                    <Link
                      to="/government/contracts"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <FileSignature className="w-4 h-4" /> Finalize Procurement Contract
                    </Link>
                  </div>

                  {evalSummary && evalSummary.completed_evaluations_count > 0 ? (
                    <div className="space-y-4">
                      {/* Big Average Overall Score */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                          <span className="text-[10px] uppercase font-bold text-purple-700">Average Overall Score</span>
                          <p className="text-3xl font-black text-purple-900 mt-1">
                            {evalSummary.avg_overall_score?.toFixed(1) ?? 'N/A'}/100
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Evaluations Completed</span>
                          <p className="text-3xl font-black text-slate-800 mt-1">
                            {evalSummary.completed_evaluations_count}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <span className="text-[10px] uppercase font-bold text-emerald-700">Recommended</span>
                          <p className="text-3xl font-black text-emerald-900 mt-1">
                            {evalSummary.recommendations_breakdown?.['RECOMMEND'] || 0}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                          <span className="text-[10px] uppercase font-bold text-red-700">Not Recommended</span>
                          <p className="text-3xl font-black text-red-900 mt-1">
                            {evalSummary.recommendations_breakdown?.['DO_NOT_RECOMMEND'] || 0}
                          </p>
                        </div>
                      </div>

                      {/* Dimension averages */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Average Dimension Breakdown
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Technical</span>
                            <span className="font-bold text-slate-800">{evalSummary.avg_technical_score?.toFixed(1) || '—'} / 100</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">KPI Outcomes</span>
                            <span className="font-bold text-slate-800">{evalSummary.avg_kpi_score?.toFixed(1) || '—'} / 100</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Innovation</span>
                            <span className="font-bold text-slate-800">{evalSummary.avg_innovation_score?.toFixed(1) || '—'} / 100</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Feasibility</span>
                            <span className="font-bold text-slate-800">{evalSummary.avg_feasibility_score?.toFixed(1) || '—'} / 100</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Public Impact</span>
                            <span className="font-bold text-slate-800">{evalSummary.avg_impact_score?.toFixed(1) || '—'} / 100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">No completed evaluations for this submission yet.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ensure an evaluator is assigned above to begin technical scoring.
                      </p>
                    </div>
                  )}
                </div>

                {/* Individual Evaluations Feed */}
                {evaluationsList && evaluationsList.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Individual Evaluator Scorecards
                    </h4>
                    {evaluationsList.map((ev) => (
                      <div key={ev.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">
                            {ev.evaluator?.name || `Evaluator #${ev.evaluator_id}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.recommendation === 'RECOMMEND'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {ev.recommendation} • Overall {ev.overall_score}/100
                          </span>
                        </div>
                        {ev.comments && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                            "{ev.comments}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Deliverables & Evidence Review */}
                {submissions?.find((s) => s.id === selectedSubmissionId) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-blue-600" />
                      Startup Delivered Evidence & Telemetry Files
                    </h4>
                    <StructuredDataViewer
                      data={submissions.find((s) => s.id === selectedSubmissionId)?.evidence}
                      type="evidence"
                      emptyMessage="No external evidence documents attached to this deliverable."
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <Award className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">Select a Submission on the Left</h4>
                <p className="text-xs text-slate-400 mt-1">
                  View aggregated evaluator scores and panel recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentEvaluationsPage;
