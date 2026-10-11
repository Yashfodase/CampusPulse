import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CollegeEvent, EventMedia } from '../../types';
import { eventService, registrationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { TicketModal } from '../../components/common/TicketModal';
import { GoogleFormModal } from '../../components/common/GoogleFormModal';
import { Alert } from '../../components/common/Alert';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Phone,
  QrCode,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<CollegeEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registration and Form modals
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [googleFormModalOpen, setGoogleFormModalOpen] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [mediaList, setMediaList] = useState<EventMedia[]>([]);

  useEffect(() => {
    async function fetchEventDetails() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [res, mediaRes] = await Promise.all([
          eventService.getById(id),
          eventService.getMedia(id).catch(() => null),
        ]);

        if (res.success && res.event) {
          setEvent(res.event);
        } else {
          setError('Event not found or has been removed.');
        }

        if (mediaRes && mediaRes.success) {
          setMediaList(mediaRes.media);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    fetchEventDetails();
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    if (!event) return;

    try {
      setActionLoading(true);
      const res = await registrationService.register(event.id);
      if (res.success) {
        setAlertInfo({
          type: 'success',
          message: event.google_form_url
            ? 'Registration confirmed. Please complete the event questionnaire.'
            : 'Registration confirmed. Your verified digital pass is ready.',
        });
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                is_registered: true,
                user_registration_id: res.registrationId,
                registered_count: prev.registered_count + 1,
                seats_left: Math.max(0, prev.seats_left - 1),
              }
            : prev
        );
        setModalOpen(false);

        if (event.google_form_url) {
          setTimeout(() => setGoogleFormModalOpen(true), 400);
        } else {
          setTimeout(() => setTicketModalOpen(true), 400);
        }
      }
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err.response?.data?.message || 'Failed to register for this event.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event || !event.user_registration_id) return;
    try {
      setActionLoading(true);
      const res = await registrationService.cancel(event.user_registration_id);
      if (res.success) {
        setAlertInfo({
          type: 'success',
          message: 'Your registration has been cancelled successfully.',
        });
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                is_registered: false,
                user_registration_id: null,
                registered_count: Math.max(0, prev.registered_count - 1),
                seats_left: prev.seats_left + 1,
              }
            : prev
        );
        setCancelModalOpen(false);
      }
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel registration.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
        <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Event Not Available</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'Could not find this event.'}</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>
      </div>
    );
  }

  const isFull = event.registered_count >= event.max_participants;
  const isPast = new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0));
  const capacityPercent = Math.min(100, Math.round((event.registered_count / event.max_participants) * 100));

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Main Grid: 2 Cols Left, 1 Col Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Cover Hero Banner */}
          <div className="relative aspect-[16/9] w-full rounded-[14px] overflow-hidden bg-slate-100 border border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            {event.image ? (
              <img
                src={event.image}
                alt={event.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center mb-2 text-indigo-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{event.category_name}</span>
              </div>
            )}
            
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-indigo-700 border border-slate-200/80 shadow-xs">
                {event.category_name}
              </span>
            </div>
          </div>

          {/* Event Heading & Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-semibold text-indigo-600">{event.category_name}</span>
              <span>·</span>
              <span>Event #{event.id}</span>
              <span>·</span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                {event.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {event.title}
            </h1>
          </div>

          {/* About Section */}
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Event Description & Agenda
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Google Form Callout */}
          {event.google_form_url && (
            <div className="p-4 rounded-[14px] bg-indigo-50/60 border border-indigo-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Questionnaire Required</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This event includes an official Google Form questionnaire for team rosters or dietary requirements.
              </p>
              <button
                onClick={() => setGoogleFormModalOpen(true)}
                className="btn-primary text-xs h-9"
              >
                <span>View / Complete Questionnaire</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          )}

          {/* Organizer / Department info */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Faculty / Club Coordinator
            </h2>
            <div className="academic-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900">{event.organizer_name}</div>
                <div className="text-xs text-slate-500">Event Coordinator</div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                {event.organizer_email && (
                  <a
                    href={`mailto:${event.organizer_email}`}
                    className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{event.organizer_email}</span>
                  </a>
                )}
                {event.organizer_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{event.organizer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Sticky Registration / Payment Summary Card (4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="academic-card p-6 space-y-5">
            
            {/* Status indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Registration Status
              </span>
              {event.is_registered ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enrolled</span>
                </span>
              ) : isPast ? (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Completed
                </span>
              ) : isFull ? (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  House Full
                </span>
              ) : (
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Registration Open
                </span>
              )}
            </div>

            {/* Schedule Rows */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Date</div>
                  <div className="font-semibold text-slate-900 tabular-nums">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Time</div>
                  <div className="font-semibold text-slate-900 tabular-nums">
                    {event.start_time} - {event.end_time}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Venue</div>
                  <div className="font-semibold text-slate-900">
                    {event.venue}
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Enrolled Students:</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {event.registered_count} / {event.max_participants}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${capacityPercent}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFull ? 'bg-rose-500' : capacityPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                />
              </div>
              <div className="text-xs text-right font-medium text-slate-600 tabular-nums">
                {event.seats_left} seats remaining
              </div>
            </div>

            {/* Event Summary */}
            <div className="p-3.5 rounded-[10px] bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Event</span>
                <span className="font-semibold text-slate-900 truncate max-w-[190px]">{event.title}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-800 tabular-nums">{event.date}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Time</span>
                <span className="font-medium text-slate-800 tabular-nums">{event.start_time} - {event.end_time}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Venue</span>
                <span className="font-medium text-slate-800 truncate max-w-[190px]">{event.venue}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-slate-900 font-semibold">
                <span className="text-slate-600">Seats Available</span>
                <span className="text-indigo-600 font-bold tabular-nums">{event.seats_left} seats remaining</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {event.is_registered ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setTicketModalOpen(true)}
                    className="btn-primary w-full"
                  >
                    <QrCode className="w-4 h-4 mr-1.5" />
                    <span>View QR Ticket Pass</span>
                  </button>
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full py-2 text-rose-600 hover:text-rose-700 text-xs font-medium hover:bg-rose-50 rounded-[10px] transition-colors text-center"
                  >
                    Cancel Registration
                  </button>
                </div>
              ) : isPast ? (
                <div className="p-3 text-center rounded-[10px] bg-slate-100 text-xs font-medium text-slate-500 border border-slate-200">
                  Event has concluded.
                </div>
              ) : isFull ? (
                <div className="p-3 text-center rounded-[10px] bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                  All seats are fully booked.
                </div>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="btn-primary w-full"
                >
                  <span>Register for Event</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Event Registration"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs h-9"
            >
              Cancel
            </button>
            <button
              onClick={handleRegister}
              disabled={actionLoading}
              className="btn-primary text-xs h-9"
            >
              {actionLoading ? 'Registering...' : 'Confirm Registration'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Summary Card */}
          <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex justify-between items-start gap-2 border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Event</span>
                <p className="font-semibold text-slate-900 text-sm">{event.title}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {event.category_name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Date & Time</span>
                <span className="font-medium text-slate-800">{event.date} · {event.start_time || 'TBD'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Venue</span>
                <span className="font-medium text-slate-800">{event.venue}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-slate-900 font-semibold">
              <span className="text-slate-600">Seats Remaining</span>
              <span className="text-sm font-bold text-indigo-600 tabular-nums">
                {event.seats_left} seats
              </span>
            </div>
          </div>

          <p className="text-slate-500 leading-relaxed text-xs">
            A digital verified QR pass will be issued immediately to your student portal upon confirmation.
          </p>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Registration"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setCancelModalOpen(false)}
              className="btn-secondary text-xs h-9"
            >
              Keep Pass
            </button>
            <button
              onClick={handleCancelRegistration}
              disabled={actionLoading}
              className="btn-danger text-xs h-9"
            >
              {actionLoading ? 'Cancelling...' : 'Yes, Cancel Pass'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to cancel your pass for <strong>{event.title}</strong>? Your seat will be returned to the pool for other students immediately.
        </p>
      </Modal>

      {/* Ticket Pass Modal */}
      {event && (
        <TicketModal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          registration={{
            registration_id: event.user_registration_id || 0,
            registration_date: new Date().toISOString(),
            registration_status: 'confirmed',
            attendance_status: 'unmarked',
            student_id: user?.id || 0,
            student_name: user?.name || '',
            student_email: user?.email || '',
            student_phone: user?.phone || '',
            event_id: event.id,
            event_title: event.title,
            event_date: event.date,
            event_venue: event.venue,
            start_time: event.start_time,
            end_time: event.end_time,
            category_name: event.category_name,
            google_form_url: event.google_form_url,
          }}
        />
      )}

      {/* Google Form Modal */}
      {event.google_form_url && (
        <GoogleFormModal
          isOpen={googleFormModalOpen}
          onClose={() => setGoogleFormModalOpen(false)}
          formUrl={event.google_form_url}
          eventTitle={event.title}
          registrationId={event.user_registration_id}
          isCompleted={formCompleted}
          onStatusChange={(status) => setFormCompleted(status)}
        />
      )}
    </div>
  );
};
