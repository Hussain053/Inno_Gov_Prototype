import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Sparkles,
  Sliders,
  Send,
  MessageSquare,
  Building,
  Target,
  FileText,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import pilotService from '../../services/pilotService';
import startupService from '../../services/startupService';
import evaluationService, { EvaluationCreateParams } from '../../services/evaluationService';
import { EvaluationRecommendation } from '../../types';
import StructuredDataViewer from '../../components/common/StructuredDataViewer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const EvaluatorWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [downloadingFileKey, setDownloadingFileKey] = useState<string | null>(null);

  const { data: submission, isLoading: subLoading, error: subError } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionService.getSubmission(submissionId),
    enabled: !!submissionId,
  });

  const { data: pilot } = useQuery({
    queryKey: ['pilot', submission?.pilot_id],
    queryFn: () => pilotService.getPilot(submission!.pilot_id),
    enabled: !!submission?.pilot_id,
  });

  const { data: startupProfile } = useQuery({
    queryKey: ['startup-profile', submission?.startup_id],
    queryFn: () => startupService.getStartupProfile(submission!.startup_id),
    enabled: !!submission?.startup_id,
  });

  const { data: existingEvaluations } = useQuery({
    queryKey: ['evaluations-submission', submissionId],
    queryFn: () => evaluationService.getEvaluationsBySubmission(submissionId),
    enabled: !!submissionId,
  });

  const myEvaluation = existingEvaluations?.find((ev) => ev.evaluator_id === user?.id) || existingEvaluations?.[0];

  // Scoring states (0-100)
  const [technicalScore, setTechnicalScore] = useState<number>(85);
  const [kpiScore, setKpiScore] = useState<number>(85);
  const [innovationScore, setInnovationScore] = useState<number>(85);
  const [feasibilityScore, setFeasibilityScore] = useState<number>(85);
  const [impactScore, setImpactScore] = useState<number>(85);
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState<EvaluationRecommendation>('RECOMMEND');

  useEffect(() => {
    if (myEvaluation) {
      if (myEvaluation.technical_score !== undefined && myEvaluation.technical_score !== null) {
        setTechnicalScore(Number(myEvaluation.technical_score));
      }
      if (myEvaluation.kpi_score !== undefined && myEvaluation.kpi_score !== null) {
        setKpiScore(Number(myEvaluation.kpi_score));
      }
      if (myEvaluation.innovation_score !== undefined && myEvaluation.innovation_score !== null) {
        setInnovationScore(Number(myEvaluation.innovation_score));
      }
      if (myEvaluation.feasibility_score !== undefined && myEvaluation.feasibility_score !== null) {
        setFeasibilityScore(Number(myEvaluation.feasibility_score));
      }
      if (myEvaluation.impact_score !== undefined && myEvaluation.impact_score !== null) {
        setImpactScore(Number(myEvaluation.impact_score));
      }
      if (myEvaluation.comments) setComments(myEvaluation.comments);
      if (myEvaluation.recommendation) setRecommendation(myEvaluation.recommendation);
    }
  }, [myEvaluation]);

  // Dynamically compute overall score
  const overallScore = (
    (technicalScore + kpiScore + innovationScore + feasibilityScore + impactScore) / 5
  ).toFixed(1);

  const isCompleted = myEvaluation?.status === 'COMPLETED';

  const handleDownloadFile = async (key: string, fileUrlOrName: string, originalName?: string) => {
    try {
      setDownloadingFileKey(key);
      await submissionService.downloadOrViewFile(fileUrlOrName, originalName);
      success('Evidence Downloaded', `Successfully fetched ${originalName || 'file'}`);
    } catch (err: any) {
      error('Download Failed', err.response?.data?.detail || 'Could not download evidence document');
    } finally {
      setDownloadingFileKey(null);
    }
  };

  const evaluateMutation = useMutation({
    mutationFn: async (data: EvaluationCreateParams) => {
      // 1. Create evaluation (or update if pending)
      let evalObj;
      if (myEvaluation && myEvaluation.status === 'PENDING') {
        evalObj = await evaluationService.updateEvaluation(myEvaluation.id, {
          technical_score: data.technical_score,
          kpi_score: data.kpi_score,
          innovation_score: data.innovation_score,
          feasibility_score: data.feasibility_score,
          impact_score: data.impact_score,
          comments: data.comments,
          recommendation: data.recommendation,
        });
      } else {
        evalObj = await evaluationService.createEvaluation(data);
      }

      // 2. Complete evaluation to make scorecard official
      return await evaluationService.completeEvaluation(evalObj.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations-submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['my-evaluator-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['evaluator-dashboard'] });
      success('Evaluation certified & recorded', 'Official scorecard and recommendation submitted to the Government Department.');
      navigate('/evaluator/history');
    },
    onError: (err: any) => {
      error('Evaluation submission failed', err.response?.data?.detail || err.message || 'An error occurred during evaluation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    evaluateMutation.mutate({
      pilot_submission_id: submissionId,
      technical_score: technicalScore,
      kpi_score: kpiScore,
      innovation_score: innovationScore,
      feasibility_score: feasibilityScore,
      impact_score: impactScore,
      comments,
      recommendation,
    });
  };

  if (subLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading submission deliverables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/evaluator/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assignments
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-slate-400">SUBMISSION #{submissionId}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {isCompleted ? 'EVALUATION COMPLETED' : 'SCORING IN PROGRESS'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gov-navy">Technical Evaluation Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilot Ref #{submission?.pilot_id} • Startup ID #{submission?.startup_id}
          </p>
        </div>

        {/* Dynamic Overall Score Counter */}
        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">Computed Overall Score</span>
            <span className="text-2xl font-black text-purple-900">{overallScore} / 100</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {submission?.status === 'DRAFT' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold">Startup Deliverable in Preparation (DRAFT)</p>
            <p className="text-amber-700">
              The startup has created this submission record but has not finalized delivery yet. You can inspect preliminary details, and submit your official certified score once the startup clicks Submit.
            </p>
          </div>
        </div>
      )}

      {/* Submission Deliverables Review */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-5">
        <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-gov-blue" />
          Startup Pilot Deliverables & Empirical Evidence
        </h3>

        {/* Narrative */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Field Trial Results Narrative
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {submission?.results || 'No detailed narrative submitted.'}
          </p>
        </div>

        {/* KPI Telemetry Scorecard */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Empirical KPI Measurements & Achievement
          </h4>

          {submission?.kpi_results && Object.keys(submission.kpi_results).length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">KPI Metric</th>
                    <th className="px-3.5 py-2.5">Measured Startup Result</th>
                    <th className="px-3.5 py-2.5">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {Object.entries(submission.kpi_results).map(([kpiName, val]: [string, any]) => (
                    <tr key={kpiName} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2 text-slate-800 font-semibold capitalize">
                        {kpiName.replace(/_/g, ' ')}
                      </td>
                      <td className="px-3.5 py-2 text-emerald-700 font-bold font-mono">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                      <td className="px-3.5 py-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          VERIFIED LOG
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 italic border border-slate-200">
              No structured KPI telemetry reported.
            </div>
          )}
        </div>

        {/* Attached Evidence Files */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            Uploaded Empirical Audit Files & Datasets
          </h4>
          <StructuredDataViewer data={submission?.evidence} type="evidence" emptyMessage="No external evidence files uploaded." />
        </div>
      </div>

      {/* Startup Profile Context */}
      {startupProfile && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider">
                Assigned Startup Profile: {startupProfile.company_name}
              </h3>
            </div>
            {startupProfile.industry && (
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700">
                {startupProfile.industry}
              </span>
            )}
          </div>
          {startupProfile.description && (
            <p className="text-xs text-slate-600 leading-relaxed">{startupProfile.description}</p>
          )}
          {startupProfile.experience && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Track Record & Experience:</span>
              <p className="text-slate-600">{startupProfile.experience}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            {startupProfile.location && <span>📍 {startupProfile.location}</span>}
            {startupProfile.team_size && <span>👥 Team Size: {startupProfile.team_size}</span>}
            {startupProfile.website && (
              <a
                href={startupProfile.website}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 hover:underline"
              >
                🌐 {startupProfile.website}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Pilot Objectives & Success Criteria (For Evaluator Context) */}
      {pilot && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Original Pilot Sanction Specification
          </h3>
          <p className="text-xs text-slate-700 font-semibold">{pilot.title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{pilot.task_description}</p>
        </div>
      )}

      {/* Evaluator Multi-Dimension Scoring Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-6">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            Evaluation Criteria Scoring (0–100 Scale)
          </h3>

          <div className="space-y-5">
            {/* 1. Technical Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">1. Technical Excellence & Architectural Soundness</span>
                <span className="font-bold text-purple-700">{technicalScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={technicalScore}
                onChange={(e) => setTechnicalScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 2. KPI Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">2. KPI Benchmark Achievement & Telemetry Verification</span>
                <span className="font-bold text-purple-700">{kpiScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={kpiScore}
                onChange={(e) => setKpiScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 3. Innovation Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">3. Technological Innovation & IP Novelty</span>
                <span className="font-bold text-purple-700">{innovationScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={innovationScore}
                onChange={(e) => setInnovationScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 4. Feasibility Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">4. Operational Feasibility & Deployment Readiness</span>
                <span className="font-bold text-purple-700">{feasibilityScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={feasibilityScore}
                onChange={(e) => setFeasibilityScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 5. Public Impact Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">5. Public Sector Impact & Socio-Economic Value</span>
                <span className="font-bold text-purple-700">{impactScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={impactScore}
                onChange={(e) => setImpactScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Recommendation Selection */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Procurement Recommendation *
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                disabled={isCompleted}
                onClick={() => setRecommendation('RECOMMEND')}
                className={`p-3 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  recommendation === 'RECOMMEND'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                RECOMMEND FOR SCALE
              </button>

              <button
                type="button"
                disabled={isCompleted}
                onClick={() => setRecommendation('DO_NOT_RECOMMEND')}
                className={`p-3 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  recommendation === 'DO_NOT_RECOMMEND'
                    ? 'border-red-500 bg-red-50 text-red-800 ring-2 ring-red-500/20 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                DO NOT RECOMMEND
              </button>
            </div>
          </div>

          {/* Qualitative Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Evaluator Panel Comments & Notes
            </label>
            <textarea
              rows={3}
              required
              disabled={isCompleted}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide structured qualitative feedback on test performance, reliability, and deployment risk..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none leading-relaxed disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Action Button */}
        {!isCompleted && (
          <div className="flex items-center justify-end gap-3">
            <Link
              to="/evaluator/assignments"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={evaluateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {evaluateMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Certified Evaluation
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EvaluatorWorkspacePage;
