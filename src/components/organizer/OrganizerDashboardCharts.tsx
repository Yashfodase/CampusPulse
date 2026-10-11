import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { eventService } from '../../services/api';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';

interface AnalyticsPayload {
  summary: {
    totalEvents: number;
    totalCapacity: number;
    totalRegistered: number;
    totalAttended: number;
    overallFillRate: number;
    turnoutRate: number;
  };
  dailyTrend: Array<{ date: string; registrations: number }>;
  eventComparison: Array<{
    id: number;
    title: string;
    shortTitle: string;
    date: string;
    capacity: number;
    registered: number;
    attended: number;
    category_name: string;
    fillRate: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    total_registrations: number;
    event_count: number;
  }>;
  attendanceBreakdown: Array<{
    attendance_status: string;
    count: number;
  }>;
}

interface OrganizerDashboardChartsProps {
  className?: string;
}

export const OrganizerDashboardCharts: React.FC<OrganizerDashboardChartsProps> = ({
  className = '',
}) => {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trend' | 'capacity' | 'turnout'>('trend');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const res = await eventService.getOrganizerAnalytics();
      if (res.success && res.analytics) {
        setData(res.analytics);
      } else {
        setError('No analytics data available.');
      }
    } catch (err: any) {
      console.error('Failed to fetch organizer analytics', err);
      setError('Unable to load chart metrics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4 shadow-2xs ${className}`}>
        <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center space-y-3 shadow-2xs ${className}`}>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'No chart data'}</p>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const attendancePieData = [
    {
      name: 'Admitted & Present',
      value: data.summary.totalAttended,
      color: '#10b981', // emerald
    },
    {
      name: 'Registered / Waiting',
      value: Math.max(0, data.summary.totalRegistered - data.summary.totalAttended),
      color: '#4f46e5', // indigo
    },
    {
      name: 'Unfilled Capacity',
      value: Math.max(0, data.summary.totalCapacity - data.summary.totalRegistered),
      color: '#94a3b8', // slate
    },
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 space-y-6 shadow-2xs ${className}`}>
      
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Registration Trends & Capacity Intelligence</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Event Registration Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize sign-up volume over time, seat fill-rates, and live gate attendance.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-md self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'trend'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Timeline Trend</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capacity')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'capacity'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Capacity Fill</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('turnout')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'turnout'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Gate Turnout</span>
          </button>
        </div>
      </div>

      {/* KPI Trend Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/60 dark:border-slate-700">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Registrations</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {data.summary.totalRegistered}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Across {data.summary.totalEvents} events</div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/60 dark:border-slate-700">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Overall Seat Fill Rate</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
            {data.summary.overallFillRate}%
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">
            {data.summary.totalRegistered} / {data.summary.totalCapacity} capacity
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/60 dark:border-slate-700">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Verified Gate Turnout</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {data.summary.totalAttended}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
            {data.summary.turnoutRate}% conversion
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/60 dark:border-slate-700">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Seats Remaining</div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
            {Math.max(0, data.summary.totalCapacity - data.summary.totalRegistered)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Open for enrollment</div>
        </div>
      </div>

      {/* Main Visualizations Rendered with Recharts */}
      <div className="space-y-4">
        
        {/* Tab 1: Timeline Trend (AreaChart) */}
        {activeTab === 'trend' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Daily Student Registration Trajectory
              </span>
              <span className="text-[11px]">Cumulative trend by registration date</span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.dailyTrend}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#c7d2fe', fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val} students`, 'Registered']}
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#regGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Capacity vs Enrolment (BarChart) */}
        {activeTab === 'capacity' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Event Capacity vs. Enrolled Students
              </span>
              <span className="text-[11px]">Comparison across each organized event</span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.eventComparison}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="shortTitle"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Bar
                    dataKey="capacity"
                    name="Max Capacity"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="registered"
                    name="Enrolled Students"
                    fill="#4f46e5"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="attended"
                    name="Admitted Present"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: Gate Turnout & Attendance Breakdown (PieChart / Donut) */}
        {activeTab === 'turnout' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(val: any) => [`${val} seats`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Turnout Stats Ledger */}
            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Gate Turnout & Attendance Conversion
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Turnout ratio reflecting verified gate check-in scans at the event entrance versus total pre-booked registrations.
              </p>

              <div className="space-y-2 pt-1">
                {attendancePieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {item.value} seats
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
