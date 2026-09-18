import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Search,
  Cpu,
  Target,
  FileCheck2,
  Scale,
  TrendingUp,
  Award,
  Building,
  CheckCircle2,
  ExternalLink,
  Users,
  BookOpen,
} from 'lucide-react';
import { DEMO_ACCOUNTS } from '../../mock/demoAccounts';
import { useAuth } from '../../context/AuthContext';
import UserManualModal from '../../components/common/UserManualModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [isManualOpen, setIsManualOpen] = useState(false);

  const handleQuickLogin = (roleKey: 'STARTUP' | 'GOVERNMENT' | 'EVALUATOR' | 'ADMIN') => {
    navigate(`/login?role=${roleKey}`);
  };

  const workflowSteps = [
    {
      step: '01',
      title: 'Identify',
      subtitle: 'Government defines a problem',
      desc: 'Ministries articulate clear problem statements, target milestones, and desired key performance indicators (KPIs) through structured digital tenders.',
      icon: Search,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      step: '02',
      title: 'Discover',
      subtitle: 'AI matches suitable startups',
      desc: 'Deterministic AI matching algorithm scores registered startups against sector eligibility, technical capacity, and KPI track records without human bias.',
      icon: Cpu,
      color: 'from-sky-600 to-blue-700',
    },
    {
      step: '03',
      title: 'Pilot',
      subtitle: 'Controlled pilot with milestones',
      desc: 'Shortlisted innovators execute sanctioned 30–90 day field deployments under structured milestone contracts and transparent telemetry monitoring.',
      icon: Target,
      color: 'from-emerald-600 to-teal-700',
    },
    {
      step: '04',
      title: 'Evaluate',
      subtitle: 'Evidence-based evaluation',
      desc: 'Accredited domain experts and evaluators objectively verify uploaded telemetry, KPI achievements, and technical benchmark data.',
      icon: FileCheck2,
      color: 'from-purple-600 to-indigo-800',
    },
    {
      step: '05',
      title: 'Procure',
      subtitle: 'Transparent contracting',
      desc: 'Government departments review aggregated evaluation summaries and directly issue legally binding public procurement contracts.',
      icon: Scale,
      color: 'from-amber-600 to-orange-700',
    },
    {
      step: '06',
      title: 'Scale',
      subtitle: 'Successful innovation moves to scale',
      desc: 'Validated innovations graduate from local municipal micro-pilots into pan-India public procurement scaling with structured milestone disbursements.',
      icon: TrendingUp,
      color: 'from-blue-700 to-navy-900',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Gov Header Banner */}
      <div className="bg-gov-navy text-slate-300 py-1.5 px-4 sm:px-8 text-[11px] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Official Public Procurement Innovation Framework</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono">Verifiable Milestone Contracting</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400">
          <span>FastAPI + Async SQLAlchemy Backend</span>
          <span>Role-Based Procurement Gating</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gov-navy flex items-center justify-center font-black text-xl text-white shadow-sm border border-slate-700">
            IG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-gov-navy tracking-tight">InnoGov</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-gov-blue rounded-md border border-blue-200">
                GOVTECH PLATFORM
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Startup-Friendly Public Procurement Gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManualOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-2xs"
            title="Platform Operating Manual"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span>SIH Evaluator Guide</span>
          </button>

          {isAuthenticated() ? (
            <Link
              to={
                role === 'STARTUP'
                  ? '/startup'
                  : role === 'GOVERNMENT'
                  ? '/government'
                  : role === 'EVALUATOR'
                  ? '/evaluator'
                  : '/admin'
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gov-blue text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gov-navy text-white hover:bg-slate-800 shadow-sm transition-all"
            >
              <span>Register on Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-200 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Smart India Hackathon 2024–2026 • Problem 26136</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gov-navy tracking-tight leading-[1.1]">
            Innovation to Impact.
          </h1>

          {/* Subheadline */}
          <p className="mt-4 text-lg sm:text-xl font-semibold text-gov-blue max-w-3xl mx-auto">
            A smarter way for Government to discover, pilot and scale startup innovation.
          </p>

          {/* Description */}
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect government challenges with verified startups through AI-powered matching, structured pilots,
            measurable KPIs and transparent procurement.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/login?mode=register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-gov-navy text-white hover:bg-slate-800 shadow-elevated transition-all"
            >
              <span>Login to Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsManualOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>SIH Evaluator Guide</span>
            </button>
          </div>

          {/* Role access cards */}
          <div className="mt-14 pt-8 border-t border-slate-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Select a role to continue
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-5xl mx-auto text-left">
              {(['STARTUP', 'GOVERNMENT', 'EVALUATOR', 'ADMIN'] as const).map((r) => {
                const acc = DEMO_ACCOUNTS[r];
                return (
                  <button
                    key={r}
                    onClick={() => handleQuickLogin(r)}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-gov-blue hover:shadow-card-hover transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{acc.label.split(' ')[0]}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-gov-blue">
                        {acc.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-gov-blue">
                      {acc.label.replace(/^[^\s]+\s+/, '')}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-normal">
                      {acc.description}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-gov-blue font-semibold">
                      <span>Launch as {r}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 6-Stage Workflow Section */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
              Procurement Lifecycle
            </span>
            <h2 className="text-3xl font-extrabold text-gov-navy tracking-tight mt-3">
              How InnoGov Drives Public Innovation
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Transforming traditional months-long tender bureaucracy into an agile, data-backed 6-stage lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-gov-blue tracking-widest">{s.step}</span>
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-gov-navy shadow-sm">
                        <Icon className="w-5 h-5 text-gov-blue" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                    <h4 className="text-xs font-semibold text-gov-blue mt-0.5">{s.subtitle}</h4>
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-200 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enforced via Async State Transitions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Architecture Metrics */}
      <section className="py-16 bg-gov-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-blue-400">100%</p>
              <p className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">FastAPI Backend Sync</p>
              <p className="text-[11px] text-slate-400 mt-1">Direct REST Endpoints</p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">0–100%</p>
              <p className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">AI Matching Engine</p>
              <p className="text-[11px] text-slate-400 mt-1">Rule-based deterministic</p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-purple-400">4 Roles</p>
              <p className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">Strict RBAC Gating</p>
              <p className="text-[11px] text-slate-400 mt-1">JWT Bearer Authorization</p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-amber-400">₹ Multi-Milestone</p>
              <p className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">Public Contracting</p>
              <p className="text-[11px] text-slate-400 mt-1">Audit-Logged Procurement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-slate-500 text-xs text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 InnoGov Public Procurement Portal. Built for Smart India Hackathon.</p>
          <div className="flex items-center gap-6 text-[11px] font-medium text-slate-600">
            <span>Ministry of Electronics and Information Technology</span>
            <span>Department of Public Enterprises</span>
          </div>
        </div>
      </footer>

      {/* Interactive Platform Manual Modal */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        initialRole={(role as any) || 'STARTUP'}
      />
    </div>
  );
};

export default LandingPage;
