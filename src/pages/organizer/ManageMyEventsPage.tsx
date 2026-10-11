import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/api';
import { CollegeEvent } from '../../types';
import { Modal } from '../../components/common/Modal';
import { QRScannerModal } from '../../components/organizer/QRScannerModal';
import { Alert } from '../../components/common/Alert';
import {
  Calendar,
  Users,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Camera,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const ManageMyEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Scanner modal state
  const [scanningEvent, setScanningEvent] = useState<CollegeEvent | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<CollegeEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadEvents();
  }, [user]);

  async function loadEvents() {
    if (!user) return;
    try {
      setLoading(true);
      const res = await eventService.getAll({ organizer_id: user.id });
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error('Failed to load organizer events', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await eventService.delete(deleteTarget.id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Event deleted successfully.' });
        setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to delete event.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Manage My Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Update event information, review attendee registrations, or admit attendees.
          </p>
        </div>

        <Link
          to="/organizer/events/new"
          className="btn-primary text-xs self-start"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>New Event</span>
        </Link>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Search Bar */}
      <div className="academic-card p-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter your events by title or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base pl-9 text-xs"
          />
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-[14px] animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center academic-card space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No events matched</h3>
          <p className="text-xs text-slate-500">
            {searchTerm ? 'No events found matching your search term.' : "You haven't posted any events yet."}
          </p>
        </div>
      ) : (
        <div className="academic-card overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Event</th>
                  <th className="py-3 px-4 font-semibold">Schedule</th>
                  <th className="py-3 px-4 font-semibold">Venue</th>
                  <th className="py-3 px-4 font-semibold">Capacity</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Event Title & Category */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs">
                        <Link to={`/events/${ev.id}`} className="hover:text-indigo-600 transition-colors">
                          {ev.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-indigo-600 font-medium">{ev.category_name}</span>
                        {ev.google_form_url && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
                            <FileText className="w-2.5 h-2.5" />
                            <span>Form Attached</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      <div>{ev.date}</div>
                      <div className="text-slate-400 text-[11px]">
                        {ev.start_time} - {ev.end_time}
                      </div>
                    </td>

                    {/* Venue */}
                    <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate">
                      {ev.venue}
                    </td>

                    {/* Capacity */}
                    <td className="py-3 px-4 tabular-nums">
                      <div className="font-medium text-slate-800">
                        {ev.registered_count} / {ev.max_participants}
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((ev.registered_count / ev.max_participants) * 100))}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`capitalize px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        ev.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ev.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {ev.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ev.google_form_url && (
                          <a
                            href={ev.google_form_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Google Form Responses / Form Link"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-[8px] transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setScanningEvent(ev)}
                          title="Open Entry Gate QR Scanner"
                          className="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-[8px] flex items-center gap-1 font-semibold text-[11px] transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Scan QR</span>
                        </button>
                        <Link
                          to={`/organizer/events/${ev.id}/participants`}
                          title="View Registered Students"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-[8px] transition-colors"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/organizer/events/${ev.id}/edit`}
                          title="Edit Event"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-[8px] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Event"
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
              {deleteLoading ? 'Deleting...' : 'Delete Event'}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.title}</strong>?
            </p>
            <p className="text-slate-500">
              This action cannot be undone. All student registrations associated with this event will also be removed.
            </p>
          </div>
        )}
      </Modal>

      {/* Entry Gate QR Scanner Modal */}
      {scanningEvent && (
        <QRScannerModal
          isOpen={Boolean(scanningEvent)}
          onClose={() => setScanningEvent(null)}
          eventId={scanningEvent.id}
          eventTitle={scanningEvent.title}
          onAttendeeAdmitted={() => {
            loadEvents();
          }}
        />
      )}

    </div>
  );
};
