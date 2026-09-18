import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  Check,
  Sparkles,
  FileText,
  Award,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { NotificationType } from '../../types';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'APPLICATION_SHORTLISTED':
      case 'CONTRACT_AWARDED':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'PILOT_ASSIGNED':
      case 'PILOT_STARTED':
        return <Sparkles className="w-5 h-5 text-gov-blue" />;
      case 'SUBMISSION_SUBMITTED':
      case 'EVALUATION_COMPLETED':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'APPLICATION_REJECTED':
      case 'PILOT_FAILED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
            <Bell className="w-5 h-5 text-gov-blue" />
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time procurement workflow updates, review status changes, and evaluator assignments.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-gov-blue bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            Activity and procurement state change notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-2xl border p-5 shadow-card transition-all flex items-start gap-4 ${
                !notif.is_read ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm mt-0.5">
                {getNotificationIcon(notif.notification_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                      {notif.title}
                    </h3>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-gov-blue animate-pulse"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs text-gov-blue hover:underline font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark read
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{notif.message}</p>

                {notif.resource_type && (
                  <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600">
                    Resource: {notif.resource_type} #{notif.resource_id}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
