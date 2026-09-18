import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  IndianRupee,
  Building,
} from 'lucide-react';
import challengeService from '../../services/challengeService';
import { Challenge } from '../../types';

export const StartupChallengesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges-all'],
    queryFn: () => challengeService.listChallenges({ status: 'OPEN' }),
  });

  const categories = ['ALL', 'Solar Energy', 'CleanTech', 'IoT & Telemetry', 'Healthcare', 'Agriculture', 'Smart Cities'];

  const filteredChallenges = challenges?.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.problem_statement.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || c.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
              <Compass className="w-5 h-5 text-gov-blue" />
              Open Government Innovation Challenges
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Apply to pilot programs published by central and municipal government departments.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {challenges?.length || 0} Open Tenders
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search challenges by title, sector, or problem statement..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-gov-blue text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading open challenges...</p>
        </div>
      ) : filteredChallenges?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Challenges Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search terms or category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges?.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-gov-blue hover:shadow-card-hover transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-gov-blue uppercase tracking-wider">
                    {challenge.category || 'Innovation Tender'}
                  </span>
                  <span className="text-xs font-black text-slate-800 flex items-center">
                    ₹{challenge.budget ? (challenge.budget / 100000).toFixed(1) + ' Lakhs' : 'Pilot Grant'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {challenge.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {challenge.problem_statement || challenge.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                  {challenge.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{challenge.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      {challenge.application_deadline
                        ? `Deadline: ${challenge.application_deadline}`
                        : 'Open Pilot Submissions'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Match Available
                </span>
                <Link
                  to={`/startup/challenges/${challenge.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <span>View Details</span>
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

export default StartupChallengesPage;
