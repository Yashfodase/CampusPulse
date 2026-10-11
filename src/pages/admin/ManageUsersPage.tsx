import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { User, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { Search, Trash2, User as UserIcon } from 'lucide-react';

export const ManageUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        role: roleFilter || undefined,
        q: searchQuery || undefined,
      });
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Failed to load user list.' });
    } finally {
      setLoading(false);
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setAlertInfo(null);
      const res = await adminService.updateUserRole(userId, newRole);
      if (res.success) {
        setAlertInfo({ type: 'success', message: `User role successfully updated to ${newRole}.` });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserRole } : u))
        );
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to update user role.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await adminService.deleteUser(deleteTarget.id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'User account deleted.' });
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to delete user.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          User & Role Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Supervise student accounts, promote faculty club coordinators to organizers, or manage administrative rights.
        </p>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Filter and Search Bar */}
      <div className="academic-card p-3 flex flex-col sm:flex-row gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or college email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-base text-xs"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="organizer">Organizers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-[14px] animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center academic-card space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <UserIcon className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No users found</h3>
          <p className="text-xs text-slate-500">No account matched your role or query criteria.</p>
        </div>
      ) : (
        <div className="academic-card overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Activity</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCurrent = Number(u.id) === Number(currentUser?.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">ID #{u.id}</div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-600">
                        {u.email}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-slate-500">
                        {u.phone || '—'}
                      </td>

                      {/* Role Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-[3px] focus:ring-indigo-600/20 focus:border-indigo-600 text-slate-900 capitalize disabled:opacity-60"
                        >
                          <option value="student">Student</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Activity */}
                      <td className="py-3 px-4 tabular-nums text-slate-600">
                        {u.role === 'student' && `${u.activity_count || 0} registrations`}
                        {u.role === 'organizer' && `${u.activity_count || 0} events created`}
                        {u.role === 'admin' && 'Full privileges'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user account"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete User Account"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
              className="btn-secondary text-xs h-9"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="btn-danger text-xs h-9"
            >
              {deleteLoading ? 'Deleting...' : 'Confirm Account Deletion'}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Are you sure you want to permanently delete the account for{' '}
              <strong className="text-slate-900">{deleteTarget.name}</strong> ({deleteTarget.email})?
            </p>
            <p className="text-slate-500">
              All registrations and activities associated with this student or organizer will be removed from the database.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};
