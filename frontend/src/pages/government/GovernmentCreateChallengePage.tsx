import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Target,
  Calendar,
  IndianRupee,
  Sparkles,
  Layers,
  Save,
  Send,
} from 'lucide-react';
import challengeService, { ChallengeCreateParams } from '../../services/challengeService';
import { ChallengeStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import RequirementsFormBuilder, { RequirementField } from '../../components/common/RequirementsFormBuilder';
import KpiFormBuilder, { KpiItem } from '../../components/common/KpiFormBuilder';

export const GovernmentCreateChallengePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [activeSection, setActiveSection] = useState<number>(1);

  // Section 1: Problem Definition
  const [title, setTitle] = useState('Municipal Solar Microgrid Pilot for Resilient Power');
  const [description, setDescription] = useState(
    'Deploy smart IoT-controlled solar microgrids across municipal public health and educational facilities to guarantee 99.9% uptime during grid interruptions.'
  );
  const [problemStatement, setProblemStatement] = useState(
    'High frequency of distribution grid outages causing operational loss in remote municipal healthcare centers and administrative wards.'
  );
  const [category, setCategory] = useState('Solar Energy');

  // Section 2: Requirements / Eligibility Form State
  const [location, setLocation] = useState('Dharwad & Hubballi Municipal Zones, Karnataka');
  const [minTeamSize, setMinTeamSize] = useState<number>(5);
  const [domainReq, setDomainReq] = useState<string>('Solar Energy');
  const [trlRequired, setTrlRequired] = useState<number>(7);
  const [warrantyYears, setWarrantyYears] = useState<number>(3);
  const [customReqFields, setCustomReqFields] = useState<RequirementField[]>([
    { key: 'certification', value: 'ISO 9001 or equivalent' }
  ]);

  // Section 3: Budget & Timeline
  const [budget, setBudget] = useState<number>(250000);
  const [deadline, setDeadline] = useState('2026-11-30');

  // Section 4: Target KPIs Form State
  const [kpis, setKpis] = useState<KpiItem[]>([
    { name: 'Inverter Efficiency', target: '>=90%', unit: '%', method: 'Grid telemetry' },
    { name: 'System Uptime', target: '>=99.9%', unit: '%', method: 'Continuous remote monitoring' },
    { name: 'Failover Response Time', target: '<5', unit: 'sec', method: 'SCADA load breaker log' },
  ]);

  // Section 5: Status
  const [targetStatus, setTargetStatus] = useState<ChallengeStatus>('OPEN');

  const createMutation = useMutation({
    mutationFn: (data: ChallengeCreateParams) => challengeService.createChallenge(data),
    onSuccess: (ch) => {
      queryClient.invalidateQueries({ queryKey: ['challenges-all'] });
      queryClient.invalidateQueries({ queryKey: ['my-challenges-list'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Challenge created', `Challenge '${ch.title}' published successfully.`);
      navigate(`/government/challenges/${ch.id}`);
    },
    onError: (err: any) => {
      error('Failed to create challenge', err.response?.data?.detail || 'Validation error');
    },
  });

  const handleSubmit = (publishImmediately: boolean) => {
    // Build structured requirements
    const reqObj: Record<string, any> = {
      min_team_size: minTeamSize,
      domain: domainReq,
      trl_required: trlRequired,
      warranty_years: warrantyYears,
    };
    customReqFields.forEach((cf) => {
      if (cf.key && cf.key.trim()) {
        reqObj[cf.key.trim()] = cf.value.trim();
      }
    });

    // Build structured KPIs
    const kpiObj: Record<string, any> = {};
    kpis.forEach((k) => {
      if (k.name && k.name.trim()) {
        kpiObj[k.name.trim()] = k.unit ? `${k.target} ${k.unit}`.trim() : k.target;
      }
    });

    createMutation.mutate({
      title,
      description,
      problem_statement: problemStatement,
      category,
      location,
      budget: Number(budget) > 0 ? Number(budget) : undefined,
      application_deadline: deadline && deadline.trim() ? deadline.trim() : undefined,
      status: publishImmediately ? 'OPEN' : 'DRAFT',
      requirements: reqObj,
      kpis: kpiObj,
    });
  };

  const sections = [
    { num: 1, title: 'Problem Definition', desc: 'Title, problem statement, and scope' },
    { num: 2, title: 'Eligibility & Requirements', desc: 'Location, domains, and criteria' },
    { num: 3, title: 'Budget & Timeline', desc: 'Pilot budget and deadline' },
    { num: 4, title: 'Target KPIs', desc: 'Measurable benchmark criteria' },
    { num: 5, title: 'Review & Publish', desc: 'Final review and launch' },
  ];

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

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-gov-blue" />
          Create Public Innovation Challenge Tender
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Formulate structured challenge requirements, pilot budget, and empirical evaluation KPIs.
        </p>
      </div>

      {/* Wizard Step Nav */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px] gap-2">
          {sections.map((sec) => (
            <button
              key={sec.num}
              type="button"
              onClick={() => setActiveSection(sec.num)}
              className={`flex-1 p-3 rounded-xl text-left border transition-all ${
                activeSection === sec.num
                  ? 'border-gov-blue bg-blue-50/70 ring-2 ring-blue-500/20'
                  : activeSection > sec.num
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">Section 0{sec.num}</span>
                {activeSection > sec.num && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug">{sec.title}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{sec.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Problem Definition */}
      {activeSection === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-gov-blue" /> Section 1: Problem Definition & Scope
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Challenge Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart Solar Microgrid Deployment for Rural Health Units"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Innovation Category / Sector *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              >
                <option value="Solar Energy">Solar Energy & Renewable Grid</option>
                <option value="CleanTech">CleanTech & Waste-to-Energy</option>
                <option value="IoT & Telemetry">IoT & Telemetry Automation</option>
                <option value="Healthcare">Healthcare Digital Diagnostics</option>
                <option value="Agriculture">Precision Agriculture & AgTech</option>
                <option value="Smart Cities">Smart Municipal Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Deployment Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="District, Municipal Corporation, State"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Core Problem Statement (The Challenge) *
            </label>
            <textarea
              rows={3}
              required
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Define the critical bottleneck, operational failure, or citizen challenge faced by the department..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scope of Work & Expected Solution Delivery *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the selected startup will deliver during the pilot trial..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => setActiveSection(2)}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Continue to Eligibility →
            </button>
          </div>
        </div>
      )}

      {/* Section 2: Eligibility & Requirements */}
      {activeSection === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gov-blue" /> Section 2: Eligibility & Minimum Requirements
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            Specify technical capabilities and team criteria using the structured form below. The matching engine evaluates these requirements against startup capabilities.
          </p>

          <RequirementsFormBuilder
            minTeamSize={minTeamSize}
            onMinTeamSizeChange={setMinTeamSize}
            domain={domainReq}
            onDomainChange={setDomainReq}
            trlRequired={trlRequired}
            onTrlRequiredChange={setTrlRequired}
            warrantyYears={warrantyYears}
            onWarrantyYearsChange={setWarrantyYears}
            customFields={customReqFields}
            onCustomFieldsChange={setCustomReqFields}
          />

          <div className="flex justify-between pt-3">
            <button
              type="button"
              onClick={() => setActiveSection(1)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection(3)}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Continue to Budget & Timeline →
            </button>
          </div>
        </div>
      )}

      {/* Section 3: Budget & Timeline */}
      {activeSection === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-gov-blue" /> Section 3: Pilot Grant Budget & Application Timeline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Allocated Pilot Budget (₹ INR) *
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none font-semibold text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ₹{(budget / 100000).toFixed(2)} Lakhs allocated for pilot execution
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Deadline *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              type="button"
              onClick={() => setActiveSection(2)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection(4)}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Continue to Target KPIs →
            </button>
          </div>
        </div>
      )}

      {/* Section 4: Target KPIs */}
      {activeSection === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Section 4: Target Pilot KPIs
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            Specify empirical benchmark criteria and required metrics using the structured form below.
          </p>

          <KpiFormBuilder
            kpis={kpis}
            onChange={setKpis}
          />

          <div className="flex justify-between pt-3">
            <button
              type="button"
              onClick={() => setActiveSection(3)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection(5)}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Review & Launch →
            </button>
          </div>
        </div>
      )}

      {/* Section 5: Review & Publish */}
      {activeSection === 5 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Section 5: Review & Final Publication
          </h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">Title</span>
              <p className="text-base font-bold text-slate-900">{title}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-800">{category}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Location</span>
                <span className="font-semibold text-slate-800">{location}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Budget</span>
                <span className="font-semibold text-slate-800">₹{budget.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Deadline</span>
                <span className="font-semibold text-slate-800">{deadline}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => setActiveSection(4)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← Back to KPIs
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => handleSubmit(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save as Draft
              </button>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => handleSubmit(true)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Publish Challenge (OPEN)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentCreateChallengePage;
