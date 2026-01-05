import { useState } from 'react';
import { Header } from '../components/layout';
import { Bell, Check, CheckCheck, Trash2, Filter, AlertCircle, MessageSquare, Package, Clock, Loader2 } from 'lucide-react';
import { useInbox } from '../hooks/useInbox';
import type { NotificationType } from '../hooks/useInbox';

const typeIcons: Record<NotificationType, React.ElementType> = {
  alert: AlertCircle,
  message: MessageSquare,
  update: Package,
  system: Bell,
};

const priorityStyles = {
  high: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  medium: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
  low: 'border-l-slate-300 bg-white dark:bg-slate-800',
};

const tabs = ['All', 'Unread', 'Alerts', 'Messages'];

export function Notifications() {
  const [activeTab, setActiveTab] = useState('All');
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatTimestamp,
  } = useInbox();

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'Unread') return !n.read;
    if (activeTab === 'Alerts') return n.type === 'alert';
    if (activeTab === 'Messages') return n.type === 'message';
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  return (
    <div className="min-h-screen">
      <Header title="Inbox" />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                {tab}
                {tab === 'Unread' && unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] rounded-full leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Notifications List */}
        {!loading && (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <div
                  key={notification.id}
                  className={`border-l-4 rounded-lg p-4 transition-all hover:shadow-md ${priorityStyles[notification.priority]
                    } ${!notification.read ? 'ring-1 ring-primary-200 dark:ring-primary-800' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${notification.type === 'alert' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      notification.type === 'message' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                        notification.type === 'update' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600'
                      }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-medium ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notification.created_at)}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No notifications
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  You're all caught up! Check back later.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
