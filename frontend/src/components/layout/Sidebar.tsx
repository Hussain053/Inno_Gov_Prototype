import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Compass,
  FileCheck2,
  PlayCircle,
  UploadCloud,
  CreditCard,
  Bell,
  PlusCircle,
  Layers,
  Award,
  FileSignature,
  Users,
  ShieldCheck,
  Activity,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const getNavItems = (currentRole: UserRole | null) => {
    switch (currentRole) {
      case 'STARTUP':
        return [
          { to: '/startup', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/startup/profile', label: 'Startup Profile', icon: Building2 },
          { to: '/startup/challenges', label: 'Government Challenges', icon: Compass },
          { to: '/startup/applications', label: 'My Applications', icon: FileCheck2 },
          { to: '/startup/pilots', label: 'Assigned Pilots', icon: PlayCircle },
          { to: '/startup/submissions', label: 'Pilot Submissions', icon: UploadCloud },
          { to: '/startup/payments', label: 'Milestone Payments', icon: CreditCard },
          { to: '/startup/notifications', label: 'Notifications', icon: Bell },
        ];
      case 'GOVERNMENT':
        return [
          { to: '/government', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/government/challenges', label: 'My Challenges', icon: Layers },
          { to: '/government/challenges/create', label: 'Create Challenge', icon: PlusCircle },
          { to: '/government/applications', label: 'Review Applications', icon: FileCheck2 },
          { to: '/government/pilots', label: 'Pilots Management', icon: PlayCircle },
          { to: '/government/evaluations', label: 'Evaluations & Scoring', icon: Award },
          { to: '/government/contracts', label: 'Contracts & Scale-Up', icon: FileSignature },
          { to: '/government/notifications', label: 'Notifications', icon: Bell },
        ];
      case 'EVALUATOR':
        return [
          { to: '/evaluator', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/evaluator/assignments', label: 'Assigned Submissions', icon: FileCheck2 },
          { to: '/evaluator/history', label: 'Evaluation History', icon: Award },
          { to: '/evaluator/notifications', label: 'Notifications', icon: Bell },
        ];
      case 'ADMIN':
        return [
          { to: '/admin', label: 'Control Tower', icon: LayoutDashboard },
          { to: '/admin/users', label: 'User Directory', icon: Users },
          { to: '/admin/verification', label: 'Startup Verification', icon: ShieldCheck },
          { to: '/admin/activity', label: 'System Audit Logs', icon: Activity },
          { to: '/admin/notifications', label: 'Notifications', icon: Bell },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(role);

  const getRoleBadge = (r: UserRole | null) => {
    switch (r) {
      case 'STARTUP':
        return { label: 'Startup Portal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'GOVERNMENT':
        return { label: 'Government Cell', color: 'bg-blue-50 text-gov-blue border-blue-200' };
      case 'EVALUATOR':
        return { label: 'Technical Panel', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'ADMIN':
        return { label: 'System Administrator', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'User', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge(role);

  return (
    <aside className="w-64 bg-gov-navy text-white flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-gov-blue to-blue-400 flex items-center justify-center font-bold text-lg text-white shadow-sm">
            IG
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">InnoGov</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                OFFICIAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-1">Public Procurement Innovation</p>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.organization || user?.email}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleBadge.color}`}>
            {role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/startup' || item.to === '/government' || item.to === '/evaluator' || item.to === '/admin'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-gov-blue text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
