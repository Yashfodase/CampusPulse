import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService, adminService } from '../../services/api';
import { CollegeEvent, EventStatus } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import {
  Calendar,
  Users,
  Trash2,
  Search,
  Eye,
  PlusCircle,
} from 'lucide-react';

export const ManageEventsPage: React.FC = () => {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<CollegeEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadEvents();
  }, [statusFilter]);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await eventService.getAll({
        status: statusFilter || undefined,
        sort: 'desc',
      });
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Failed to load events.' });
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (eventId: number, newStatus: EventStatus) => {
    try {
      setAlertInfo(null);
      const res = await adminService.updateEventStatus(eventId, newStatus);
      if (res.success) {
        setAlertInfo({ type: 'success', message: `Event status updated to ${newStatus}.` });
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Failed to update event status.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await eventService.delete(deleteTarget.id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Event permanently deleted.' });
        setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Failed to delete event.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.organizer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Event Moderation & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review event proposals, audit campus schedules, change status, or remove events.
          </p>
        </div>

        <Link
          to="/organizer/events/new"
          className="btn-primary text-xs self-start"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>Post Official Event</span>
        </Link>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Filter and Search Bar */}
      <div className="academic-card p-3 flex flex-col sm:flex-row gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title, organizer, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base text-xs"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-[14px] animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center academic-card space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No events found</h3>
          <p className="text-xs text-slate-500">No events matched the status or search filter.</p>
        </div>
      ) : (
        <div className="academic-card overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Event</th>
                  <th className="py-3 px-4 font-semibold">Organizer</th>
                  <th className="py-3 px-4 font-semibold">Date & Venue</th>
                  <th className="py-3 px-4 font-semibold">Enrollments</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Event Info */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs">
                        <Link to={`/events/${ev.id}`} className="hover:text-indigo-600 transition-colors">
                          {ev.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-indigo-600 font-medium">
                        {ev.category_name} · #{ev.id}
                      </div>
                    </td>

                    {/* Organizer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{ev.organizer_name}</div>
                      <div className="text-[11px] text-slate-400">{ev.organizer_email}</div>
                    </td>

                    {/* Date & Venue */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="tabular-nums font-medium">{ev.date}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        {ev.venue}
                      </div>
                    </td>

                    {/* Registrations */}
                    <td className="py-3 px-4 tabular-nums">
                      <span className="font-semibold text-slate-900">{ev.registered_count}</span>
                      <span className="text-slate-400"> / {ev.max_participants}</span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={ev.status}
                        onChange={(e) => handleStatusChange(ev.id, e.target.value as EventStatus)}
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-[3px] focus:ring-indigo-600/20 focus:border-indigo-600 text-slate-900 capitalize"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/events/${ev.id}`}
                          title="View Details"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-[8px] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/organizer/events/${ev.id}/participants`}
                          title="View Attendees Roster"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-[8px] transition-colors"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(ev)}
                          title="Delete Event"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Admin: Delete Event"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
              className="btn-secondary text-xs h-9"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="btn-danger text-xs h-9"
            >
              {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Are you sure you want to permanently delete <strong className="text-slate-900">{deleteTarget.title}</strong>?
            </p>
            <p className="text-slate-500">
              This will remove the event, its venue bookings, and cancel all {deleteTarget.registered_count} student registrations.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};
