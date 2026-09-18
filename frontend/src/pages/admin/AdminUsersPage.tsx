import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Building,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { User, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Role Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STARTUP');
  const [submittingRole, setSubmittingRole] = useState<boolean>(false);

  // Status Toggle Modal
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState<boolean>(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (roleFilter !== 'ALL') {
        params.role = roleFilter;
      }
      if (statusFilter === 'ACTIVE') {
        params.is_active = true;
      } else if (statusFilter === 'INACTIVE') {
        params.is_active = false;
      }

      const data = await adminService.listUsers(params);
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      error(err.response?.data?.detail || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    try {
      setSubmittingRole(true);
      await adminService.updateUserRole(editingUser.id, selectedRole);
      success(`Updated role for ${editingUser.name} to ${selectedRole}.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update user role.');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!togglingUser) return;
    try {
      setSubmittingStatus(true);
      const newStatus = !togglingUser.is_active;
      await adminService.updateUserStatus(togglingUser.id, newStatus);
      success(`User account has been ${newStatus ? 'activated' : 'deactivated'}.`);
      setTogglingUser(null);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to modify user status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.organization && u.organization.toLowerCase().includes(query))
    );
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'GOVERNMENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'EVALUATOR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STARTUP':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Platform User Directory</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system access, adjust RBAC permissions, and oversee account activation status.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or org..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Roles</option>
            <option value="STARTUP">Startup</option>
            <option value="GOVERNMENT">Government</option>
            <option value="EVALUATOR">Evaluator</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mr-2" />
            <span className="text-gray-500 text-sm font-medium">Retrieving registered users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No users found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              No registered user accounts match your active search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Organization</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Registered On</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs flex-shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center space-x-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        {u.organization ? (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            <span>{u.organization}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {/* Change Role Button */}
                        <button
                          disabled={isSelf}
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedRole(u.role);
                          }}
                          className={`inline-flex items-center p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            isSelf
                              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                              : 'text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-indigo-600'
                          }`}
                          title={isSelf ? 'Cannot edit your own role' : 'Change User Role'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          disabled={isSelf}
                          onClick={() => setTogglingUser(u)}
                          className={`inline-flex items-center p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            isSelf
                              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                              : u.is_active
                              ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                          title={
                            isSelf
                              ? 'Cannot deactivate yourself'
                              : u.is_active
                              ? 'Suspend User'
                              : 'Activate User'
                          }
                        >
                          {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Change User Role</h3>
                <p className="text-xs text-gray-500">
                  Assigning new RBAC permissions to <span className="font-semibold">{editingUser.name}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 py-2">
              <label className="text-xs font-semibold text-gray-700">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(['STARTUP', 'GOVERNMENT', 'EVALUATOR', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${
                      selectedRole === r
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="uppercase tracking-wider">{r}</div>
                    <span className="text-[10px] font-normal text-gray-500 block mt-0.5">
                      {r === 'STARTUP' && 'Submits solutions & pilots'}
                      {r === 'GOVERNMENT' && 'Posts challenges & awards'}
                      {r === 'EVALUATOR' && 'Domain scores & audits'}
                      {r === 'ADMIN' && 'Platform governance'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={submittingRole || selectedRole === editingUser.role}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingRole ? 'Updating...' : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {togglingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  togglingUser.is_active ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {togglingUser.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                </h3>
                <p className="text-xs text-gray-500">
                  User: <span className="font-semibold">{togglingUser.name}</span> ({togglingUser.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {togglingUser.is_active
                ? 'Deactivating this user will instantly invalidate their JWT authentication session and block further access to InnoGov endpoints.'
                : 'Reactivating will restore login access and allow this user to participate according to their assigned role.'}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setTogglingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={submittingStatus}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white ${
                  togglingUser.is_active
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-50`}
              >
                {submittingStatus
                  ? 'Processing...'
                  : togglingUser.is_active
                  ? 'Deactivate User'
                  : 'Reactivate User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
