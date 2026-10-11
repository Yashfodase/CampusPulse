import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { DashboardStats } from '../../types';
import { CountUpNumber } from '../../components/common/CountUpNumber';
import {
  Shield,
  ArrowRight,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Layers,
  Award,
  FileSpreadsheet,
  FileCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await adminService.getStats();
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Filtered & Paginated recent registrations
  const filteredRegistrations = useMemo(() => {
    if (!stats?.recentRegistrations) return [];
    return stats.recentRegistrations.filter((r) => {
      const matchesSearch =
        r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.event_title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        attendanceFilter === 'all' ? true : r.attendance_status === attendanceFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stats?.recentRegistrations, searchQuery, attendanceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-enter">
      
      {/* Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar (3 Cols) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[14px] border border-slate-200 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Administration
              </span>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                Central Admin Console
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mt-1">
                Super Admin
              </span>
            </div>

            <nav className="space-y-1 text-sm font-medium">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-indigo-50 text-indigo-700 font-semibold"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span>Overview</span>
              </Link>

              <Link
                to="/admin/events"
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Event Approvals ({stats?.totalEvents ?? 0})</span>
              </Link>

              <Link
                to="/admin/users"
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>User Roles</span>
              </Link>

              <Link
                to="/admin/categories"
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Award className="w-4 h-4 text-slate-400" />
                <span>Event Categories</span>
              </Link>

              <Link
                to="/admin/registrations"
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                <span>All Registrations</span>
              </Link>

              <Link
                to="/admin/reports"
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <FileCheck className="w-4 h-4 text-slate-400" />
                <span>Audit & Reports</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to="/admin/events"
                className="btn-primary w-full text-xs font-semibold"
              >
                Review Events
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[14px] border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Campus Governance</span>
            </div>
            <p className="leading-relaxed">
              Supervise institution-wide event lifecycle, approve student club activities, and generate attendance audits.
            </p>
          </div>
        </aside>

        {/* Right Main Content (9 Cols) */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Administration Analytics
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                College event metrics, registered student profiles, and venue attendance records.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start">
              <Link
                to="/admin/reports"
                className="btn-secondary"
              >
                Attendance Reports
              </Link>
              <Link
                to="/admin/events"
                className="btn-primary"
              >
                Event Approvals
              </Link>
            </div>
          </div>

          {/* 4 Stat Cards: Tinted circle, big number, label, small trend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat Card 1: Students */}
            <div className="academic-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Students</span>
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  <CountUpNumber value={stats?.totalStudents ?? 0} />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+14% active this semester</span>
                </div>
              </div>
            </div>

            {/* Stat Card 2: Organizers */}
            <div className="academic-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Club Organizers</span>
                <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  <CountUpNumber value={stats?.totalOrganizers ?? 0} />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Verified faculty & clubs
                </div>
              </div>
            </div>

            {/* Stat Card 3: Registrations */}
            <div className="academic-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Campus Registrations</span>
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  <CountUpNumber value={stats?.totalRegistrations ?? 0} />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+28% vs prior term</span>
                </div>
              </div>
            </div>

            {/* Stat Card 4: Verified Attended */}
            <div className="academic-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Verified Attendance</span>
                <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  <CountUpNumber value={stats?.attendedCount ?? 0} />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Door check-ins confirmed
                </div>
              </div>
            </div>

          </div>

          {/* Clean Analytics Visual Chart Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Category Distribution Chart */}
            <div className="academic-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Events by Category</h3>
                <Link to="/admin/categories" className="text-xs text-indigo-600 hover:underline font-medium">
                  Manage Categories
                </Link>
              </div>

              <div className="space-y-3">
                {stats?.categoryStats?.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span className="font-medium">{cat.name}</span>
                      <span className="tabular-nums font-semibold text-slate-900">{cat.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (cat.count / (stats.totalEvents || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Verification Chart */}
            <div className="academic-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Attendance Breakdown</h3>
                <Link to="/admin/reports" className="text-xs text-indigo-600 hover:underline font-medium">
                  Full Report
                </Link>
              </div>

              <div className="space-y-3">
                {stats?.attendanceStats?.map((att) => (
                  <div
                    key={att.attendance_status}
                    className="p-3 bg-slate-50 rounded-[10px] border border-slate-200/70 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        att.attendance_status === 'present'
                          ? 'bg-emerald-500'
                          : att.attendance_status === 'absent'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`} />
                      <span className="capitalize text-xs font-semibold text-slate-700">
                        {att.attendance_status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 tabular-nums">
                      {att.count} students
                    </div>
                  </div>
                ))}
                {(!stats?.attendanceStats || stats.attendanceStats.length === 0) && (
                  <div className="text-xs text-slate-400 text-center py-6">
                    No attendance logs recorded yet.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Data Table with Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Registrations Table
                </h2>
                <p className="text-xs text-slate-500">
                  Search by student name, email, or event title.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search registrations..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input-base pl-9 text-xs w-48 sm:w-60"
                  />
                </div>

                <div className="relative">
                  <select
                    value={attendanceFilter}
                    onChange={(e) => {
                      setAttendanceFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="input-base text-xs pr-8 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="unmarked">Unmarked</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              {loading ? (
                <div className="p-8 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">
                    No matching registrations found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Adjust your query filter or wait for students to register for events.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Registered Event</th>
                          <th>Event Date</th>
                          <th>Registration Date</th>
                          <th className="text-right">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRegistrations.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <div className="font-semibold text-slate-900">{r.student_name}</div>
                              <div className="text-xs text-slate-400">{r.student_email}</div>
                            </td>
                            <td>
                              <span className="font-medium text-slate-800 line-clamp-1 max-w-[220px]">
                                {r.event_title}
                              </span>
                            </td>
                            <td className="text-xs text-slate-600 tabular-nums">
                              {r.event_date}
                            </td>
                            <td className="text-xs text-slate-500 tabular-nums">
                              {new Date(r.registration_date).toLocaleDateString()}
                            </td>
                            <td className="text-right">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                                  r.attendance_status === 'present'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : r.attendance_status === 'absent'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {r.attendance_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      Showing {(currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, filteredRegistrations.length)} of{' '}
                      {filteredRegistrations.length} entries
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-[8px] border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-2 font-medium text-slate-700">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-[8px] border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </main>
      </div>

    </div>
  );
};

