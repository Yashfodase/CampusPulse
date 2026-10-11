import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { Registration } from '../../types';
import { Search, Ticket, CheckCircle2, XCircle } from 'lucide-react';

export const ManageRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, [attendanceFilter]);

  async function loadRegistrations() {
    try {
      setLoading(true);
      const res = await adminService.getAllRegistrations({
        attendance_status: attendanceFilter || undefined,
      });
      if (res.success) {
        setRegistrations(res.registrations);
      }
    } catch (err) {
      console.error('Failed to load global registrations', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = registrations.filter((r) =>
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.event_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campus-Wide Registrations Master List
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Audit student event passes, check attendance validity, and search across all departmental events.
          </p>
        </div>

        <div className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-[8px] tabular-nums font-medium self-start">
          Total Entries: {registrations.length}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="academic-card p-3 flex flex-col sm:flex-row gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, college email, or event title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base pl-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="input-base text-xs"
          >
            <option value="">All Attendance States</option>
            <option value="present">Present (Attended)</option>
            <option value="absent">Absent</option>
            <option value="unmarked">Unmarked</option>
          </select>
        </div>
      </div>

      {/* Registrations Master Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-[14px] animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center academic-card space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No registrations found</h3>
          <p className="text-xs text-slate-500">No registration records matched your query.</p>
        </div>
      ) : (
        <div className="academic-card overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Pass ID</th>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Event</th>
                  <th className="py-3 px-4 font-semibold">Event Date</th>
                  <th className="py-3 px-4 font-semibold">Registration Date</th>
                  <th className="py-3 px-4 font-semibold">Google Form</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.registration_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      #{r.registration_id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.student_name}</div>
                      <div className="text-[11px] text-slate-400">{r.student_email}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-medium text-slate-800 truncate">{r.event_title}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">{r.category_name}</div>
                    </td>

                    <td className="py-3 px-4 tabular-nums text-slate-600">
                      {r.event_date}
                    </td>

                    <td className="py-3 px-4 tabular-nums text-slate-500">
                      {new Date(r.registration_date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      {r.google_form_url ? (
                        Number(r.google_form_completed) === 1 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Pending
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400">None</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        r.registration_status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.registration_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {r.attendance_status === 'present' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Present</span>
                        </span>
                      ) : r.attendance_status === 'absent' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          <span>Absent</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Unmarked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
