import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registrationService } from '../../services/api';
import { Registration } from '../../types';
import { TicketModal } from '../../components/common/TicketModal';
import { GoogleFormModal } from '../../components/common/GoogleFormModal';
import { RealtimeNotificationPanel } from '../../components/student/RealtimeNotificationPanel';
import { CountUpNumber } from '../../components/common/CountUpNumber';
import {
  Calendar,
  Ticket,
  CheckCircle,
  ArrowRight,
  MapPin,
  Compass,
  QrCode,
  FileText,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketModalReg, setTicketModalReg] = useState<Registration | null>(null);
  const [googleFormReg, setGoogleFormReg] = useState<Registration | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await registrationService.getMyRegistrations();
        if (res.success) {
          setRegistrations(res.registrations);
        }
      } catch (err) {
        console.error('Failed to load student registrations', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const confirmedRegistrations = registrations.filter((r) => r.registration_status === 'confirmed');
  const upcomingRegistrations = confirmedRegistrations.filter(
    (r) => new Date(r.event_date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );
  const attendedCount = registrations.filter((r) => r.attendance_status === 'present').length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Student Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, {user?.name} · Track your event passes, check-in history, and reminders.
          </p>
        </div>
        <Link
          to="/events"
          className="btn-primary self-start"
        >
          <Compass className="w-4 h-4 mr-1.5" />
          <span>Browse Events</span>
        </Link>
      </div>

      {/* Metric Cards: Tinted circle, big number, label, small trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1 */}
        <div className="academic-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Upcoming Events</span>
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              <CountUpNumber value={upcomingRegistrations.length} />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Scheduled on your campus calendar
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="academic-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Confirmed Passes</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              <CountUpNumber value={confirmedRegistrations.length} />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active student registrations
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="academic-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Events Attended</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              <CountUpNumber value={attendedCount} />
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Verified door check-ins
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upcoming Registered Events List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Upcoming Registered Events
            </h2>
            <Link
              to="/student/registrations"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              <span>View all passes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-100 rounded-[14px] animate-pulse border border-slate-200"
                />
              ))}
            </div>
          ) : upcomingRegistrations.length === 0 ? (
            <div className="p-10 text-center academic-card space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                You haven't registered for any upcoming events yet.
              </p>
              <Link
                to="/events"
                className="btn-primary"
              >
                Find an Event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRegistrations.slice(0, 4).map((reg) => (
                <div
                  key={reg.registration_id}
                  className="academic-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {reg.category_name}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      <Link to={`/events/${reg.event_id}`} className="hover:text-indigo-600 transition-colors">
                        {reg.event_title}
                      </Link>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums font-medium text-slate-700">{reg.event_date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{reg.event_venue}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {reg.google_form_url && (
                      <button
                        onClick={() => setGoogleFormReg(reg)}
                        className="btn-secondary text-xs h-9"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        <span>Form</span>
                      </button>
                    )}

                    <button
                      onClick={() => setTicketModalReg(reg)}
                      className="btn-primary text-xs h-9"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1" />
                      <span>Ticket Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Campus Alerts */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Campus Broadcasts
          </h2>
          <div className="academic-card p-4">
            <RealtimeNotificationPanel />
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {ticketModalReg && (
        <TicketModal
          isOpen={!!ticketModalReg}
          onClose={() => setTicketModalReg(null)}
          registration={ticketModalReg}
        />
      )}

      {/* Google Form Modal */}
      {googleFormReg && googleFormReg.google_form_url && (
        <GoogleFormModal
          isOpen={!!googleFormReg}
          onClose={() => setGoogleFormReg(null)}
          formUrl={googleFormReg.google_form_url}
          eventTitle={googleFormReg.event_title}
          registrationId={googleFormReg.registration_id}
          isCompleted={Boolean(googleFormReg.google_form_completed)}
        />
      )}
    </div>
  );
};
