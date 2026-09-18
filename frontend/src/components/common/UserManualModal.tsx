import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Building2,
  Layers,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  PlayCircle,
  UploadCloud,
  CreditCard,
  FileSignature,
  Target,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole | null;
  initialRole?: UserRole | null;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  defaultRole,
  initialRole,
}) => {
  const chosen = initialRole || defaultRole;
  const initialTab =
    chosen === 'STARTUP' || chosen === 'GOVERNMENT' || chosen === 'EVALUATOR' || chosen === 'ADMIN'
      ? chosen
      : 'STARTUP';

  const [activeRole, setActiveRole] = useState<'STARTUP' | 'GOVERNMENT' | 'EVALUATOR' | 'ADMIN'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gov-navy p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gov-blue to-blue-400 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">SIH Evaluator Guide</h2>
              <p className="text-xs text-slate-400">
                Official end-to-end instructions for public innovation procurement workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-6 mt-4 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed">
          <strong className="block mb-1">Review access</strong>
          SIH evaluators who do not want to register can sign in with the provided review credentials:
          <span className="block mt-1"><strong>Startup</strong> | <strong>Email:</strong> <span className="font-mono">navya@gmail.com</span> | <strong>Password:</strong> <span className="font-mono">Password123</span></span>
          <span className="block"><strong>Evaluator</strong> | <strong>Email:</strong> <span className="font-mono">neel@gmail.com</span> | <strong>Password:</strong> <span className="font-mono">Password123</span></span>
          <span className="block"><strong>Government</strong> | <strong>Email:</strong> <span className="font-mono">dd@gmail.com</span> | <strong>Password:</strong> <span className="font-mono">Password123!</span></span>
          <span className="block mt-1 text-amber-800">Administrator credentials are restricted for security.</span>
        </div>

        {/* Role Switcher Tabs */}
        <div className="mt-1 bg-slate-50 border-y border-slate-200 px-6 py-5 flex items-center gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveRole('STARTUP')}
            className={`flex min-h-14 flex-1 items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeRole === 'STARTUP'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Startup Innovator Manual</span>
          </button>

          <button
            onClick={() => setActiveRole('GOVERNMENT')}
            className={`flex min-h-14 flex-1 items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeRole === 'GOVERNMENT'
                ? 'bg-gov-blue text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Government Officer Manual</span>
          </button>

          <button
            onClick={() => setActiveRole('EVALUATOR')}
            className={`flex min-h-14 flex-1 items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeRole === 'EVALUATOR'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Technical Evaluator Manual</span>
          </button>

          <button
            onClick={() => setActiveRole('ADMIN')}
            className={`flex min-h-14 flex-1 items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeRole === 'ADMIN'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>System Administrator Manual</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-0 flex-1 p-6 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* STARTUP GUIDE */}
          {activeRole === 'STARTUP' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  Purpose of the Startup Role
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  As an innovative startup entity, you can discover government challenges, receive invitations from departments, submit proposals, deploy sanctioned sandbox pilots, receive phase-wise milestone payments, upload empirical telemetry/evidence, receive independent evaluator scorecards, and progress toward public procurement contracts, subject to applicable procurement rules and eligibility requirements.
                </p>
              </div>

              {/* Step-by-Step Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Complete Startup Procurement Lifecycle
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">1. Profile &amp; KPI Readiness</span>
                    <p className="text-slate-500">
                      Navigate to <strong>Startup Profile</strong> and enter company details, team capacity, past experience, and measured KPI benchmarks. This feeds the AI matching engine.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">2. Discover &amp; Apply / Accept Invites</span>
                    <p className="text-slate-500">
                      Browse <strong>Government Challenges</strong> or review direct tenders you have been invited to under <strong>My Applications</strong>. Submit proposal when ready.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">3. Sandbox Pilot Deployment</span>
                    <p className="text-slate-500">
                      When shortlisted, government sanctions a <strong>Sandbox Pilot</strong>. Click &quot;Start Pilot Deployment&quot; under <strong>Assigned Pilots</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">4. Submit Results &amp; Upload Evidence</span>
                    <p className="text-slate-500">
                      Under <strong>Pilot Submissions</strong>, fill the KPI results form and upload actual telemetry files, audit certificates, or lab reports directly from your device.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">5. Evaluator Review &amp; Scorecard</span>
                    <p className="text-slate-500">
                      The appointed independent evaluation panel scores your submission (0–100 scale). You receive status notifications when scored.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">6. Contract Award &amp; Milestone Payments</span>
                    <p className="text-slate-500">
                      Government issues a public procurement contract upon successful pilot completion. Track disbursement stages in <strong>Milestone Payments</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Cheat Sheet */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sidebar Sections &amp; Actions
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <li><strong>Dashboard:</strong> Performance summary, active pilots, and recent activity.</li>
                  <li><strong>Startup Profile:</strong> Edit capabilities, team size, and baseline KPI metrics.</li>
                  <li><strong>Government Challenges:</strong> Search and filter open tender challenges.</li>
                  <li><strong>My Applications:</strong> Status tracking (DRAFT $\rightarrow$ SUBMITTED $\rightarrow$ SHORTLISTED).</li>
                  <li><strong>Assigned Pilots:</strong> Task details, criteria, and deployment controls.</li>
                  <li><strong>Pilot Submissions:</strong> Form-based results entry &amp; actual file uploads.</li>
                </ul>
              </div>
            </div>
          )}

          {/* GOVERNMENT GUIDE */}
          {activeRole === 'GOVERNMENT' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <h3 className="text-sm font-bold text-gov-navy flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gov-blue" />
                  Purpose of the Government Officer Role
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Government officials formulate public problem statements, publish tenders with structured KPIs, use AI matching to invite capable startups, appoint accredited evaluators, sanction controlled sandbox pilots, review certified scorecards, and award legal procurement contracts under GFR provisions.
                </p>
              </div>

              {/* Step-by-Step Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Government Procurement Execution Workflow
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">1. Formulate &amp; Publish Challenge</span>
                    <p className="text-slate-500">
                      Under <strong>Create Challenge</strong>, use the step-by-step wizard to define problem statements, budget, eligibility, and structured target KPIs. Publish as OPEN.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">2. AI Matching &amp; Direct Invites</span>
                    <p className="text-slate-500">
                      Open <strong>AI Match Engine</strong> to view ranked startups scored by technology fit, team capacity, and past telemetry. Send official invites with 1-click.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">3. Appoint Accredited Evaluator</span>
                    <p className="text-slate-500">
                      Select an expert evaluator from the database dropdown on the Challenge Detail page to review incoming pilot submissions.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">4. Shortlist &amp; Sanction Sandbox Pilot</span>
                    <p className="text-slate-500">
                      Review proposals in <strong>Review Applications</strong> and mark candidates as SHORTLISTED. Sanction a structured pilot with deliverables and success criteria.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">5. Review Scorecards &amp; Telemetry</span>
                    <p className="text-slate-500">
                      Inspect evaluator scorecards, recommendations (RECOMMEND / DO NOT RECOMMEND), and uploaded technical evidence under <strong>Evaluations &amp; Scoring</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">6. Final Decision &amp; Scale-Up Contract</span>
                    <p className="text-slate-500">
                      Government holds sole procurement allocation authority. Record final decision and generate a scale-up contract in <strong>Contracts &amp; Scale-Up</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Downloads Notice */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <FileSignature className="w-4 h-4 text-gov-blue flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-slate-900">Official Tender Specification PDFs:</strong>
                  <p className="text-slate-500 mt-0.5">
                    You can download a government-formatted Tender Specification PDF directly from any challenge page for record-keeping and external committee circulation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* EVALUATOR GUIDE */}
          {activeRole === 'EVALUATOR' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-700" />
                  Purpose of the Technical Evaluator Role
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  As an accredited domain expert, you provide independent, evidence-backed evaluation of startup pilot submissions. Evaluators inspect challenge specifications, review startup profiles, verify uploaded telemetry documents, score multi-criteria dimensions (0–100), and issue recommendations to government tender boards.
                </p>
              </div>

              {/* Step-by-Step Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Evaluator Technical Review Workflow
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">1. View Assigned Submissions</span>
                    <p className="text-slate-500">
                      Navigate to <strong>Assigned Submissions</strong> to see all pilot projects and deliverables assigned to your panel by government departments.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">2. Comprehensive Due Diligence</span>
                    <p className="text-slate-500">
                      In the <strong>Evaluation Workspace</strong>, review original challenge requirements, startup track record, and pilot success criteria.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">3. Verify Telemetry &amp; Evidence Files</span>
                    <p className="text-slate-500">
                      Inspect empirical benchmark data and click to download verifiable test lab certifications, sensor logs, or photo proofs uploaded by the startup.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">4. Score 5 Multi-Criteria Dimensions</span>
                    <p className="text-slate-500">
                      Score: 1. Technical Excellence, 2. KPI Achievement, 3. Innovation &amp; IP, 4. Feasibility, and 5. Public Sector Impact on a 0–100 scale.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">5. Procurement Recommendation</span>
                    <p className="text-slate-500">
                      Select <strong>RECOMMEND FOR SCALE</strong> or <strong>DO NOT RECOMMEND</strong> and enter detailed qualitative remarks for the tender committee.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">6. Certify &amp; Submit Scorecard</span>
                    <p className="text-slate-500">
                      Submit certified scorecard. The evaluation is locked into immutable audit records, and government is immediately notified to make the final award.
                    </p>
                  </div>
                </div>
              </div>

              {/* Note on Evaluator Boundaries */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">
                    Statutory Authority Separation:
                  </strong>
                  <span className="text-[11px] text-amber-800/90 leading-tight block mt-0.5">
                    Evaluators provide independent scoring and advisory recommendations. Final procurement contract award and financial disbursement authority is strictly retained by the Government Department.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN GUIDE */}
          {activeRole === 'ADMIN' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Administrator interface reference</h3>
                  <p className="text-slate-500 mt-1">
                    Administrator credentials are restricted for security. The interface preview below is provided so SIH reviewers can understand the control-tower experience without accessing the protected account.
                  </p>
                </div>
                <img
                  src="/Screenshot%202026-09-18%20192543.png"
                  alt="InnoGov administrator control tower dashboard"
                  loading="lazy"
                  decoding="async"
                  className="block w-full max-h-[420px] object-contain object-top rounded-xl border border-slate-200 shadow-sm bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Control Tower view showing platform governance, user distribution, procurement pipeline health, and audit activity
                </p>
                <img
                  src="/Screenshot%20(611).png"
                  alt="InnoGov administrator startup verification dashboard"
                  loading="lazy"
                  decoding="async"
                  className="block w-full max-h-[420px] object-contain object-top rounded-xl border border-slate-200 shadow-sm bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Startup Verification view showing verified startup dossiers, registration details, and administrative review actions
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  Purpose of the System Administrator Role
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  As a System Administrator, you manage platform governance, oversee multi-tenant user accounts across ministries and startups, maintain RBAC security policies, audit system activity logs, and monitor end-to-end procurement workflows.
                </p>
              </div>

              {/* Step-by-Step Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Platform Administration &amp; Governance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">1. User &amp; Role Management</span>
                    <p className="text-slate-500">
                      Navigate to <strong>User Management</strong> to review registered entities, activate/deactivate accounts, verify government department credentials, and inspect startup onboarding.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">2. Challenge &amp; Tender Oversight</span>
                    <p className="text-slate-500">
                      Under <strong>Challenges Overview</strong>, track all published problem statements across ministries, monitoring deadlines, budget allocations, and applicant participation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">3. Pilot &amp; Contract Auditing</span>
                    <p className="text-slate-500">
                      Inspect active sandbox deployments, evaluator assignments, and milestone disbursement contracts across all government departments for compliance.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">4. Immutable Activity Audit Logs</span>
                    <p className="text-slate-500">
                      Under <strong>Activity Logs</strong>, inspect all chronological system actions (challenge creations, evaluator score submissions, contract executions) with actor IDs and IP audit metadata.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            InnoGov Public Procurement Innovation Operating Manual • System Version 2.0
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gov-navy text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            Got It, Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;
