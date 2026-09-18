import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Layers,
  PlusCircle,
  Sparkles,
  Calendar,
  MapPin,
  ArrowRight,
  Send,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import challengeService from '../../services/challengeService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const GovernmentChallengesListPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges-all'],
    queryFn: () => challengeService.listChallenges(),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => challengeService.publishChallenge(id),
    onSuccess: (ch) => {
      queryClient.invalidateQueries({ queryKey: ['challenges-all'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Challenge opened', `Challenge '${ch.title}' is now OPEN for startup applications.`);
    },
    onError: (err: any) => {
      error('Failed to open challenge', err.response?.data?.detail || 'An error occurred');
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
            <Layers className="w-5 h-5 text-gov-blue" />
            Public Innovation Challenges
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department tender challenges, AI matching pipelines, and active procurement tracks.
          </p>
        </div>

        <Link
          to="/government/challenges/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Create New Challenge
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading challenges...</p>
        </div>
      ) : challenges?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Challenges Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create your department's first innovation challenge to start discovering startups.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges?.map((ch) => (
            <div
              key={ch.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Tender #{ch.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ch.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ch.status === 'DRAFT'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-blue-50 text-gov-blue border border-blue-200'
                    }`}
                  >
                    {ch.status}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{ch.category}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{ch.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ch.problem_statement}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Budget: ₹{ch.budget ? (ch.budget / 100000).toFixed(1) + ' Lakhs' : 'Pilot Grant'}</span>
                  <span>Location: {ch.location || 'Pan-India'}</span>
                  <span>Deadline: {ch.application_deadline || 'Open'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {ch.status === 'DRAFT' && (
                  <button
                    onClick={() => publishMutation.mutate(ch.id)}
                    disabled={publishMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish (OPEN)
                  </button>
                )}

                <Link
                  to={`/government/challenges/${ch.id}/matching`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Matching
                </Link>

                <Link
                  to={`/government/challenges/${ch.id}`}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentChallengesListPage;
