import React, { useState, useEffect } from 'react';
import {
  Activity,
  Filter,
  Search,
  RefreshCw,
  Clock,
  Shield,
  FileText,
  User,
  Award,
  Layers,
  CheckCircle,
  Download,
} from 'lucide-react';
import { activityService } from '../../services/activityService';
import { ActivityLog } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('ALL');
  const { success, error } = useToast();

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (resourceFilter !== 'ALL') {
        params.resource_type = resourceFilter;
      }
      const data = await activityService.listActivity(params);
      setLogs(data);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to fetch platform audit activity.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await activityService.downloadAuditPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Statutory-Audit-Trail-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Audit PDF Downloaded', 'Official statutory audit report PDF saved.');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Could not download audit report PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [resourceFilter]);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.description.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.resource_type.toLowerCase().includes(q)
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('SUBMITTED') || action.includes('AWARDED')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('DELETED') || action.includes('REJECTED') || action.includes('TERMINATED') || action.includes('FAILED')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('STATUS') || action.includes('ROLE') || action.includes('REVIEW')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'user':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'challenge':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'contract':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'evaluation':
      case 'evaluator_assignment':
        return <CheckCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            <span>Platform Activity &amp; Audit Trail</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Immutable, timestamped audit log of all administrative, statutory, and procurement actions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download Statutory Audit Report (PDF)'}</span>
          </button>
          <button
            onClick={fetchActivity}
            className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search action, description, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
            <Filter className="w-4 h-4" />
            <span>Resource:</span>
          </div>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Resources</option>
            <option value="user">User</option>
            <option value="challenge">Challenge</option>
            <option value="application">Application</option>
            <option value="pilot">Pilot</option>
            <option value="pilot_submission">Submission</option>
            <option value="evaluation">Evaluation</option>
            <option value="contract">Contract</option>
          </select>
        </div>
      </div>

      {/* Activity Trail */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mr-2" />
            <span className="text-gray-500 text-sm font-medium">Retrieving audit logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No activity logged</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              No matching activity events were recorded in the audit trail.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-gray-50/70 transition-colors flex items-start space-x-4">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0 mt-0.5">
                  {getResourceIcon(log.resource_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Resource: {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <User className="w-3 h-3 mr-1 text-gray-400" />
                      Actor ID: {log.actor_user_id}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 font-medium">{log.description}</p>

                  {log.extra_metadata && Object.keys(log.extra_metadata).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 text-[11px] font-mono text-gray-600 overflow-x-auto">
                      {JSON.stringify(log.extra_metadata)}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0 text-xs text-gray-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityPage;
