import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  FileCheck2,
} from 'lucide-react';
import evaluationService from '../../services/evaluationService';

export const EvaluatorHistoryPage: React.FC = () => {
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['my-evaluations-history'],
    queryFn: () => evaluationService.listEvaluations(),
  });

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          Certified Evaluation History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical record of all certified evaluations and procurement recommendations performed by your profile.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading evaluation records...</p>
        </div>
      ) : evaluations?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Historical Evaluations</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once you score and complete evaluations in your assigned submissions, they will be archived here.
          </p>
          <Link
            to="/evaluator/assignments"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
          >
            Check Pending Assignments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {evaluations?.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Evaluation #{ev.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.recommendation === 'RECOMMEND'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ev.recommendation}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Submission #{ev.pilot_submission_id}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="font-black text-purple-900 text-base">
                    Score: {ev.overall_score?.toFixed(1) || '—'} / 100
                  </span>
                  <span className="text-slate-400">
                    Certified: {new Date(ev.updated_at || ev.created_at).toLocaleDateString()}
                  </span>
                </div>

                {ev.comments && (
                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                    "{ev.comments}"
                  </p>
                )}
              </div>

              <Link
                to={`/evaluator/evaluate/${ev.pilot_submission_id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" /> View Scorecard
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvaluatorHistoryPage;
