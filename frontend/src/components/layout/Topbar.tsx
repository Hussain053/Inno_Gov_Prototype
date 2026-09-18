import React, { useState } from 'react';
import { Menu, ChevronDown, Sparkles, Shield, User as UserIcon, BookOpen, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import { DEMO_ACCOUNTS } from '../../mock/demoAccounts';
import { UserRole } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import UserManualModal from '../common/UserManualModal';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileNav }) => {
  const { user, role, login, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const handleRoleQuickSwitch = async (targetRole: UserRole) => {
    setIsRoleMenuOpen(false);
    setIsSwitching(true);
    try {
      const demoAccount = DEMO_ACCOUNTS[targetRole];
      await login(demoAccount.email, demoAccount.password);
      success(`Switched role to ${targetRole}`, `Now operating as ${demoAccount.roleName}`);
      
      // Navigate to target role dashboard
      switch (targetRole) {
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
      }
    } catch (err: any) {
      error('Role switch failed', err.response?.data?.detail || 'Could not authenticate demo user on backend');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-gov-blue" />
              National Innovation Procurement Portal
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-600 font-medium truncate max-w-[280px]">
              {user?.organization || 'Government of India'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Educate User Guide Button (Multi-role guide for Startup, Government, Evaluator, and Admin) */}
          <button
            onClick={() => setIsManualOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-xs"
            title="Platform User Manual & Flow Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Platform Guide</span>
          </button>

          {/* Quick Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              disabled={isSwitching}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-gov-blue hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
              title="Switch Persona"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Persona:</span>
              <span className="font-bold">{role}</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-elevated border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Persona
                  </p>
                </div>
                {(['STARTUP', 'GOVERNMENT', 'EVALUATOR', 'ADMIN'] as UserRole[]).map((r) => {
                  const acc = DEMO_ACCOUNTS[r];
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleQuickSwitch(r)}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                        isSelected ? 'bg-blue-50 font-bold text-gov-blue' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{acc.label.split(' ')[0]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="leading-none font-semibold truncate">{acc.label.replace(/^[^\s]+\s+/, '')}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{acc.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* User initials / Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-left leading-none">
              <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{role?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive User Manual Modal */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        initialRole={(role as any) || 'STARTUP'}
      />
    </>
  );
};

export default Topbar;
