import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { registrationService } from '../../services/api';
import { Registration } from '../../types';
import { Modal } from '../../components/common/Modal';
import { TicketModal } from '../../components/common/TicketModal';
import { GoogleFormModal } from '../../components/common/GoogleFormModal';
import { Alert } from '../../components/common/Alert';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Trash2,
  QrCode,
  FileText,
} from 'lucide-react';

export const MyRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  // Modals state
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [ticketModalReg, setTicketModalReg] = useState<Registration | null>(null);
  const [googleFormReg, setGoogleFormReg] = useState<Registration | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  async function loadRegistrations() {
    try {
      setLoading(true);
      const res = await registrationService.getMyRegistrations();
      if (res.success) {
        setRegistrations(res.registrations);
      }
    } catch (err) {
      console.error('Failed to load registrations', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCancelClick = (reg: Registration) => {
    setSelectedReg(reg);
    setAlertInfo(null);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReg) return;
    try {
      setCancelLoading(true);
      const res = await registrationService.cancel(selectedReg.registration_id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Registration cancelled successfully.' });
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registration_id === selectedReg.registration_id
              ? { ...r, registration_status: 'cancelled' }
              : r
          )
        );
        setTimeout(() => setSelectedReg(null), 800);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to cancel.' });
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (filter === 'all') return true;
    return r.registration_status === filter;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            My Event Passes & Tickets
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Access your QR entry passes, complete event questionnaires, and view attendance verification status.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-[10px] self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({registrations.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
              filter === 'confirmed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
              filter === 'cancelled'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Registrations List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-slate-100 rounded-[14px] border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="text-center py-16 academic-card p-6 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No Event Passes Found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {filter === 'all'
              ? "You haven't enrolled in any events yet. Check out the campus catalog and grab your pass!"
              : `No registrations found with the "${filter}" filter.`}
          </p>
          <Link
            to="/events"
            className="btn-primary"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRegistrations.map((reg) => {
            const isCancelled = reg.registration_status === 'cancelled';
            const isAttended = reg.attendance_status === 'present';

            return (
              <div
                key={reg.registration_id}
                className={`p-5 rounded-[14px] border transition-all ${
                  isCancelled
                    ? 'bg-slate-50/70 border-slate-200 opacity-70'
                    : 'academic-card'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {reg.category_name}
                      </span>
                      <span>·</span>
                      <span className="text-xs text-slate-400 tabular-nums">Pass #CP-{reg.event_id}-{reg.registration_id}</span>

                      {/* Status Badges */}
                      {isCancelled ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Cancelled
                        </span>
                      ) : isAttended ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Attended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed Seat
                        </span>
                      )}

                      {reg.google_form_url && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border gap-1 ${
                          reg.google_form_completed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <FileText className="w-3 h-3" />
                          <span>{reg.google_form_completed ? 'Form Submitted' : 'Form Pending'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      <Link to={`/events/${reg.event_id}`} className="hover:text-indigo-600 transition-colors">
                        {reg.event_title}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums font-semibold text-slate-700">{reg.event_date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums">{reg.start_time} - {reg.end_time}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{reg.event_venue}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    {reg.google_form_url && !isCancelled && (
                      <button
                        onClick={() => setGoogleFormReg(reg)}
                        className="btn-secondary text-xs h-9"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        <span>Questionnaire</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        onClick={() => setTicketModalReg(reg)}
                        className="btn-primary text-xs h-9"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" />
                        <span>Show QR Pass</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelClick(reg)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-[10px] hover:bg-rose-50 transition-colors"
                        title="Cancel Registration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!selectedReg}
        onClose={() => setSelectedReg(null)}
        title="Cancel Event Pass"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setSelectedReg(null)}
              className="btn-secondary text-xs h-9"
            >
              Keep Pass
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={cancelLoading}
              className="btn-danger text-xs h-9"
            >
              {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to cancel your pass for <strong>{selectedReg?.event_title}</strong>? Your seat will be returned to the registration pool immediately.
        </p>
      </Modal>

      {/* Ticket Pass Modal */}
      {ticketModalReg && (
        <TicketModal
          isOpen={!!ticketModalReg}
          onClose={() => setTicketModalReg(null)}
          registration={ticketModalReg}
        />
      )}

      {/* Google Form Questionnaire Modal */}
      {googleFormReg && googleFormReg.google_form_url && (
        <GoogleFormModal
          isOpen={!!googleFormReg}
          onClose={() => setGoogleFormReg(null)}
          formUrl={googleFormReg.google_form_url}
          eventTitle={googleFormReg.event_title}
          registrationId={googleFormReg.registration_id}
          isCompleted={Boolean(googleFormReg.google_form_completed)}
          onStatusChange={(completed) => {
            setRegistrations((prev) =>
              prev.map((r) =>
                r.registration_id === googleFormReg.registration_id
                  ? { ...r, google_form_completed: completed ? 1 : 0 }
                  : r
              )
            );
          }}
        />
      )}
    </div>
  );
};
