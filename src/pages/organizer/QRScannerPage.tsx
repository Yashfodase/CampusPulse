import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/api';
import { CollegeEvent } from '../../types';
import { QRScanner, CheckInResult } from '../../components/organizer/QRScanner';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const QRScannerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<CollegeEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalAdmittedToday, setTotalAdmittedToday] = useState<number>(0);

  useEffect(() => {
    async function loadEventInfo() {
      if (!id) return;
      try {
        setLoading(true);
        const [eventRes, participantsRes] = await Promise.all([
          eventService.getById(id),
          eventService.getParticipants(id),
        ]);

        if (eventRes.success) {
          setEvent(eventRes.event);
        }
        if (participantsRes.success) {
          setTotalAdmittedToday(participantsRes.stats.present || 0);
        }
      } catch (err) {
        console.error('Failed to load event for scanner page', err);
      } finally {
        setLoading(false);
      }
    }
    loadEventInfo();
  }, [id]);

  const handleCheckInSuccess = (result: CheckInResult) => {
    if (result.status === 'admitted') {
      setTotalAdmittedToday((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Back button and page title */}
      <div>
        <Link
          to={id ? `/organizer/events/${id}/participants` : '/organizer/events'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Attendee Roster</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Entry Gate QR Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Live camera ticket scanning with instant database check-in verification.
            </p>
          </div>

          {event && (
            <div className="p-2.5 bg-slate-100 rounded-[10px] text-xs flex items-center gap-3 border border-slate-200">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="tabular-nums">{totalAdmittedToday}</span>
                <span>/ {event.registered_count} Admitted</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {event && (
        <div className="p-4 bg-indigo-50/60 rounded-[14px] border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div>
            <div className="font-bold text-slate-900 text-sm">{event.title}</div>
            <div className="flex items-center gap-3 text-slate-600 mt-0.5">
              <span>{event.date} · {event.start_time} - {event.end_time}</span>
              <span>·</span>
              <span>{event.venue}</span>
            </div>
          </div>

          <Link
            to={`/organizer/events/${id}/participants`}
            className="btn-secondary text-xs h-8"
          >
            View Live Roster
          </Link>
        </div>
      )}

      {/* Dedicated QRScanner Component */}
      <QRScanner
        eventId={id}
        eventTitle={event?.title}
        autoCheckIn={true}
        onCheckInSuccess={handleCheckInSuccess}
      />

    </div>
  );
};
