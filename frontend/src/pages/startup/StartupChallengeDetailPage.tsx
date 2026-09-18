import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  ArrowLeft,
  Calendar,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  FileCheck2,
  AlertCircle,
  Building,
  Target,
  Download,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import challengeService from '../../services/challengeService';
import applicationService from '../../services/applicationService';
import matchingService from '../../services/matchingService';
import { useToast } from '../../context/ToastContext';

export const StartupChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const challengeId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeService.getChallenge(challengeId),
    enabled: !!challengeId,
  });

  const {
    data: matchResult,
    isLoading: isLoadingMatchResult,
    error: matchError,
  } = useQuery({
    queryKey: ['challenge-match', challengeId],
    queryFn: () => matchingService.matchStartupToChallenge(challengeId),
    enabled: !!challengeId,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const { data: myApplications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationService.listApplications(),
  });

  const existingApplication = myApplications?.find((a) => a.challenge_id === challengeId);

  const applyMutation = useMutation({
    mutationFn: () => applicationService.createApplication(challengeId),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      success('Application drafted', `Application #${app.id} created successfully.`);
      navigate('/startup/applications');
    },
    onError: (err: any) => {
      error('Application failed', err.response?.data?.detail || 'Could not apply for this challenge');
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
      a.download = `Tender-Specification-Notice-${challenge.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Tender Notice Downloaded', `Official PDF saved for Challenge #${challenge.id}`);
    } catch (err: any) {
      error('Download Failed', err.response?.data?.detail || 'Could not download tender PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading challenge details...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Challenge Not Found</h3>
        <Link to="/startup/challenges" className="text-xs text-gov-blue hover:underline mt-2 inline-block">
          ← Back to Challenges
        </Link>
      </div>
    );
  }

  const requirements = challenge.requirements || {};
  const kpis = challenge.kpis || {};

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/startup/challenges"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Challenges
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-gov-blue uppercase">
                {challenge.category || 'Government Innovation Tender'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                STATUS: {challenge.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">Tender Ref #{challenge.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gov-navy leading-tight">
              {challenge.title}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Authorized Public Procurement Authority
            </p>
          </div>

          {/* CTA Box */}
          <div className="flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center md:text-right min-w-[220px] space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Allocated Pilot Budget</span>
              <p className="text-2xl font-black text-gov-navy mt-0.5">
                ₹{challenge.budget ? Number(challenge.budget).toLocaleString('en-IN') : 'Grant Allocated'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {downloadingPdf ? 'Generating PDF...' : 'Download Tender PDF'}
              </button>

              {existingApplication ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-xs font-bold text-emerald-800 block">Applied</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Status: {existingApplication.status}</span>
                  <Link
                    to="/startup/applications"
                    className="text-[11px] text-gov-blue font-bold hover:underline block mt-1"
                  >
                    View in My Applications →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending || challenge.status !== 'OPEN'}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {applyMutation.isPending ? 'Submitting Application...' : 'Apply for Challenge'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick details strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Location</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {challenge.location || 'Pan-India'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Application Deadline</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {challenge.application_deadline || 'Rolling basis'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Procurement Model</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">Milestone-Based Pilot</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Evaluation Mode</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">Independent Technical Panel</span>
          </div>
        </div>
      </div>

      {/* AI Match Recommendation Card */}
      {isLoadingMatchResult ? (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white rounded-2xl border border-blue-200/80 p-5 shadow-card">
          <div className="flex items-center gap-2 text-gov-navy">
            <Sparkles className="w-5 h-5 text-gov-blue animate-pulse" />
            <h3 className="text-sm font-bold">AI-Assisted Compatibility Match</h3>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            <div className="w-4 h-4 border-2 border-gov-blue border-t-transparent rounded-full animate-spin" />
            <span>Computing startup-to-challenge compatibility...</span>
          </div>
        </div>
      ) : matchError ? (
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-card">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold">AI match temporarily unavailable</h3>
          </div>
          <p className="mt-2 text-xs text-amber-700">
            The compatibility engine could not load for this challenge. Refresh the page or try again shortly.
          </p>
        </div>
      ) : matchResult ? (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white rounded-2xl border border-blue-200/80 p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gov-blue" />
              <h3 className="text-sm font-bold text-gov-navy">AI-Assisted Compatibility Match</h3>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-gov-blue text-white shadow-sm">
              {matchResult.match_score.toFixed(0)}% Overall Score
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Our deterministic rule-based matching engine has compared your startup profile capabilities with this challenge:
          </p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {matchResult.explanation?.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-white/70 p-2 rounded-lg border border-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-blue-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Matched KPIs: {matchResult.matched_kpis?.join(', ') || 'Domain track record'}</span>
            <span className="text-slate-400 italic">AI assists decision-making; final decision rests with Government.</span>
          </div>
        </div>
      ) : null}

      {/* Problem Definition & Expected Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Target className="w-4 h-4 text-gov-blue" />
            Core Problem Statement
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {challenge.problem_statement}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            Description & Scope of Work
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {challenge.description}
          </p>
        </div>
      </div>

      {/* Requirements & Target KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gov-blue" />
            Eligibility & Minimum Requirements
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
              <p className="text-xs text-slate-400 italic">Open to all verified DPIIT startups in the sector.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Target Pilot Key Performance Indicators (KPIs)
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
              <p className="text-xs text-slate-400 italic">Milestone benchmarks will be finalized upon pilot assignment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupChallengeDetailPage;
