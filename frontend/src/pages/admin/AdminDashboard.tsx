import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Award,
  TrendingUp,
  Activity,
  FileCheck,
  CheckCircle2,
  Building,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { activityService } from '../../services/activityService';
import { AdminDashboardResponse, ActivityLog } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardResponse | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashData, activityData] = await Promise.all([
        dashboardService.getAdminDashboard(),
        activityService.listActivity({ limit: 6 }).catch(() => [] as ActivityLog[]),
      ]);
      setStats(dashData);
      setRecentActivity(activityData);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data', err);
      error(err.response?.data?.detail || 'Failed to fetch administration metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Loading system administration telemetry...</p>
        </div>
      </div>
    );
  }

  const roleCounts = stats?.users_by_role || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Governance &amp; National Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Central Administrative Control Tower
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Overseeing DPIIT startup onboarding, inter-departmental challenge lifecycles, pilot integrity audits, and statutory procurement contract awards.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>User Directory</span>
            </Link>
            <Link
              to="/admin/verifications"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm"
            >
              <FileCheck className="w-4 h-4" />
              <span>Startup DPIIT Queue</span>
            </Link>
            <Link
              to="/admin/activity"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm"
            >
              <Activity className="w-4 h-4" />
              <span>Audit Trail</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Ecosystem Users</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.total_users || 0}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
            <span className="font-semibold text-blue-600">{stats?.total_startups || 0}</span>
            <span>Registered Startups</span>
          </p>
        </div>

        {/* Challenges */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Gov Challenges</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.total_challenges || 0}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
            <span className="font-semibold text-emerald-600">{stats?.open_challenges || 0}</span>
            <span>currently accepting applications</span>
          </p>
        </div>

        {/* Active Pilots */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Sandbox Pilots</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.active_pilots || 0}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
            <span className="font-semibold text-amber-600">{stats?.completed_pilots || 0}</span>
            <span>validated &amp; completed</span>
          </p>
        </div>

        {/* Procurement Contracts */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Awarded Contracts</span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.contracts_awarded || 0}</p>
          <p className="text-xs text-purple-700 font-semibold mt-1">
            ₹{((stats?.total_contract_value || 0) / 100000).toFixed(2)} Lakhs Total Scale Value
          </p>
        </div>
      </div>

      {/* Role Breakdown & System Architecture status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Breakdown by Role */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>User Distribution by RBAC Role</span>
          </h2>
          <div className="space-y-3">
            {[
              { role: 'STARTUP', label: 'Startups & Innovators', color: 'bg-blue-500', count: roleCounts['STARTUP'] || stats?.total_startups || 0 },
              { role: 'GOVERNMENT', label: 'Government Officials', color: 'bg-emerald-500', count: roleCounts['GOVERNMENT'] || 0 },
              { role: 'EVALUATOR', label: 'Domain Evaluators', color: 'bg-amber-500', count: roleCounts['EVALUATOR'] || 0 },
              { role: 'ADMIN', label: 'System Administrators', color: 'bg-purple-500', count: roleCounts['ADMIN'] || 1 },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 uppercase font-mono">{item.role}</p>
                  </div>
                </div>
                <span className="text-base font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between"
            >
              <span>Manage User Roles &amp; Permissions</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Regulatory Governance Pipeline */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Procurement Pipeline Health</span>
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
                <span>Application to Pilot Conversion</span>
                <span>{stats?.total_applications ? Math.round(((stats?.active_pilots + (stats?.completed_pilots || 0)) / stats.total_applications) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{
                    width: `${stats?.total_applications ? Math.min(100, Math.round(((stats?.active_pilots + (stats?.completed_pilots || 0)) / stats.total_applications) * 100)) : 20}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-800 mb-1">
                <span>Pilot Completion &amp; Validation</span>
                <span>{stats?.active_pilots ? Math.round(((stats?.completed_pilots || 0) / (stats.active_pilots + (stats.completed_pilots || 1))) * 100) : 100}%</span>
              </div>
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{
                    width: `${stats?.active_pilots ? Math.min(100, Math.round(((stats?.completed_pilots || 0) / (stats.active_pilots + (stats.completed_pilots || 1))) * 100)) : 50}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-800 mb-1">
                <span>Pilot to Scale Contract Award</span>
                <span>{stats?.completed_pilots ? Math.round(((stats?.contracts_awarded || 0) / stats.completed_pilots) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{
                    width: `${stats?.completed_pilots ? Math.min(100, Math.round(((stats?.contracts_awarded || 0) / stats.completed_pilots) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>GFR Rule 149 exemption active for sandbox pilot awards.</span>
            </div>
          </div>
        </div>

        {/* Recent Audit Trail Preview */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span>Live Audit Logs</span>
            </h2>
            <Link to="/admin/activity" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No recent actions logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px] line-clamp-1">{log.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
