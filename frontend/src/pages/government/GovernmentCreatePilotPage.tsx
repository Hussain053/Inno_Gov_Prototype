import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Target,
  Sparkles,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import pilotService, { PilotCreateParams } from '../../services/pilotService';
import applicationService from '../../services/applicationService';
import challengeService from '../../services/challengeService';
import { useToast } from '../../context/ToastContext';

interface KeyValueItem {
  id: string;
  name: string;
  value: string;
}

export const GovernmentCreatePilotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = parseInt(searchParams.get('application_id') || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: application } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationService.getApplication(applicationId),
    enabled: !!applicationId,
  });

  const { data: challenge } = useQuery({
    queryKey: ['challenge', application?.challenge_id],
    queryFn: () => challengeService.getChallenge(application!.challenge_id),
    enabled: !!application?.challenge_id,
  });

  const [title, setTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );

  // Structured Form States (Zero Raw JSON required by users)
  const [requirements, setRequirements] = useState<KeyValueItem[]>([
    { id: '1', name: 'Hardware / Model', value: 'Inverter v3 Industrial' },
    { id: '2', name: 'Capacity / Load', value: '50kW Continuous' },
    { id: '3', name: 'Telemetry Protocol', value: 'MQTT over TLS' },
  ]);

  const [successCriteria, setSuccessCriteria] = useState<KeyValueItem[]>([
    { id: '1', name: 'Minimum Field Uptime', value: '>= 99.9%' },
    { id: '2', name: 'Operational Efficiency', value: '>= 90%' },
    { id: '3', name: 'Failover Time', value: '< 5 seconds' },
  ]);

  const [kpis, setKpis] = useState<KeyValueItem[]>([
    { id: '1', name: 'Efficiency Benchmark', value: '92%' },
    { id: '2', name: 'Uptime Reliability', value: '99.95%' },
  ]);

  useEffect(() => {
    if (challenge) {
      setTitle(`${challenge.title} - 90-Day Municipal Field Pilot`);
      setTaskDescription(
        `Execute field trial deployment at selected municipal facilities. Validate operational resiliency, telemetry communication, and achieve target benchmark KPIs.`
      );

      // Populate from challenge if available
      if (challenge.requirements && typeof challenge.requirements === 'object') {
        const reqEntries = Object.entries(challenge.requirements)
          .filter(([k]) => k !== 'assigned_evaluator')
          .map(([k, v], idx) => ({
            id: `req_${idx}_${Date.now()}`,
            name: k.replace(/_/g, ' '),
            value: typeof v === 'object' ? JSON.stringify(v) : String(v),
          }));
        if (reqEntries.length > 0) setRequirements(reqEntries);
      }

      if (challenge.kpis && typeof challenge.kpis === 'object') {
        const kpiEntries = Object.entries(challenge.kpis).map(([k, v], idx) => ({
          id: `kpi_${idx}_${Date.now()}`,
          name: k.replace(/_/g, ' '),
          value: typeof v === 'object' ? JSON.stringify(v) : String(v),
        }));
        if (kpiEntries.length > 0) setKpis(kpiEntries);
      }
    }
  }, [challenge]);

  // Requirement row handlers
  const handleAddRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      { id: `req_${Date.now()}`, name: '', value: '' },
    ]);
  };

  const handleUpdateRequirement = (id: string, field: 'name' | 'value', val: string) => {
    setRequirements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((item) => item.id !== id));
  };

  // Success Criteria row handlers
  const handleAddSuccessCriterion = () => {
    setSuccessCriteria((prev) => [
      ...prev,
      { id: `sc_${Date.now()}`, name: '', value: '' },
    ]);
  };

  const handleUpdateSuccessCriterion = (id: string, field: 'name' | 'value', val: string) => {
    setSuccessCriteria((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveSuccessCriterion = (id: string) => {
    setSuccessCriteria((prev) => prev.filter((item) => item.id !== id));
  };

  // KPI row handlers
  const handleAddKpi = () => {
    setKpis((prev) => [
      ...prev,
      { id: `kpi_${Date.now()}`, name: '', value: '' },
    ]);
  };

  const handleUpdateKpi = (id: string, field: 'name' | 'value', val: string) => {
    setKpis((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveKpi = (id: string) => {
    setKpis((prev) => prev.filter((item) => item.id !== id));
  };

  const createMutation = useMutation({
    mutationFn: (data: PilotCreateParams) => pilotService.createPilot(data),
    onSuccess: (pilot) => {
      queryClient.invalidateQueries({ queryKey: ['pilots-all'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Pilot sanctioned', `Pilot #${pilot.id} created successfully and assigned to startup.`);
      navigate(`/government/pilots/${pilot.id}`);
    },
    onError: (err: any) => {
      error('Pilot creation failed', err.response?.data?.detail || 'An error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) {
      error('Missing application ID', 'Please select a shortlisted application first');
      return;
    }

    // Serialize Form items into structured JSON dictionaries expected by the API
    const parsedReq: Record<string, string> = {};
    requirements.forEach((item) => {
      if (item.name.trim()) {
        const slug = item.name.trim().toLowerCase().replace(/\s+/g, '_');
        parsedReq[slug] = item.value.trim();
      }
    });

    const parsedSuccess: Record<string, string> = {};
    successCriteria.forEach((item) => {
      if (item.name.trim()) {
        const slug = item.name.trim().toLowerCase().replace(/\s+/g, '_');
        parsedSuccess[slug] = item.value.trim();
      }
    });

    const parsedKpis: Record<string, string> = {};
    kpis.forEach((item) => {
      if (item.name.trim()) {
        const slug = item.name.trim().toLowerCase().replace(/\s+/g, '_');
        parsedKpis[slug] = item.value.trim();
      }
    });

    createMutation.mutate({
      application_id: applicationId,
      title,
      task_description: taskDescription,
      requirements: parsedReq,
      success_criteria: parsedSuccess,
      kpis: parsedKpis,
      start_date: startDate,
      end_date: endDate,
      status: 'ASSIGNED',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/government/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-gov-blue flex items-center justify-center font-bold">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gov-navy">Sanction Pilot Project</h1>
            <p className="text-xs text-slate-500">
              Establish pilot milestones, empirical success criteria, and telemetry specifications for Application #{applicationId}.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Pilot Setup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-gov-blue" />
            Pilot Objective & Milestones
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilot Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Description & Sandbox Deployment Scope *
            </label>
            <textarea
              rows={3}
              required
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilot Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Completion Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>
          </div>
        </div>

        {/* Requirements, Success Criteria, and KPIs Form Builders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Technical Requirements Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-gov-blue" />
                Technical Requirements
              </h3>
              <button
                type="button"
                onClick={handleAddRequirement}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gov-blue hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {requirements.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requirement</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                      title="Remove Requirement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Hardware Model"
                    value={item.name}
                    onChange={(e) => handleUpdateRequirement(item.id, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none font-medium"
                  />
                  <input
                    type="text"
                    placeholder="e.g. Inverter v3 (50kW)"
                    value={item.value}
                    onChange={(e) => handleUpdateRequirement(item.id, 'value', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none text-slate-700"
                  />
                </div>
              ))}
              {requirements.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2 text-center">No specific requirements added.</p>
              )}
            </div>
          </div>

          {/* Success Criteria Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                Success Criteria
              </h3>
              <button
                type="button"
                onClick={handleAddSuccessCriterion}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {successCriteria.map((item) => (
                <div key={item.id} className="p-3 bg-purple-50/40 border border-purple-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Criterion</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSuccessCriterion(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                      title="Remove Criterion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Field Uptime"
                    value={item.name}
                    onChange={(e) => handleUpdateSuccessCriterion(item.id, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none font-medium"
                  />
                  <input
                    type="text"
                    placeholder="e.g. >= 99.9%"
                    value={item.value}
                    onChange={(e) => handleUpdateSuccessCriterion(item.id, 'value', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-slate-700 font-mono"
                  />
                </div>
              ))}
              {successCriteria.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2 text-center">No success criteria added.</p>
              )}
            </div>
          </div>

          {/* Mandatory Target KPIs Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Target KPIs
              </h3>
              <button
                type="button"
                onClick={handleAddKpi}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {kpis.map((item) => (
                <div key={item.id} className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Target KPI</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKpi(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                      title="Remove KPI"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Energy Efficiency"
                    value={item.name}
                    onChange={(e) => handleUpdateKpi(item.id, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-medium"
                  />
                  <input
                    type="text"
                    placeholder="e.g. 92%"
                    value={item.value}
                    onChange={(e) => handleUpdateKpi(item.id, 'value', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none text-slate-700 font-mono"
                  />
                </div>
              ))}
              {kpis.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2 text-center">No target KPIs added.</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-3">
          <Link
            to="/government/applications"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlayCircle className="w-4 h-4" /> Sanction & Assign Pilot
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GovernmentCreatePilotPage;
