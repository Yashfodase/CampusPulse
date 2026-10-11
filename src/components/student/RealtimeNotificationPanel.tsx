import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Clock,
  CheckCircle2,
  CheckCheck,
  Calendar,
  ExternalLink,
  Trash2,
  RefreshCw,
  MapPin,
  Info,
} from 'lucide-react';
import { NotificationType } from '../../types';

interface RealtimeNotificationPanelProps {
  onOpenTicketModal?: (eventId: number) => void;
}

export const RealtimeNotificationPanel: React.FC<RealtimeNotificationPanelProps> = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    triggerReminderCheck,
    sendTestAlert,
    loading,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'reminder' | 'registration_status' | 'unread'>('all');
  const [checking, setChecking] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.is_read;
    if (activeTab === 'reminder') return item.type === 'reminder';
    if (activeTab === 'registration_status') return item.type === 'registration_status';
    return true;
  });

  const handleSyncReminders = async () => {
    setChecking(true);
    await triggerReminderCheck();
    setChecking(false);
  };

  const handleTestAlert = async (type: NotificationType) => {
    setTestSending(true);
    await sendTestAlert(type);
    setTestSending(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-600 text-white">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <span>Campus Alerts & Reminders</span>
            </h2>

            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[11px] font-semibold bg-rose-500 text-white tabular-nums">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time push notifications for event countdowns, check-ins, and registration status.
          </p>
        </div>

        {/* Live Status & Quick Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Connection status */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{isConnected ? 'Sync Active' : 'Connecting...'}</span>
          </div>

          {/* Sync Reminders */}
          <button
            onClick={handleSyncReminders}
            disabled={checking}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-md shadow-2xs transition-colors disabled:opacity-60"
            title="Scan database for upcoming event dates and issue reminders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync</span>
          </button>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-md transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulator Controls Strip */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="text-slate-600 dark:text-slate-300 font-medium">
          Simulate notification events:
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleTestAlert('reminder')}
            disabled={testSending}
            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Clock className="w-3 h-3" />
            <span>Test Reminder</span>
          </button>

          <button
            onClick={() => handleTestAlert('registration_status')}
            disabled={testSending}
            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Test Status</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab('reminder')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
            activeTab === 'reminder'
              ? 'bg-amber-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Reminders</span>
        </button>

        <button
          onClick={() => setActiveTab('registration_status')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
            activeTab === 'registration_status'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Status Updates</span>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
            activeTab === 'unread'
              ? 'bg-rose-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Unread ({unreadCount})</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">Loading alerts...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">No alerts in this view</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Alerts will appear automatically when event dates approach or registrations update.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isReminder = notif.type === 'reminder';
            const isStatus = notif.type === 'registration_status';

            return (
              <div
                key={notif.id}
                className={`p-3.5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  notif.is_read
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    : 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {isReminder ? (
                      <div className="w-7 h-7 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    ) : isStatus ? (
                      <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          isReminder
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : isStatus
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
                        }`}
                      >
                        {isReminder ? 'Reminder' : isStatus ? 'Status' : 'Update'}
                      </span>

                      {!notif.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Unread" />
                      )}

                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {new Date(notif.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4
                      className={`text-xs ${
                        notif.is_read ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-900 dark:text-white font-bold'
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                      {notif.message}
                    </p>

                    {notif.event_venue && (
                      <div className="flex items-center gap-3 pt-0.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{notif.event_venue}</span>
                        </span>
                        {notif.event_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="tabular-nums">{new Date(notif.event_date).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.event_id && (
                    <Link
                      to={`/events/${notif.event_id}`}
                      className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                    >
                      <span>Event</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  )}

                  {!notif.is_read ? (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 rounded transition-colors"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 px-1.5 py-0.5">Read</span>
                  )}

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time WebSocket connection synchronized with college event database.</span>
        </div>
        <Link
          to="/student/registrations"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View Registered Passes
        </Link>
      </div>
    </div>
  );
};
