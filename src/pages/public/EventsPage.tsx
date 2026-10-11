import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CollegeEvent, Category, Registration } from '../../types';
import { eventService, categoryService, registrationService } from '../../services/api';
import { EventCard } from '../../components/common/EventCard';
import { Modal } from '../../components/common/Modal';
import { TicketModal } from '../../components/common/TicketModal';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  RotateCcw,
  X,
  Calendar,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state from URL search params
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedDate = searchParams.get('date') || '';
  const sortOrder = searchParams.get('sort') || 'asc';

  // Registration modal
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ticketModalReg, setTicketModalReg] = useState<Registration | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await categoryService.getAll();
        if (res.success) setCategories(res.categories);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await eventService.getAll({
          q: searchQuery,
          category: selectedCategory,
          date: selectedDate,
          sort: sortOrder as 'asc' | 'desc',
          status: 'approved',
        });
        if (res.success) {
          setEvents(res.events);
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [searchQuery, selectedCategory, selectedDate, sortOrder]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

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
          message: 'Registration confirmed. Your digital pass is generated.',
        });
        setEvents((prev) =>
          prev.map((e) =>
            e.id === selectedEvent.id
              ? {
                  ...e,
                  is_registered: true,
                  registered_count: e.registered_count + 1,
                  seats_left: Math.max(0, e.seats_left - 1),
                }
              : e
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
      const msg = err.response?.data?.message || 'Failed to complete registration.';
      setAlertInfo({ type: 'error', message: msg });
    } finally {
      setRegLoading(false);
    }
  };

  const activeFiltersCount = [searchQuery, selectedCategory, selectedDate].filter(Boolean).length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campus Events Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Browse and filter academic seminars, club hackathons, cultural festivals, and sports events.
          </p>
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-[10px] bg-rose-50 border border-rose-200 self-start sm:self-auto transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear {activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''}</span>
          </button>
        )}
      </div>

      {/* Sticky Filter and Search Bar Card */}
      <div className="sticky top-16 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-2">
        <div className="academic-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] space-y-3">
          {/* Top search & Sort row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by event title, keywords, or topics..."
                value={searchQuery}
                onChange={(e) => updateParam('q', e.target.value)}
                className="input-base pl-10 pr-9 text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => updateParam('q', '')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Date Picker */}
            <div className="md:col-span-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => updateParam('date', e.target.value)}
                className="input-base text-xs sm:text-sm"
                title="Filter by event date"
              />
            </div>

            {/* Sort order select */}
            <div className="md:col-span-2">
              <select
                value={sortOrder}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-base text-xs sm:text-sm"
              >
                <option value="asc">Soonest Date First</option>
                <option value="desc">Furthest Date First</option>
              </select>
            </div>
          </div>

          {/* Category Filter Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <button
              onClick={() => updateParam('category', '')}
              className={`px-3.5 py-1.5 rounded-[10px] text-xs font-medium whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories ({events.length})
            </button>

            {categories.map((c) => {
              const isSelected = selectedCategory === String(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => updateParam('category', isSelected ? '' : String(c.id))}
                  className={`px-3.5 py-1.5 rounded-[10px] text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{c.name}</span>
                  {isSelected && <X className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div>
          Showing <strong className="text-slate-800 tabular-nums">{events.length}</strong> event{events.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="academic-card overflow-hidden animate-pulse space-y-3 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            >
              <div className="aspect-[16/9] w-full bg-slate-200 rounded-[10px]" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-9 bg-slate-200 rounded-[10px]" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 academic-card p-6 space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="w-12 h-12 rounded-[10px] bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Events Found Matching Your Filter
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or exploring other categories.
          </p>
          <button
            onClick={handleResetFilters}
            className="btn-primary text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        /* Grid of Events */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, idx) => (
            <EventCard
              key={event.id}
              event={event}
              animationDelay={idx * 60}
              onRegisterClick={handleRegisterClick}
            />
          ))}
        </div>
      )}

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
            <div className="p-4 bg-slate-50 rounded-[12px] border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Event Registration Summary</span>
              </div>
              
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Event:</span>
                <span className="font-semibold text-slate-900 text-right max-w-[240px] truncate">{selectedEvent.title}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-800 tabular-nums">{selectedEvent.date}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Time:</span>
                <span className="font-medium text-slate-800 tabular-nums">{selectedEvent.start_time} - {selectedEvent.end_time}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Venue:</span>
                <span className="font-medium text-slate-800">{selectedEvent.venue}</span>
              </div>
              
              <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-xs text-slate-900">
                <span className="text-slate-600">Seats Available:</span>
                <span className="text-indigo-600 font-bold tabular-nums">{selectedEvent.seats_left} seats remaining</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
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
