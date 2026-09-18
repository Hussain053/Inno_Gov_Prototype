import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowLeft,
  Award,
  CheckCircle2,
  Building2,
  Cpu,
  BarChart3,
  Info,
  Layers,
  ArrowRight,
  Mail,
  Send,
  Clock,
} from 'lucide-react';
import matchingService from '../../services/matchingService';
import challengeService from '../../services/challengeService';
import applicationService from '../../services/applicationService';
import startupService from '../../services/startupService';
import { useToast } from '../../context/ToastContext';
import { MatchResponse } from '../../types';

export const GovernmentMatchingPage: React.FC = () => {
  const { id, challengeId } = useParams<{ id?: string; challengeId?: string }>();
  const cId = parseInt(id || challengeId || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: challenge } = useQuery({
    queryKey: ['challenge', cId],
    queryFn: () => challengeService.getChallenge(cId),
    enabled: !!cId,
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ['challenge-matches', cId],
    queryFn: () => matchingService.matchAllStartupsForChallenge(cId),
    enabled: !!cId,
  });

  const { data: applications } = useQuery({
    queryKey: ['applications-challenge', cId],
    queryFn: () => applicationService.listApplications({ challenge_id: cId }),
    enabled: !!cId,
  });

  const inviteMutation = useMutation({
    mutationFn: (startupId: number) => challengeService.inviteStartup(cId, startupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications-challenge', cId] });
      queryClient.invalidateQueries({ queryKey: ['challenge-matches', cId] });
      success('Official Invitation Dispatched', 'Startup notified to review and respond to this challenge.');
    },
    onError: (err: any) => {
      error('Invite failed', err.response?.data?.detail || 'Could not dispatch invitation');
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: async ({ appId, currentStatus }: { appId: number; currentStatus?: string }) => {
      return await applicationService.shortlistApplication(appId, currentStatus as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications-challenge', cId] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Startup shortlisted', 'Application status updated to SHORTLISTED. Ready for pilot assignment.');
    },
    onError: (err: any) => {
      error('Shortlisting failed', err.response?.data?.detail || 'Could not shortlist application');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/government/challenges/${cId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Challenge #{cId}
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 uppercase">
                Deterministic Rule-Based Matching
              </span>
              <span className="text-xs text-slate-400 font-mono">Target Challenge #{cId}</span>
            </div>
            <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Startup Matching & Recommendation Engine
            </h1>
            <p className="text-xs text-slate-500">
              Evaluating registered DPIIT startups against challenge parameters, sector relevance, and verified KPI telemetry.
            </p>
          </div>

          {/* AI Disclaimer Alert */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 max-w-sm text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">
                AI-assisted recommendation
              </strong>
              <span className="text-[11px] text-amber-800/90 leading-tight block mt-0.5">
                AI assists decision-making and does not make final procurement awards. Final selection is certified by the department.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Results List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Computing deterministic AI match scores across startup profiles...</p>
        </div>
      ) : matches?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Startups Matched Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            When startups complete their innovation profiles with benchmark KPI data, match rankings will populate here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches?.map((match, idx) => {
            const correspondingApp = applications?.find((a) => a.startup_id === match.startup_id);
            const isShortlisted = correspondingApp?.status === 'SHORTLISTED';

            return (
              <div
                key={match.startup_id}
                className={`bg-white rounded-2xl border p-6 shadow-card transition-all ${
                  match.match_score >= 80
                    ? 'border-purple-200 ring-1 ring-purple-100'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    {/* Big Match Score Display */}
                    <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-md flex-shrink-0">
                      <span className="text-2xl font-black">{match.match_score.toFixed(0)}%</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">AI SCORE</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">Rank #{idx + 1}</span>
                        <span className="text-xs font-bold text-slate-700">{match.startup_name || `Startup ID #${match.startup_id}`}</span>
                        {isShortlisted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SHORTLISTED
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {match.startup_name || `Innovator Entity #${match.startup_id}`}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sector: {match.industry || 'CleanTech / Sustainable Infrastructure'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {correspondingApp ? (
                      correspondingApp.status === 'INVITED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Invitation Pending Response
                        </span>
                      ) : correspondingApp.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Invitation Declined
                        </span>
                      ) : isShortlisted ? (
                        <Link
                          to="/government/pilots"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
                        >
                          <span>Manage Pilot</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={() =>
                            shortlistMutation.mutate({
                              appId: correspondingApp.id,
                              currentStatus: correspondingApp.status,
                            })
                          }
                          disabled={shortlistMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Shortlist for Pilot
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => inviteMutation.mutate(match.startup_id)}
                        disabled={inviteMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {inviteMutation.isPending ? 'Sending Invite...' : 'Invite to Apply'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Score Breakdown & Explanation */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Explanation Bullets */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AI Compatibility Breakdown
                    </h4>
                    <div className="space-y-1.5">
                      {match.explanation?.map((item, i) => (
                        <p key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Matched KPIs & Dimension Breakdown */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Matched Domains, Skills & Technologies
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {match.matched_domains && match.matched_domains.length > 0 && match.matched_domains.map((d, i) => (
                          <span key={`domain-${i}`} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-800">
                            🏷️ {d}
                          </span>
                        ))}
                        {match.matched_skills && match.matched_skills.length > 0 && match.matched_skills.map((s, i) => (
                          <span key={`skill-${i}`} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800">
                            ⚡ {s}
                          </span>
                        ))}
                        {match.matched_technologies && match.matched_technologies.length > 0 && match.matched_technologies.map((t, i) => (
                          <span key={`tech-${i}`} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                            🔧 {t}
                          </span>
                        ))}
                        {match.matched_kpis && match.matched_kpis.length > 0 && match.matched_kpis.map((kpi, i) => (
                          <span key={`kpi-${i}`} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            ✓ {kpi}
                          </span>
                        ))}
                        {(!match.matched_domains?.length && !match.matched_skills?.length && !match.matched_technologies?.length && !match.matched_kpis?.length) && (
                          <span className="text-xs text-slate-400">Baseline sector match</span>
                        )}
                      </div>
                    </div>

                    {match.breakdown && Object.keys(match.breakdown).length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Scoring Dimensions
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(match.breakdown).map(([dim, score]) => (
                            <div key={dim} className="flex items-center justify-between text-slate-600">
                              <span className="capitalize">{dim.replace('_', ' ')}</span>
                              <span className="font-bold text-slate-800">{score.toFixed(1)} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GovernmentMatchingPage;
