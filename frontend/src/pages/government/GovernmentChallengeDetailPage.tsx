import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  ArrowLeft,
  Calendar,
  MapPin,
  IndianRupee,
  Sparkles,
  FileCheck2,
  Send,
  Users,
  Building,
  Download,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import challengeService from '../../services/challengeService';
import applicationService from '../../services/applicationService';
import { useToast } from '../../context/ToastContext';

export const GovernmentChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const challengeId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<number | ''>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeService.getChallenge(challengeId),
    enabled: !!challengeId,
  });

  const { data: applications } = useQuery({
    queryKey: ['applications-challenge', challengeId],
    queryFn: () => applicationService.listApplications({ challenge_id: challengeId }),
    enabled: !!challengeId,
  });

  const { data: evaluators = [] } = useQuery({
    queryKey: ['evaluators-list'],
    queryFn: () => challengeService.listEvaluators(),
  });

  const publishMutation = useMutation({
    mutationFn: () => challengeService.publishChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenges-all'] });
      success('Challenge published', 'Status changed to OPEN.');
    },
    onError: (err: any) => {
      error('Publish failed', err.response?.data?.detail || 'An error occurred');
    },
  });

  const assignEvaluatorMutation = useMutation({
    mutationFn: (evaluatorId: number) => challengeService.assignEvaluator(challengeId, evaluatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      success('Evaluator Assigned', 'Official evaluator assigned to this challenge tender.');
      setSelectedEvaluatorId('');
    },
    onError: (err: any) => {
      error('Assignment failed', err.response?.data?.detail || 'Could not assign evaluator');
    },
  });

  const handleDownloadPdf = async () => {
    if (!challenge) return;
    try {
      setDownloadingPdf(true);
      const blob = await challengeService.downloadTenderPdf(challenge.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tender-Notice-Challenge-${challenge.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Tender PDF Downloaded', `Tender Notice for Challenge #${challenge.id} saved.`);
    } catch (err: any) {
      error('Download Failed', err.response?.data?.detail || 'Could not download tender specification PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading challenge tender details...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Challenge Not Found</h3>
        <Link to="/government/challenges" className="text-xs text-gov-blue hover:underline mt-2 inline-block">
          ← Back to Challenges
        </Link>
      </div>
    );
  }

  const assignedEvaluator = challenge.requirements?.assigned_evaluator;
  const kpis = challenge.kpis || {};
  const requirements = challenge.requirements || {};

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/government/challenges"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Challenges
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-gov-blue uppercase tracking-wider">
                {challenge.category || 'Tender Notice'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  challenge.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                STATUS: {challenge.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">Tender Ref #{challenge.id}</span>
            </div>

            <h1 className="text-2xl font-black text-gov-navy">{challenge.title}</h1>
            <p className="text-xs text-slate-500">
              Applications received: <strong className="text-slate-800 font-bold">{applications?.length || 0}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingPdf ? 'Generating PDF...' : 'Download Tender PDF'}
            </button>

            {challenge.status === 'DRAFT' && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Publish Challenge (OPEN)
              </button>
            )}

            <Link
              to={`/government/matching/${challenge.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Startup Match Engine
            </Link>

            <Link
              to={`/government/challenges/${challenge.id}/applications`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FileCheck2 className="w-3.5 h-3.5" /> Review Applications ({applications?.length || 0})
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Pilot Grant Budget</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              ₹{challenge.budget ? Number(challenge.budget).toLocaleString('en-IN') : 'Grant Allocated'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Deployment Location</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{challenge.location || 'Pan-India'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Application Deadline</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{challenge.application_deadline || 'Rolling'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Created At</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{new Date(challenge.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Problem & Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Core Problem Statement
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{challenge.problem_statement}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gov-blue" />
            Description & Scope of Work
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{challenge.description}</p>
        </div>
      </div>

      {/* Requirements & Target KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requirements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gov-blue" />
            Eligibility & Technical Criteria
          </h3>
          <div className="space-y-2">
            {Object.entries(requirements)
              .filter(([k]) => k !== 'assigned_evaluator')
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            {Object.keys(requirements).filter((k) => k !== 'assigned_evaluator').length === 0 && (
              <p className="text-xs text-slate-400 italic">No specific eligibility constraints specified.</p>
            )}
          </div>
        </div>

        {/* Target KPIs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Target Empirical Pilot KPIs
          </h3>
          <div className="space-y-2">
            {Object.entries(kpis).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                <span className="font-semibold text-emerald-950 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
            {Object.keys(kpis).length === 0 && (
              <p className="text-xs text-slate-400 italic">No specific KPI benchmarks specified.</p>
            )}
          </div>
        </div>
      </div>

      {/* Evaluator Assignment Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" />
            Official Evaluator Assignment
          </h3>
          {assignedEvaluator ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Evaluator Assigned
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Pending Evaluator
            </span>
          )}
        </div>

        {assignedEvaluator ? (
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">Assigned Evaluator Officer</span>
              <p className="text-sm font-bold text-slate-900">{assignedEvaluator.name}</p>
              <p className="text-xs text-slate-500">{assignedEvaluator.organization || assignedEvaluator.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-purple-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Assigned Date</span>
                <span className="font-semibold text-slate-700">
                  {assignedEvaluator.assigned_at ? new Date(assignedEvaluator.assigned_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="text-xs text-slate-600">
              Select an authorized Evaluator from the official technical panel to perform due diligence, verify empirical pilot evidence, and submit scored recommendations.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={selectedEvaluatorId}
                onChange={(e) => setSelectedEvaluatorId(e.target.value ? parseInt(e.target.value) : '')}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium"
              >
                <option value="">-- Choose Evaluator Officer --</option>
                {evaluators.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.organization || ev.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedEvaluatorId || assignEvaluatorMutation.isPending}
                onClick={() => {
                  if (typeof selectedEvaluatorId === 'number') {
                    assignEvaluatorMutation.mutate(selectedEvaluatorId);
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {assignEvaluatorMutation.isPending ? 'Assigning...' : 'Assign Evaluator'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernmentChallengeDetailPage;

