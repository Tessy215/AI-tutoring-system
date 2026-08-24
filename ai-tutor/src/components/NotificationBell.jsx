import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2, X, Clock, Award, BookOpen, FileText, CheckSquare, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "../lib/notifications";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef(null);
  const lastNotifCountRef = useRef(0);

  // Initialize sound
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 880; // Hz
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
      
      // Second beep for longer notifications
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 1100;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.1);
      }, 150);
    } catch (error) {
      // Web Audio API not supported, silent fallback
      console.log("Notification sound not supported");
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      
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
    try {
      const notifs = await getUserNotifications(user.$id, 20);
      const count = await getUnreadCount(user.$id);
      
      // Play sound if new unread count increased
      if (count > lastNotifCountRef.current && count > 0) {
        playNotificationSound();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);
      }
      
      lastNotifCountRef.current = count;
      
      setNotifications(notifs || []);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
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

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.$id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case "assignment_due":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "grade_received":
        return <Award className="w-4 h-4 text-green-500" />;
      case "resource_uploaded":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "task_due":
        return <CheckSquare className="w-4 h-4 text-purple-500" />;
      case "assignment_graded":
        return <Award className="w-4 h-4 text-green-500" />;
      case "announcement":
        return <AlertCircle className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case "assignment_due":
        return "border-l-4 border-yellow-500";
      case "grade_received":
        return "border-l-4 border-green-500";
      case "resource_uploaded":
        return "border-l-4 border-blue-500";
      case "task_due":
        return "border-l-4 border-purple-500";
      case "assignment_graded":
        return "border-l-4 border-green-500";
      case "announcement":
        return "border-l-4 border-indigo-500";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className={`w-5 h-5 text-gray-600 transition-transform ${isAnimating ? "animate-bounce" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                title={soundEnabled ? "Sound on" : "Sound off"}
              >
                {soundEnabled ? "🔊" : "🔇"}
              </button>
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
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.$id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${getNotificationColor(notif.type)} ${!notif.read ? "bg-indigo-50/50" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={(e) => handleDelete(notif.$id, e)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(notif.$createdAt)}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.$id);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                      </div>
                      {notif.link && (
                        <span className="text-xs text-indigo-600 mt-1 block hover:underline">
                          View details →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 bg-gray-50 text-center flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {notifications.length > 0 ? `Showing ${notifications.length} notifications` : "No notifications"}
            </span>
            <span className="text-xs text-gray-400">
              {soundEnabled ? "🔊 Sound on" : "🔇 Sound off"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}