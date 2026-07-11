import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { getLogs, getLogsByType, deleteOldLogs } from "../lib/logService";
import { 
  Search, Filter, Calendar, User, Activity, 
  Trash2, X, RefreshCw, AlertCircle, Clock,
  LogIn, LogOut, Edit, Plus, Trash, Eye
} from "lucide-react";

export default function SystemLogs() {
  const { userProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearDays, setClearDays] = useState(30);
  const [isClearing, setIsClearing] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);

  // Moved loadLogs BEFORE useEffect
  const loadLogs = async () => {
    setLoading(true);
    try {
      const logsData = await getLogs(200);
      setLogs(logsData);
      setFilteredLogs(logsData);
      setTotalLogs(logsData.length);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Moved handleSearch BEFORE useEffect
  const handleSearch = () => {
    let filtered = [...logs];
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(log => log.type === typeFilter);
    }
    
    setFilteredLogs(filtered);
  };

  // Redirect after hooks
  useEffect(() => {
    if (userProfile?.role === "admin") {
      loadLogs();
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.role === "admin") {
      handleSearch();
    }
  }, [searchTerm, typeFilter, logs]);

  if (userProfile?.role !== "admin") {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">This page is only available for administrators.</p>
        </div>
      </div>
    );
  }

  const handleTypeFilter = async (type) => {
    setTypeFilter(type);
    if (type === "all") {
      loadLogs();
    } else {
      const filtered = await getLogsByType(type, 200);
      setLogs(filtered);
      setFilteredLogs(filtered);
      setTotalLogs(filtered.length);
    }
  };

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const deleted = await deleteOldLogs(clearDays);
      alert(`Deleted ${deleted} logs older than ${clearDays} days`);
      loadLogs();
      setShowClearModal(false);
    } catch (error) {
      console.error("Error clearing logs:", error);
      alert("Failed to clear logs");
    } finally {
      setIsClearing(false);
    }
  };

  const refreshLogs = () => {
    loadLogs();
  };

  const getActionIcon = (action) => {
    if (action.includes("Logged in")) return <LogIn className="w-4 h-4 text-green-500" />;
    if (action.includes("Logged out")) return <LogOut className="w-4 h-4 text-red-500" />;
    if (action.includes("Created")) return <Plus className="w-4 h-4 text-blue-500" />;
    if (action.includes("Edited") || action.includes("Updated")) return <Edit className="w-4 h-4 text-yellow-500" />;
    if (action.includes("Deleted")) return <Trash className="w-4 h-4 text-red-500" />;
    if (action.includes("Viewed")) return <Eye className="w-4 h-4 text-purple-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case "auth": return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Auth</span>;
      case "user": return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">User</span>;
      case "system": return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">System</span>;
      case "resource": return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">Resource</span>;
      case "assignment": return <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">Assignment</span>;
      default: return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{type}</span>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">View all system activity and user actions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshLogs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Old Logs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
          <p className="text-sm text-gray-500">Total Logs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-blue-600">
            {logs.filter(l => l.type === "auth").length}
          </p>
          <p className="text-sm text-gray-500">Auth Events</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.type === "user" || l.type === "resource" || l.type === "assignment").length}
          </p>
          <p className="text-sm text-gray-500">User Actions</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-purple-600">
            {logs.filter(l => l.type === "system").length}
          </p>
          <p className="text-sm text-gray-500">System Events</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="auth">Auth</option>
              <option value="user">User</option>
              <option value="system">System</option>
              <option value="resource">Resource</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">User</th>
                <th className="text-left p-4 font-semibold text-gray-700">Action</th>
                <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                <th className="text-left p-4 font-semibold text-gray-700">Details</th>
                <th className="text-left p-4 font-semibold text-gray-700">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.$id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {log.userName?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{log.userName || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{log.userId?.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm text-gray-700">{log.action}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getTypeBadge(log.type)}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">{log.details || "-"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(log.$createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Logs Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">Clear Old Logs</h2>
              <button
                onClick={() => setShowClearModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ This will permanently delete logs older than the specified number of days.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delete logs older than (days)
                </label>
                <input
                  type="number"
                  value={clearDays}
                  onChange={(e) => setClearDays(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 30 days. Minimum: 1 day.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLogs}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isClearing ? "Clearing..." : "Clear Logs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}