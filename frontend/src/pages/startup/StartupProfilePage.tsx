import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import startupService, { StartupProfileUpdateParams } from '../../services/startupService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const StartupProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-startup-profile'],
    queryFn: startupService.getMyProfile,
  });

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [teamSize, setTeamSize] = useState<number>(10);
  const [experience, setExperience] = useState('');
  const [kpiDataStr, setKpiDataStr] = useState('');

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || '');
      setDescription(profile.description || '');
      setIndustry(profile.industry || '');
      setLocation(profile.location || '');
      setWebsite(profile.website || '');
      setTeamSize(profile.team_size || 10);
      setExperience(profile.experience || '');
      setKpiDataStr(
        profile.kpi_data ? JSON.stringify(profile.kpi_data, null, 2) : '{\n  "efficiency": "92%",\n  "uptime": "99.95%",\n  "trl_level": 7\n}'
      );
    } else if (user) {
      setCompanyName(user.organization || user.name || 'SolarTech Innovations');
      setIndustry('CleanTech / Solar Energy');
      setLocation('Tech Park, Block 4, Bangalore');
      setWebsite('https://solartech.io');
      setDescription('Next-generation solar microgrid provider designed for municipal and rural facilities.');
      setExperience('Deployed 5 public solar micro-grid installations across 3 municipal corporations.');
      setKpiDataStr('{\n  "efficiency": "92%",\n  "uptime": "99.95%",\n  "trl_level": 7,\n  "iso_certified": true\n}');
    }
  }, [profile, user]);

  const updateMutation = useMutation({
    mutationFn: (data: StartupProfileUpdateParams) => startupService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-startup-profile'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      success('Profile updated', 'Your startup profile and KPI data have been saved successfully');
    },
    onError: (err: any) => {
      error('Failed to update profile', err.response?.data?.detail || 'An unexpected error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedKpis: Record<string, any> | undefined;
    if (kpiDataStr.trim()) {
      try {
        parsedKpis = JSON.parse(kpiDataStr);
      } catch (err) {
        error('Invalid KPI JSON format', 'Please check your KPI Data JSON syntax');
        return;
      }
    }

    updateMutation.mutate({
      company_name: companyName,
      description,
      industry,
      location,
      website,
      team_size: Number(teamSize),
      experience,
      kpi_data: parsedKpis,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-gov-blue flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gov-navy">Startup Innovation Profile</h1>
            <p className="text-xs text-slate-500">
              Government tender evaluators and AI matching engine analyze this profile for challenge suitability.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Company Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gov-blue"></span>
            Company Identification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name (Registered Entity) *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="SolarTech Innovations Pvt Ltd"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Renewable Energy / Smart Grid / CleanTech"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headquarters / Operating Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bangalore, Karnataka, India"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://solartech.io"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full-Time Team Size
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Overview & Technical Capabilities
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your core technological innovation, proprietary IP, and product capabilities..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proven Track Record & Municipal/Public Pilot Experience
            </label>
            <textarea
              rows={3}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="List prior pilots, installations, deployments, or public sector engagements..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Structured KPI Data (Consumed by Matching Algorithm) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gov-blue" />
              Machine-Readable KPI & Benchmark Capabilities (JSON)
            </h3>
            <span className="text-[11px] font-semibold text-gov-blue bg-blue-50 px-2 py-0.5 rounded">
              AI Matching Input
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            The AI startup matching engine compares these verified technical benchmarks against government challenge requirements.
          </p>

          <div>
            <textarea
              rows={6}
              value={kpiDataStr}
              onChange={(e) => setKpiDataStr(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none bg-slate-900 text-emerald-400"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Innovation Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartupProfilePage;
