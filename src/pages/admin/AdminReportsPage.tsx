import React, { useEffect, useState } from 'react';
import { adminService, eventService } from '../../services/api';
import { DashboardStats, CollegeEvent } from '../../types';
import { Printer } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        const [statsRes, eventsRes] = await Promise.all([
          adminService.getStats(),
          eventService.getAll({ status: 'approved' }),
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (eventsRes.success) setEvents(eventsRes.events);
      } catch (err) {
        console.error('Failed to load report data', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  const totalSeats = events.reduce((acc, curr) => acc + curr.max_participants, 0);
  const totalRegistrations = stats?.totalRegistrations || 0;
  const attendedCount = stats?.attendedCount || 0;
  const attendanceRate = totalRegistrations > 0 ? Math.round((attendedCount / totalRegistrations) * 100) : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header with Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campus Event & Attendance Executive Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official summary report of campus participation, seat utilization, and venue turnout.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-secondary text-xs h-9 self-start"
        >
          <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* High-level KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="academic-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="text-xs text-slate-500 font-medium">Total Campus Events</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {events.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalSeats} total seats provisioned</div>
        </div>

        <div className="academic-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="text-xs text-slate-500 font-medium">Student Enrolments</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {totalRegistrations}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all departments</div>
        </div>

        <div className="academic-card p-5 border-emerald-200 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="text-xs text-emerald-800 font-medium">Verified Turnout</div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {attendedCount}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Scanned at venues</div>
        </div>

        <div className="academic-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="text-xs text-indigo-700 font-medium">Attendance Rate</div>
          <div className="text-2xl font-bold text-indigo-600 tabular-nums mt-1">
            {attendanceRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Attendee conversion</div>
        </div>
      </div>

      {/* Events Participation Breakdown Table */}
      <div className="academic-card shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden space-y-3 p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Departmental Event Utilization Breakdown
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Event</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Organizer</th>
                <th className="py-2.5 px-3 font-semibold">Capacity</th>
                <th className="py-2.5 px-3 font-semibold">Enrolled</th>
                <th className="py-2.5 px-3 font-semibold text-right">Fill %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => {
                const fillPercent = Math.min(100, Math.round((ev.registered_count / ev.max_participants) * 100));
                return (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                      {ev.title}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-600 font-medium">{ev.category_name}</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-600">{ev.date}</td>
                    <td className="py-2.5 px-3 text-slate-600">{ev.organizer_name}</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-600">{ev.max_participants}</td>
                    <td className="py-2.5 px-3 tabular-nums font-semibold text-slate-900">{ev.registered_count}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-medium text-slate-800">
                      {fillPercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* College Project Certification Summary Box */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-[14px] text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-900 text-sm">
          System Verification & Viva Audit Notes
        </div>
        <p className="leading-relaxed">
          This project implements full normalized relational schemas with foreign key cascading, JWT stateless authentication, bcrypt password hashing, and role-based authorization for Students, Organizers, and Administrators.
        </p>
        <div className="pt-2 text-slate-400 text-[11px]">
          CampusPulse — College Event Management System Capstone Project.
        </div>
      </div>

    </div>
  );
};
