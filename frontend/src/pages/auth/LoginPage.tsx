import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Settings,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_ACCOUNTS } from '../../mock/demoAccounts';
import { UserRole } from '../../types';
import authService from '../../services/authService';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();
  const { success, error } = useToast();

  const initialRole = (searchParams.get('role') as UserRole) || 'STARTUP';
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regServiceId, setRegServiceId] = useState(
    initialRole === 'GOVERNMENT' ? 'GOV-VERIFIED-001' : initialRole === 'EVALUATOR' ? 'EVAL-VERIFIED-001' : ''
  );

  // If already authenticated, redirect to role portal
  useEffect(() => {
    if (isAuthenticated() && role) {
      redirectUser(role);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    setActiveTab(searchParams.get('mode') === 'register' ? 'register' : 'login');
  }, [searchParams]);

  const handleRoleSelect = (r: UserRole) => {
    setSelectedRole(r);
    setEmail('');
    setPassword('');
    if (r === 'GOVERNMENT') setRegServiceId('GOV-VERIFIED-001');
    if (r === 'EVALUATOR') setRegServiceId('EVAL-VERIFIED-001');
  };

  const redirectUser = (userRole: UserRole) => {
    switch (userRole) {
      case 'STARTUP':
        navigate('/startup');
        break;
      case 'GOVERNMENT':
        navigate('/government');
        break;
      case 'EVALUATOR':
        navigate('/evaluator');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      default:
        navigate('/startup');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Input required', 'Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      success('Authentication successful', `Welcome back, ${user.name}`);
      redirectUser(user.role);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please verify credentials.';
      error('Sign in failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      error('Input required', 'Name, email, and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedRole === 'STARTUP') {
        await authService.registerStartup({
          name: regName,
          email: regEmail,
          password: regPassword,
          organization: regOrg || undefined,
        });
      } else if (selectedRole === 'GOVERNMENT') {
        await authService.registerGovernment({
          name: regName,
          email: regEmail,
          password: regPassword,
          organization: regOrg || 'Ministry / Department',
          department: regDept || undefined,
          government_service_id: regServiceId || 'GOV-VERIFIED-001',
        });
      } else if (selectedRole === 'EVALUATOR') {
        await authService.registerEvaluator({
          name: regName,
          email: regEmail,
          password: regPassword,
          organization: regOrg || undefined,
          evaluator_service_id: regServiceId || 'EVAL-VERIFIED-001',
        });
      } else {
        error('Admin registration', 'Admin accounts must be provisioned via database seed or system administrator.');
        setIsSubmitting(false);
        return;
      }

      success('Account created', 'You can now sign in with your new credentials');
      setEmail(regEmail);
      setPassword(regPassword);
      setActiveTab('login');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Check your inputs.';
      error('Registration failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rolesList: { key: UserRole; icon: string; title: string; subtitle: string }[] = [
    { key: 'STARTUP', icon: '🚀', title: 'Startup', subtitle: 'Innovator & Vendor' },
    { key: 'GOVERNMENT', icon: '🏛', title: 'Government', subtitle: 'Public Department' },
    { key: 'EVALUATOR', icon: '✓', title: 'Evaluator', subtitle: 'Technical Panel' },
    { key: 'ADMIN', icon: '⚙', title: 'Administrator', subtitle: 'Control Tower' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Top Gov insignia */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gov-navy flex items-center justify-center font-black text-xl text-white shadow-sm border border-slate-700">
            IG
          </div>
          <span className="font-extrabold text-2xl text-gov-navy tracking-tight">InnoGov</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Public Procurement Portal</h2>
        <p className="text-xs text-slate-500 mt-1">Smart India Hackathon Problem 26136</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        {/* Role Cards Selection */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Select Role Persona
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {rolesList.map((r) => {
              const isSelected = selectedRole === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleRoleSelect(r.key)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-gov-blue bg-blue-50/70 text-gov-navy ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-2xl mb-1">{r.icon}</span>
                  <span className="text-xs font-bold leading-tight">{r.title}</span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{r.subtitle}</span>
                </button>
              );
            })}
          </div>

          {/* Active role information */}
          <div className="mt-4 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-600 text-white rounded">
                SELECTED ROLE
              </span>
              <span className="text-xs text-slate-700 font-medium truncate">
                {rolesList.find((item) => item.key === selectedRole)?.title}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Enter your account details below
            </span>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white py-6 px-6 sm:px-8 shadow-card rounded-2xl border border-slate-200">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 pb-3 mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                navigate(`/login?role=${selectedRole}`);
              }}
              className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition-colors ${
                activeTab === 'login'
                  ? 'border-gov-blue text-gov-blue'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In to Account
            </button>
            {selectedRole !== 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  navigate(`/login?role=${selectedRole}&mode=register`);
                }}
                className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition-colors ${
                  activeTab === 'register'
                    ? 'border-gov-blue text-gov-blue'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Register as {selectedRole}
              </button>
            )}
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                {selectedRole === 'STARTUP' && <><span className="block">SIH evaluators who do not want to register can review the platform using:</span><span className="block"><strong className="text-slate-800">Email:</strong> <span className="font-mono text-slate-800">navya@gmail.com</span></span><span className="block"><strong className="text-slate-800">Password:</strong> <span className="font-mono text-slate-800">Password123</span></span></>}
                {selectedRole === 'EVALUATOR' && <><span className="block">SIH evaluators who do not want to register can review the platform using:</span><span className="block"><strong className="text-slate-800">Email:</strong> <span className="font-mono text-slate-800">neel@gmail.com</span></span><span className="block"><strong className="text-slate-800">Password:</strong> <span className="font-mono text-slate-800">Password123</span></span></>}
                {selectedRole === 'GOVERNMENT' && <><span className="block">SIH evaluators who do not want to register can review the platform using:</span><span className="block"><strong className="text-slate-800">Email:</strong> <span className="font-mono text-slate-800">dd@gmail.com</span></span><span className="block"><strong className="text-slate-800">Password:</strong> <span className="font-mono text-slate-800">Password123!</span></span></>}
                {selectedRole === 'ADMIN' && <><strong className="text-slate-800">Administrator access:</strong> Credentials are restricted for security and are not displayed here</>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="block w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-gov-navy hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-navy transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In with Role</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                Already have access? Select <strong className="text-slate-800">Sign In to Account</strong> above. SIH evaluators who do not want to register can review the platform using the provided evaluator credentials or register if they prefer
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name / Organization Head
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email:
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@organization.gov"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (minimum 8 characters, at least 1 digit):
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Password123!"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder="e.g. Clean Energy Innovations Lab"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                />
              </div>

              {selectedRole === 'GOVERNMENT' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      placeholder="e.g. Renewable Energy Division"
                      className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Government Service ID (Verified List)
                    </label>
                    <input
                      type="text"
                      required
                      value={regServiceId}
                      onChange={(e) => setRegServiceId(e.target.value)}
                      placeholder="GOV-VERIFIED-001"
                      className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-gov-blue outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Valid demo IDs: <code className="text-slate-600">GOV-VERIFIED-001</code>, <code className="text-slate-600">GOV-TEST-12345</code>
                    </p>
                  </div>
                </>
              )}

              {selectedRole === 'EVALUATOR' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evaluator Verification ID (Invitation Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={regServiceId}
                    onChange={(e) => setRegServiceId(e.target.value)}
                    placeholder="EVAL-VERIFIED-001"
                    className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-gov-blue outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Valid demo IDs: <code className="text-slate-600">EVAL-VERIFIED-001</code>, <code className="text-slate-600">EVAL-INVITE-2026</code>
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Register {selectedRole} Account</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back to landing link */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
            ← Back to InnoGov Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
