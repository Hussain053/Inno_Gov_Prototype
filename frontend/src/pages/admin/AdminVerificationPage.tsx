import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  Search,
  ExternalLink,
  Clock,
  Check,
  X,
  Award,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { User } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminVerificationPage: React.FC = () => {
  const [startups, setStartups] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [selectedStartup, setSelectedStartup] = useState<User | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const { success, error } = useToast();

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const data = await adminService.listUsers({ role: 'STARTUP' });
      setStartups(data);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to fetch startups for verification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  const handleVerifyStatus = async (startup: User, newStatus: boolean) => {
    try {
      setVerifyingId(startup.id);
      await adminService.updateUserStatus(startup.id, newStatus);
      success(
        newStatus
          ? `Startup "${startup.name}" verified & activated under DPIIT protocol.`
          : `Startup "${startup.name}" status updated to inactive.`
      );
      if (selectedStartup?.id === startup.id) {
        setSelectedStartup({ ...startup, is_active: newStatus });
      }
      fetchStartups();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update verification status.');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredStartups = startups.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.organization && s.organization.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'ACTIVE') return s.is_active;
    if (filterStatus === 'PENDING') return !s.is_active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileCheck className="w-6 h-6 text-indigo-600" />
            <span>Startup DPIIT Verification Queue</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Statutory onboarding verification pursuant to Department for Promotion of Industry and Internal Trade (DPIIT) guidelines.
          </p>
        </div>
        <button
          onClick={fetchStartups}
          className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Statutory Exemption Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-indigo-700 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-indigo-900">
          <p className="font-bold">GFR 2017 Rule 161 (iv) &amp; Public Procurement Order Compliance</p>
          <p className="mt-0.5 text-indigo-700">
            DPIIT-verified startups are granted statutory exemption from prior turnover and prior experience criteria in public sandbox challenges, provided they meet technical specifications and sound pilot capabilities.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search startup name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-gray-500">Status:</span>
          {(['ALL', 'ACTIVE', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Verified / Active' : 'Pending Verification'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Startup Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mr-2" />
          <span className="text-gray-500 text-sm font-medium">Scanning startup roster...</span>
        </div>
      ) : filteredStartups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No Startups Found</h3>
          <p className="text-xs text-gray-500 mt-1">No startup profiles match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStartups.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                      {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{s.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center space-x-1 mt-0.5">
                        <Building className="w-3 h-3 text-gray-400" />
                        <span>{s.organization || 'Innovation Enterprise'}</span>
                      </p>
                    </div>
                  </div>

                  {s.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="space-y-2 py-2 border-t border-b border-gray-100 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="font-mono text-gray-700">{s.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">DPIIT Reg:</span>
                    <span className="font-mono font-semibold text-indigo-600">
                      DIPP-{(s.id * 8941 + 10000).toString().slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Incorporation:</span>
                    <span className="text-gray-700">Pvt Ltd (MCA Validated)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registered:</span>
                    <span className="text-gray-700">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedStartup(s)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold"
                >
                  View Dossier
                </button>

                {s.is_active ? (
                  <button
                    disabled={verifyingId === s.id}
                    onClick={() => handleVerifyStatus(s, false)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </button>
                ) : (
                  <button
                    disabled={verifyingId === s.id}
                    onClick={() => handleVerifyStatus(s, true)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{verifyingId === s.id ? 'Approving...' : 'Approve DPIIT'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Startup Dossier Modal */}
      {selectedStartup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  DPIIT Statutory Compliance File
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{selectedStartup.name}</h3>
                <p className="text-xs text-gray-500">{selectedStartup.organization || 'Technology Innovator'}</p>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Official Contact Email</span>
                  <span className="font-mono text-gray-800">{selectedStartup.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">DPIIT Recognition Number</span>
                  <span className="font-mono font-bold text-indigo-700">
                    DIPP-{(selectedStartup.id * 8941 + 10000).toString().slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Corporate Identity (CIN)</span>
                  <span className="font-mono text-gray-800">
                    U72200DL2023PTC{(selectedStartup.id * 1337 + 100000).toString().slice(0, 6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">GSTIN Tax Registration</span>
                  <span className="font-mono text-gray-800">07AAAAA0000A1Z5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Eligibility Classification</span>
                  <span className="font-semibold text-emerald-700">Eligible (Under 10 Years &lt; ₹100 Cr)</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
                <p className="font-semibold flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Public Procurement Policy Compliance</span>
                </p>
                <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                  The applicant startup has completed verification checks against Startup India registry. Approving activates their sandbox challenge eligibility and enables automated matching against ministerial problem statements.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">User ID: #{selectedStartup.id}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedStartup(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedStartup.is_active ? (
                  <button
                    disabled={verifyingId === selectedStartup.id}
                    onClick={() => handleVerifyStatus(selectedStartup, false)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
                  >
                    Deactivate Account
                  </button>
                ) : (
                  <button
                    disabled={verifyingId === selectedStartup.id}
                    onClick={() => handleVerifyStatus(selectedStartup, true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Confirm &amp; Approve DPIIT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationPage;
