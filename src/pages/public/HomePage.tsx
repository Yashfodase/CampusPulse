import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CollegeEvent, Category, Registration } from '../../types';
import { eventService, categoryService, registrationService } from '../../services/api';
import { EventCard } from '../../components/common/EventCard';
import { Modal } from '../../components/common/Modal';
import { TicketModal } from '../../components/common/TicketModal';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Compass,
  ArrowRight,
  ShieldCheck,
  FileText,
  ChevronRight,
  CheckCircle2,
  Ticket,
  Search,
  QrCode,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcomingEvents, setUpcomingEvents] = useState<CollegeEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration modal state
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ticketModalReg, setTicketModalReg] = useState<Registration | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [eventsRes, catRes] = await Promise.all([
          eventService.getAll({ status: 'approved', upcoming_only: true, sort: 'asc' }),
          categoryService.getAll(),
        ]);
        if (eventsRes.success) {
          setUpcomingEvents(eventsRes.events.slice(0, 6));
        }
        if (catRes.success) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegisterClick = (event: CollegeEvent) => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${event.id}` } });
      return;
    }
    setSelectedEvent(event);
    setAlertInfo(null);
  };

  const handleConfirmRegistration = async () => {
    if (!selectedEvent) return;
    try {
      setRegLoading(true);
      const res = await registrationService.register(selectedEvent.id);
      if (res.success) {
        setAlertInfo({
          type: 'success',
          message: 'Registration confirmed. Your verified QR pass has been generated.',
        });

        // Update local status
        setUpcomingEvents((prev) =>
          prev.map((ev) =>
            ev.id === selectedEvent.id
              ? {
                  ...ev,
                  is_registered: true,
                  registered_count: ev.registered_count + 1,
                  seats_left: Math.max(0, ev.seats_left - 1),
                }
              : ev
          )
        );

        setTicketModalReg({
          registration_id: res.registrationId,
          registration_date: new Date().toISOString(),
          registration_status: 'confirmed',
          attendance_status: 'unmarked',
          student_id: user?.id || 0,
          student_name: user?.name || '',
          student_email: user?.email || '',
          student_phone: user?.phone || '',
          event_id: selectedEvent.id,
          event_title: selectedEvent.title,
          event_date: selectedEvent.date,
          event_venue: selectedEvent.venue,
          start_time: selectedEvent.start_time,
          end_time: selectedEvent.end_time,
          category_name: selectedEvent.category_name,
          google_form_url: selectedEvent.google_form_url || res.google_form_url,
        });

        setTimeout(() => setSelectedEvent(null), 600);
      }
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err.response?.data?.message || 'Failed to complete registration.',
      });
    } finally {
      setRegLoading(false);
    }
  };

  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/events?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/events');
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 animate-page-enter">
      
      {/* Hero Section: subtle radial blue glow behind headline only */}
      <section className="relative pt-12 pb-14 sm:pt-20 sm:pb-20 border-b border-[#1F2D4A] overflow-hidden">
        {/* Subtle Radial Blue Glow Background */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#16223B] text-[#3B82F6] border border-[#1F2D4A] shadow-sm text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>CampusPulse · College Event Management Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F1F5F9] leading-tight">
              Discover and join campus events
            </h1>

            <p className="text-sm sm:text-base text-[#7C8BA8] max-w-2xl mx-auto leading-relaxed">
              Explore university workshops, tech hackathons, cultural festivals, and athletic tournaments. Reserve seats and access verified digital QR passes instantly.
            </p>

            {/* Hero Search Bar */}
            <form onSubmit={handleHeroSearchSubmit} className="max-w-xl mx-auto pt-2">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-[#7C8BA8]" />
                <input
                  type="text"
                  placeholder="Search events by title, topics, or venue..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="w-full pl-11 pr-28 py-3 text-sm bg-[#0F1829] border border-[#1F2D4A] rounded-[10px] focus:outline-none focus:ring-[3px] focus:ring-[#3B82F6]/25 focus:border-[#3B82F6] text-[#F1F5F9] placeholder:text-[#7C8BA8] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-[#F1F5F9] font-medium text-xs rounded-[8px] transition-colors shadow-sm"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/events"
                className="btn-primary text-xs sm:text-sm"
              >
                <Compass className="w-4 h-4 mr-1.5" />
                <span>Browse Events</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>

              <Link
                to="/organizer/events/new"
                className="btn-secondary text-xs sm:text-sm"
              >
                <span>Create Event</span>
              </Link>
            </div>

            {/* Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-2xl mx-auto">
              <div className="p-3.5 rounded-[12px] bg-[#111A2E] border border-[#1F2D4A] text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                <div className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tabular-nums">
                  100%
                </div>
                <div className="text-[11px] font-medium text-[#7C8BA8] mt-0.5">
                  Verified Passes
                </div>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#111A2E] border border-[#1F2D4A] text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                <div className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tabular-nums">
                  Instant
                </div>
                <div className="text-[11px] font-medium text-[#7C8BA8] mt-0.5">
                  QR Validation
                </div>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#111A2E] border border-[#1F2D4A] text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                <div className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tabular-nums">
                  Live
                </div>
                <div className="text-[11px] font-medium text-[#7C8BA8] mt-0.5">
                  Real-Time Alerts
                </div>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#111A2E] border border-[#1F2D4A] text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                <div className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tabular-nums">
                  Digital
                </div>
                <div className="text-[11px] font-medium text-[#7C8BA8] mt-0.5">
                  Paperless Roster
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Upcoming Events Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-[#1F2D4A]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F1F5F9]">
              Upcoming College Events
            </h2>
            <p className="text-xs sm:text-sm text-[#7C8BA8] mt-0.5">
              Scheduled seminars, workshops, and competitions for this semester
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] self-start sm:self-center transition-colors"
          >
            <span>See full calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="academic-card overflow-hidden space-y-3 p-4"
              >
                <div className="aspect-[16/9] w-full skeleton-shimmer rounded-[10px]" />
                <div className="h-4 skeleton-shimmer rounded w-1/3" />
                <div className="h-5 skeleton-shimmer rounded w-3/4" />
                <div className="h-3 skeleton-shimmer rounded w-full" />
                <div className="h-9 skeleton-shimmer rounded-[10px]" />
              </div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 academic-card p-6 space-y-3">
            <div className="w-12 h-12 rounded-[10px] bg-[#3B82F6]/15 text-[#3B82F6] mx-auto flex items-center justify-center border border-[#3B82F6]/30">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#F1F5F9]">
              No Upcoming Events Scheduled
            </h3>
            <p className="text-xs text-[#7C8BA8] max-w-sm mx-auto">
              Check back soon for upcoming department schedules or view the complete catalog.
            </p>
            <Link
              to="/events"
              className="btn-primary text-xs"
            >
              Browse All Events
            </Link>
          </div>
        ) : (
          /* Event Cards Grid with 60ms stagger */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.slice(0, 3).map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                animationDelay={idx * 60}
                onRegisterClick={handleRegisterClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Categories Filter Strip as Chips */}
      {categories.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F2D4A]">
            <div>
              <h2 className="text-lg font-bold text-[#F1F5F9]">
                Explore by Category
              </h2>
              <p className="text-xs text-[#7C8BA8]">
                Filter events by department or activity focus
              </p>
            </div>
            <Link
              to="/events"
              className="text-xs font-semibold text-[#3B82F6] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/events?category=${cat.id}`}
                className="px-4 py-2 rounded-full bg-[#111A2E] border border-[#1F2D4A] hover:border-[#3B82F6] hover:bg-[#16223B] hover:text-[#F1F5F9] text-xs font-medium text-[#CBD5E1] transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                <span>{cat.name}</span>
                {cat.event_count !== undefined && (
                  <span className="text-[11px] text-[#7C8BA8] font-mono">({cat.event_count})</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3-Step "How it works" Row */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl font-bold text-[#F1F5F9] mt-1">
            Three simple steps to campus event participation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="academic-card p-6 space-y-3 text-left">
            <div className="w-10 h-10 rounded-[10px] bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center font-bold text-sm border border-[#3B82F6]/30">
              <Search className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-[#3B82F6] tracking-wider uppercase">Step 01</div>
            <h3 className="text-base font-bold text-[#F1F5F9]">Explore & Discover</h3>
            <p className="text-xs text-[#7C8BA8] leading-relaxed">
              Browse approved academic seminars, club hackathons, cultural festivals, and athletic tournaments filtered by department.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3 text-left">
            <div className="w-10 h-10 rounded-[10px] bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center font-bold text-sm border border-[#3B82F6]/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-[#3B82F6] tracking-wider uppercase">Step 02</div>
            <h3 className="text-base font-bold text-[#F1F5F9]">Reserve Your Seat</h3>
            <p className="text-xs text-[#7C8BA8] leading-relaxed">
              Register with a single click, complete optional prerequisites, and immediately receive your official digital pass.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3 text-left">
            <div className="w-10 h-10 rounded-[10px] bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center font-bold text-sm border border-[#3B82F6]/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-[#3B82F6] tracking-wider uppercase">Step 03</div>
            <h3 className="text-base font-bold text-[#F1F5F9]">Fast QR Check-in</h3>
            <p className="text-xs text-[#7C8BA8] leading-relaxed">
              Show your verified QR code at the venue gate for instant camera verification and automated attendance logging.
            </p>
          </div>
        </div>
      </section>

      {/* System Features Strip */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 academic-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-[8px] bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F1F5F9]">
                Role-Based Architecture
              </h3>
              <p className="text-xs text-[#7C8BA8] leading-relaxed">
                Dedicated interfaces for Students, Faculty Organizers, and College Administrators with token-based authentication.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-9 h-9 rounded-[8px] bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/30">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F1F5F9]">
                Questionnaires & Forms
              </h3>
              <p className="text-xs text-[#7C8BA8] leading-relaxed">
                Seamless support for Google Forms to collect team submissions, track preferences, or verify prerequisites.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-9 h-9 rounded-[8px] bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F1F5F9]">
                Live QR Verification
              </h3>
              <p className="text-xs text-[#7C8BA8] leading-relaxed">
                Organizers scan student entry passes via camera with instant validation and automatic database attendance logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Event Summary Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Confirm Event Registration"
          maxWidth="md"
          footer={
            <>
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary text-xs h-9"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegistration}
                disabled={regLoading}
                className="btn-primary text-xs h-9"
              >
                {regLoading ? 'Registering...' : 'Confirm Registration'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

            {/* Event Summary Card */}
            <div className="p-4 bg-[#111A2E] rounded-[12px] border border-[#1F2D4A] space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-[#1F2D4A] font-semibold text-[#F1F5F9]">
                <Calendar className="w-4 h-4 text-[#3B82F6]" />
                <span>Event Registration Summary</span>
              </div>
              
              <div className="flex justify-between py-0.5">
                <span className="text-[#7C8BA8]">Event:</span>
                <span className="font-semibold text-[#F1F5F9] text-right max-w-[240px] truncate">{selectedEvent.title}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#7C8BA8]">Date:</span>
                <span className="font-medium text-[#CBD5E1] tabular-nums">{selectedEvent.date}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#7C8BA8]">Time:</span>
                <span className="font-medium text-[#CBD5E1] tabular-nums">{selectedEvent.start_time} - {selectedEvent.end_time}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#7C8BA8]">Venue:</span>
                <span className="font-medium text-[#CBD5E1]">{selectedEvent.venue}</span>
              </div>
              
              <div className="pt-2 border-t border-[#1F2D4A] flex justify-between font-semibold text-xs text-[#F1F5F9]">
                <span className="text-[#7C8BA8]">Seats Available:</span>
                <span className="text-[#3B82F6] font-bold tabular-nums">{selectedEvent.seats_left} seats remaining</span>
              </div>
            </div>

            <p className="text-xs text-[#7C8BA8] leading-relaxed">
              Upon clicking "Confirm Registration", a verified digital pass with QR code will be issued instantly and linked to your student account.
            </p>
          </div>
        </Modal>
      )}

      {/* Ticket Modal with QR Code */}
      {ticketModalReg && (
        <TicketModal
          isOpen={!!ticketModalReg}
          onClose={() => setTicketModalReg(null)}
          registration={ticketModalReg}
        />
      )}
    </div>
  );
};
