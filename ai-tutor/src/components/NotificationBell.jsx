import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "../lib/notifications";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const notifs = await getUserNotifications(user.$id, 20);
    const count = await getUnreadCount(user.$id);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(user.$id);
    await loadNotifications();
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    await loadNotifications();
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case "assignment_due":
        return "⏰";
      case "grade_received":
        return "📊";
      case "resource_uploaded":
        return "📚";
      case "task_due":
        return "✅";
      case "recommendation":
        return "💡";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case "assignment_due":
        return "bg-yellow-50 border-yellow-200";
      case "grade_received":
        return "bg-green-50 border-green-200";
      case "resource_uploaded":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.$id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notif.read ? "bg-indigo-50/30" : ""}`}
                >
                  <div className="flex gap-2">
                    <div className="text-xl">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                        <button
                          onClick={(e) => handleDelete(notif.$id, e)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(notif.$createdAt).toLocaleDateString()} {new Date(notif.$createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.$id)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                      </div>
                      {notif.link && (
                        <Link
                          to={notif.link}
                          onClick={() => {
                            handleMarkAsRead(notif.$id);
                            setIsOpen(false);
                          }}
                          className="block mt-2 text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}