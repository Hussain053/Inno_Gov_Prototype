import React, { useState } from 'react';
import { Menu, Shield, User as UserIcon, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import UserManualModal from '../common/UserManualModal';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileNav }) => {
  const { user, role } = useAuth();
  const [isManualOpen, setIsManualOpen] = useState(false);

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
            title="SIH Evaluator Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Platform Guide</span>
          </button>

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

      {/* Interactive SIH Evaluator Guide */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        initialRole={(role as any) || 'STARTUP'}
      />
    </>
  );
};

export default Topbar;
